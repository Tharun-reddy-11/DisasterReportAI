package com.disasterreportai.api;

import com.disasterreportai.incident.*;
import com.disasterreportai.report.*;
import com.disasterreportai.user.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.net.*;
import java.time.*;
import java.util.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
  private final ReportRepository reports;
  private final IncidentRepository incidents;
  private final IncidentReportRepository incidentReports;
  private final UserRepository users;
  private final ObjectMapper json;
  private final String mlUrl;

  public ReportController(
      ReportRepository r,
      IncidentRepository inc,
      IncidentReportRepository ir,
      UserRepository u,
      ObjectMapper j,
      @Value("${app.ml-url}") String endpoint) {
    this.reports = r;
    this.incidents = inc;
    this.incidentReports = ir;
    this.users = u;
    this.json = j;
    this.mlUrl = endpoint;
  }

  record CreateReport(
      @NotBlank @Size(max = 160) String title,
      @NotBlank @Size(min = 8, max = 8000) String description,
      String reportedCategory,
      @NotBlank String locationText,
      String landmark,
      @NotNull LocalDateTime incidentAt,
      Double latitude,
      Double longitude,
      @Min(0) Integer affectedPeople,
      @Min(0) Integer injuredPeople,
      @Min(0) Integer trappedPeople,
      String resources,
      boolean hasImage,
      boolean hasAudio
  ) {}

  @GetMapping
  public List<Map<String, Object>> list(Authentication auth) {
    return reports.findByOwnerOrderByCreatedAtDesc(me(auth)).stream().map(this::view).toList();
  }

  @GetMapping("/summary")
  public Map<String, Object> summary(Authentication auth) {
    var all = reports.findByOwnerOrderByCreatedAtDesc(me(auth));
    Map<String, Long> categories = new TreeMap<>(), priorities = new TreeMap<>();
    for (var r : all) {
      if (r.getAnalysis() != null) {
        categories.merge(r.getAnalysis().getCategory(), 1L, Long::sum);
        priorities.merge(r.getAnalysis().getPriority(), 1L, Long::sum);
      }
    }
    return Map.of(
        "total", all.size(),
        "underAnalysis", all.stream().filter(r -> "ANALYSIS_PENDING".equals(r.getStatus())).count(),
        "review", all.stream().filter(r -> "AWAITING_REVIEW".equalsIgnoreCase(r.getOfficialStatus())).count(),
        "resolved", all.stream().filter(r -> "RESOLVED".equalsIgnoreCase(r.getOfficialStatus())).count(),
        "categories", categories,
        "priorities", priorities
    );
  }

  @GetMapping("/{id}")
  public ResponseEntity<?> one(@PathVariable String id, Authentication a) {
    return reports.findByPublicIdAndOwner(id, me(a))
        .<ResponseEntity<?>>map(r -> ResponseEntity.ok(view(r)))
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @PostMapping
  public ResponseEntity<?> create(@Valid @RequestBody CreateReport body, Authentication auth) {
    Report r = new Report();
    r.setPublicId("RPT-" + (1000 + (int)(Math.random() * 9000)));
    r.setOwner(me(auth));
    r.setTitle(body.title());
    r.setDescription(body.description());
    r.setReportedCategory(body.reportedCategory());
    r.setLocationText(body.locationText());
    r.setLandmark(body.landmark());
    r.setIncidentAt(body.incidentAt());
    r.setLatitude(body.latitude());
    r.setLongitude(body.longitude());
    r.setAffectedPeople(body.affectedPeople());
    r.setInjuredPeople(body.injuredPeople());
    r.setTrappedPeople(body.trappedPeople());
    r.setResources(body.resources());
    r.setHasImage(body.hasImage());
    r.setHasAudio(body.hasAudio());
    r.setStatus("ANALYSIS_PENDING");
    r.setOfficialStatus("AWAITING_REVIEW");
    reports.save(r);
    return analyseSavedReport(r, HttpStatus.CREATED);
  }

  @PostMapping("/{id}/retry-analysis")
  public ResponseEntity<?> retry(@PathVariable String id, Authentication auth) {
    var r = reports.findByPublicIdAndOwner(id, me(auth)).orElseThrow();
    return analyseSavedReport(r, HttpStatus.OK);
  }

  private ResponseEntity<?> analyseSavedReport(Report r, HttpStatus successStatus) {
    try {
      Map<?, ?> prediction = callMl(analysisRequest(r));
      saveAnalysis(r, prediction);
      r.setStatus("REVIEW_RECOMMENDED");
      reports.save(r);

      // Check duplicate/incident grouping
      linkOrCreateIncident(r, prediction);

      return ResponseEntity.status(successStatus).body(Map.of(
          "report", view(r),
          "message", "Report saved and successfully analyzed by ML models. Forwarded to Government Official Dashboard."
      ));
    } catch (Exception e) {
      System.err.println("ML analysis request failed: " + e.getClass().getSimpleName() + " — " + e.getMessage());
      r.setStatus("ANALYSIS_PENDING");
      reports.save(r);
      return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
          "report", view(r),
          "message", "Report saved. ML analysis is processing or temporarily unavailable; you can retry anytime."
      ));
    }
  }

  private void linkOrCreateIncident(Report r, Map<?, ?> prediction) {
    try {
      Set<Report> candidateReports = new LinkedHashSet<>();

      // 1. Check ML duplicate analysis related report IDs
      Object dupObj = prediction != null ? prediction.get("duplicate_analysis") : null;
      if (dupObj instanceof Map<?, ?> dupMap) {
        Object relatedIds = dupMap.get("related_report_ids");
        if (relatedIds instanceof List<?> list) {
          for (Object otherId : list) {
            String oid = String.valueOf(otherId);
            reports.findByPublicId(oid).ifPresent(candidateReports::add);
          }
        }
      }

      // 2. Check location matching: reports from the same location or nearby
      String curLoc = r.getLocationText() != null ? r.getLocationText().toLowerCase().trim() : "";
      if (!curLoc.isEmpty()) {
        for (Report other : reports.findAll()) {
          if (other.getId().equals(r.getId())) continue;
          String oLoc = other.getLocationText() != null ? other.getLocationText().toLowerCase().trim() : "";
          if (!oLoc.isEmpty() && (oLoc.equals(curLoc) || curLoc.contains(oLoc) || oLoc.contains(curLoc))) {
            candidateReports.add(other);
          }
        }
      }

      // 3. If any candidate report is already linked to an incident, link this report to that incident
      for (Report candidate : candidateReports) {
        List<IncidentReport> irs = incidentReports.findByReportId(candidate.getId());
        if (!irs.isEmpty()) {
          Incident inc = irs.get(0).getIncident();
          List<IncidentReport> curIrs = incidentReports.findByReportId(r.getId());
          if (curIrs.isEmpty()) {
            IncidentReport newLink = new IncidentReport();
            newLink.setIncident(inc);
            newLink.setReport(r);
            newLink.setSimilarityScore(0.92);
            incidentReports.save(newLink);

            // Update incident totals
            inc.setAffectedPeopleTotal(inc.getAffectedPeopleTotal() + Objects.requireNonNullElse(r.getAffectedPeople(), 0));
            inc.setTrappedPeopleTotal(inc.getTrappedPeopleTotal() + Objects.requireNonNullElse(r.getTrappedPeople(), 0));
            inc.setInjuredPeopleTotal(inc.getInjuredPeopleTotal() + Objects.requireNonNullElse(r.getInjuredPeople(), 0));
            if (r.getAnalysis() != null && "high".equalsIgnoreCase(r.getAnalysis().getPriority())) {
              inc.setSeverityLevel("CRITICAL_REVIEW");
              inc.setSeverityScore(Math.max(inc.getSeverityScore(), r.getAnalysis().getSeverityScore()));
            }
            incidents.save(inc);
          }
          return;
        }
      }

      // 4. If candidates exist but NONE have an incident yet, create a consolidated incident cluster for all of them!
      if (!candidateReports.isEmpty()) {
        Incident inc = new Incident();
        inc.setIncidentCode("INC-" + Year.now().getValue() + "-" + (100 + (int)(Math.random() * 900)));
        inc.setTitle(r.getTitle());
        inc.setCategory(r.getAnalysis() != null ? r.getAnalysis().getCategory() : r.getReportedCategory());
        inc.setPrimaryLocation(r.getLocationText());
        inc.setLatitude(r.getLatitude());
        inc.setLongitude(r.getLongitude());

        int totalAff = Objects.requireNonNullElse(r.getAffectedPeople(), 0);
        int totalTrap = Objects.requireNonNullElse(r.getTrappedPeople(), 0);
        int totalInj = Objects.requireNonNullElse(r.getInjuredPeople(), 0);

        for (Report cand : candidateReports) {
          totalAff += Objects.requireNonNullElse(cand.getAffectedPeople(), 0);
          totalTrap += Objects.requireNonNullElse(cand.getTrappedPeople(), 0);
          totalInj += Objects.requireNonNullElse(cand.getInjuredPeople(), 0);
        }

        inc.setAffectedPeopleTotal(totalAff);
        inc.setTrappedPeopleTotal(totalTrap);
        inc.setInjuredPeopleTotal(totalInj);
        inc.setSeverityLevel(totalTrap > 0 || (r.getAnalysis() != null && "high".equalsIgnoreCase(r.getAnalysis().getPriority())) ? "CRITICAL_REVIEW" : "URGENT_REVIEW");
        inc.setSeverityScore(r.getAnalysis() != null ? r.getAnalysis().getSeverityScore() : 70);
        inc.setStatus("AWAITING_REVIEW");
        inc.setVerificationStatus("MULTI_REPORT_CORROBORATED");
        inc.setAiSummary(r.getAnalysis() != null ? r.getAnalysis().getSummary() : "Corroborated incident cluster formed from multiple citizen observations in " + r.getLocationText());
        inc = incidents.save(inc);

        // Link candidate reports
        for (Report cand : candidateReports) {
          IncidentReport ir = new IncidentReport();
          ir.setIncident(inc);
          ir.setReport(cand);
          ir.setSimilarityScore(0.95);
          incidentReports.save(ir);
        }

        // Link current report
        IncidentReport irCur = new IncidentReport();
        irCur.setIncident(inc);
        irCur.setReport(r);
        irCur.setSimilarityScore(1.0);
        incidentReports.save(irCur);
        return;
      }

      // 5. If no other report exists yet, create single incident if priority is high or trapped victims present
      if (r.getAnalysis() != null && ("high".equalsIgnoreCase(r.getAnalysis().getPriority()) || Objects.requireNonNullElse(r.getTrappedPeople(), 0) > 0)) {
        Incident inc = new Incident();
        inc.setIncidentCode("INC-" + Year.now().getValue() + "-" + (100 + (int)(Math.random() * 900)));
        inc.setTitle(r.getTitle());
        inc.setCategory(r.getAnalysis().getCategory());
        inc.setPrimaryLocation(r.getLocationText());
        inc.setLatitude(r.getLatitude());
        inc.setLongitude(r.getLongitude());
        inc.setSeverityLevel("CRITICAL_REVIEW");
        inc.setSeverityScore(r.getAnalysis().getSeverityScore());
        inc.setStatus("AWAITING_REVIEW");
        inc.setVerificationStatus("UNVERIFIED_CITIZEN_REPORTS");
        inc.setAiSummary(r.getAnalysis().getSummary());
        inc.setAffectedPeopleTotal(Objects.requireNonNullElse(r.getAffectedPeople(), 0));
        inc.setTrappedPeopleTotal(Objects.requireNonNullElse(r.getTrappedPeople(), 0));
        inc.setInjuredPeopleTotal(Objects.requireNonNullElse(r.getInjuredPeople(), 0));
        inc = incidents.save(inc);

        IncidentReport ir = new IncidentReport();
        ir.setIncident(inc);
        ir.setReport(r);
        ir.setSimilarityScore(1.0);
        incidentReports.save(ir);
      }
    } catch (Exception e) {
      System.err.println("Incident linking warning: " + e.getMessage());
    }
  }

  private Map<String, Object> analysisRequest(Report r) {
    Map<String, Object> req = new LinkedHashMap<>();
    req.put("report_id", r.getPublicId());
    req.put("title", r.getTitle());
    req.put("description", r.getDescription());
    req.put("reported_category", Objects.toString(r.getReportedCategory(), ""));
    req.put("location", r.getLocationText());
    req.put("landmark", Objects.toString(r.getLandmark(), ""));
    req.put("latitude", r.getLatitude());
    req.put("longitude", r.getLongitude());
    req.put("affected_people", Objects.requireNonNullElse(r.getAffectedPeople(), 0));
    req.put("injured_people", Objects.requireNonNullElse(r.getInjuredPeople(), 0));
    req.put("trapped_people", Objects.requireNonNullElse(r.getTrappedPeople(), 0));
    req.put("resources", Objects.toString(r.getResources(), ""));
    req.put("has_image", r.hasImage());
    req.put("has_audio", r.hasAudio());

    // Pass existing recent reports for duplicate & correlation detection
    List<Map<String, Object>> existing = reports.findAll().stream()
        .filter(other -> !other.getPublicId().equals(r.getPublicId()))
        .map(other -> Map.<String, Object>of(
            "report_id", other.getPublicId(),
            "title", other.getTitle(),
            "description", other.getDescription(),
            "location", other.getLocationText()
        ))
        .toList();
    req.put("existing_reports", existing);

    return req;
  }

  private void saveAnalysis(Report r, Map<?, ?> p) {
    Analysis a = r.getAnalysis() != null ? r.getAnalysis() : new Analysis();
    a.setReport(r);
    a.setCategory((String) p.get("category"));
    a.setConfidence(((Number) p.get("confidence")).doubleValue());
    a.setPriority((String) p.get("priority"));
    a.setSeverityScore(((Number) p.get("severity_score")).intValue());
    a.setEvidenceScore(((Number) p.get("evidence_score")).intValue());
    a.setSummary((String) p.get("summary"));

    Object extracted = p.get("extracted");
    a.setExtractionJson(write(extracted));

    // Update coordinates if geocoding resolved them and report coordinates were null
    if (extracted instanceof Map<?, ?> extMap) {
      if (r.getLatitude() == null && extMap.get("latitude") instanceof Number latNum) {
        r.setLatitude(latNum.doubleValue());
      }
      if (r.getLongitude() == null && extMap.get("longitude") instanceof Number lngNum) {
        r.setLongitude(lngNum.doubleValue());
      }
    }

    // Set recommended emergency team if available
    Object recObj = p.get("recommendation");
    if (recObj instanceof Map<?, ?> recMap && r.getAssignedTeam() == null) {
      Object team = recMap.get("team");
      if (team != null) r.setAssignedTeam(team.toString());
    }

    a.setEvidenceJson(write(Map.of(
        "evidence", p.get("evidence"),
        "caveats", p.get("caveats"),
        "duplicate_analysis", Objects.requireNonNullElse(p.get("duplicate_analysis"), Map.of()),
        "recommendation", Objects.requireNonNullElse(p.get("recommendation"), Map.of()),
        "model", p.get("model")
    )));
    r.setAnalysis(a);
  }

  @SuppressWarnings("unchecked")
  private Map<?, ?> callMl(Map<?, ?> request) throws Exception {
    var connection = (HttpURLConnection) new URL(mlUrl + "/api/v1/analyze").openConnection();
    connection.setRequestMethod("POST");
    connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
    connection.setConnectTimeout(8000);
    connection.setReadTimeout(12000);
    connection.setDoOutput(true);

    byte[] payload = json.writeValueAsBytes(request);
    connection.setFixedLengthStreamingMode(payload.length);
    try (var output = connection.getOutputStream()) {
      output.write(payload);
    }
    int status = connection.getResponseCode();
    if (status < 200 || status > 299) {
      throw new IllegalStateException("ML service returned HTTP " + status);
    }
    try (var input = connection.getInputStream()) {
      return json.readValue(input, Map.class);
    }
  }

  private String write(Object o) {
    try {
      return json.writeValueAsString(o);
    } catch (Exception e) {
      return "{}";
    }
  }

  private User me(Authentication a) {
    return users.findById((Long) a.getPrincipal()).orElseThrow();
  }

  private Map<String, Object> view(Report r) {
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("id", r.getPublicId());
    m.put("title", r.getTitle());
    m.put("description", r.getDescription());
    m.put("location", r.getLocationText());
    m.put("landmark", r.getLandmark());
    m.put("incidentAt", r.getIncidentAt());
    m.put("reportedCategory", r.getReportedCategory());
    m.put("affectedPeople", r.getAffectedPeople());
    m.put("injuredPeople", r.getInjuredPeople());
    m.put("trappedPeople", r.getTrappedPeople());
    m.put("resources", r.getResources());
    m.put("latitude", r.getLatitude());
    m.put("longitude", r.getLongitude());
    m.put("hasImage", r.hasImage());
    m.put("hasAudio", r.hasAudio());
    m.put("status", r.getStatus());
    m.put("officialStatus", r.getOfficialStatus());
    m.put("officialRemarks", r.getOfficialRemarks());
    m.put("assignedTeam", r.getAssignedTeam());
    m.put("verified", r.isVerified());
    m.put("createdAt", r.getCreatedAt());

    if (r.getAnalysis() != null) {
      var x = r.getAnalysis();
      m.put("analysis", Map.of(
          "category", x.getCategory(),
          "confidence", x.getConfidence(),
          "priority", x.getPriority(),
          "severityScore", x.getSeverityScore(),
          "evidenceScore", x.getEvidenceScore(),
          "summary", x.getSummary(),
          "extracted", read(x.getExtractionJson()),
          "support", read(x.getEvidenceJson())
      ));
    }
    return m;
  }

  private Object read(String v) {
    if (v == null || v.isBlank()) return Map.of();
    try {
      return json.readValue(v, new TypeReference<Object>() {});
    } catch (Exception e) {
      return Map.of();
    }
  }
}
