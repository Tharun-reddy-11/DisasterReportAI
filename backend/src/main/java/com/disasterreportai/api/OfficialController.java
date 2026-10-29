package com.disasterreportai.api;

import com.disasterreportai.incident.*;
import com.disasterreportai.report.*;
import com.disasterreportai.user.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/official")
@Transactional(readOnly = true)
public class OfficialController {

  private final ReportRepository reports;
  private final IncidentRepository incidents;
  private final IncidentReportRepository incidentReports;
  private final OfficialReviewRepository reviews;
  private final UserRepository users;
  private final ObjectMapper json;

  public OfficialController(
      ReportRepository reports,
      IncidentRepository incidents,
      IncidentReportRepository incidentReports,
      OfficialReviewRepository reviews,
      UserRepository users,
      ObjectMapper json) {
    this.reports = reports;
    this.incidents = incidents;
    this.incidentReports = incidentReports;
    this.reviews = reviews;
    this.users = users;
    this.json = json;
  }

  record OfficialReviewRequest(
      String reportId,
      String incidentCode,
      @NotBlank String status,
      String assignedTeam,
      String officialRemarks,
      String priorityOverride,
      Boolean verified
  ) {}

  @GetMapping("/dashboard/stats")
  public Map<String, Object> getDashboardStats() {
    List<Report> all = reports.findAll();
    long totalReports = all.size();
    long awaitingReview = all.stream().filter(r -> "AWAITING_REVIEW".equalsIgnoreCase(r.getOfficialStatus())).count();
    long activeIncidents = incidents.count();
    long criticalPriority = all.stream().filter(r -> {
      if (r.getAnalysis() == null) return false;
      return "high".equalsIgnoreCase(r.getAnalysis().getPriority()) ||
             (r.getAnalysis().getSeverityScore() != null && r.getAnalysis().getSeverityScore() >= 75);
    }).count();

    long teamsDispatched = all.stream().filter(r -> r.getAssignedTeam() != null && !r.getAssignedTeam().isBlank()).count();

    int totalAffectedCitizens = all.stream()
        .mapToInt(r -> Objects.requireNonNullElse(r.getAffectedPeople(), 0))
        .sum();

    long verifiedCount = all.stream().filter(Report::isVerified).count();
    double verifiedRate = totalReports > 0 ? Math.round(((double) verifiedCount / totalReports) * 100.0) : 0.0;

    return Map.of(
        "totalReports", totalReports,
        "awaitingReview", awaitingReview,
        "activeIncidents", activeIncidents,
        "criticalPriority", criticalPriority,
        "teamsDispatched", teamsDispatched,
        "totalAffectedCitizens", totalAffectedCitizens,
        "verifiedRate", verifiedRate
    );
  }

  @GetMapping("/reports")
  public List<Map<String, Object>> listAllReports() {
    return reports.findAllByOrderByCreatedAtDesc().stream().map(this::viewOfficialReport).toList();
  }

  @GetMapping("/reports/{id}")
  public ResponseEntity<?> getReportDetail(@PathVariable String id) {
    return reports.findByPublicId(id)
        .map(r -> ResponseEntity.ok(viewOfficialReport(r)))
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @GetMapping("/incidents")
  public List<Map<String, Object>> listIncidents() {
    return incidents.findAllByOrderByCreatedAtDesc().stream().map(this::viewIncident).toList();
  }

  @GetMapping("/analytics")
  public Map<String, Object> getAnalytics() {
    List<Report> all = reports.findAll();

    // 1. Category distribution (Pie Chart)
    Map<String, Long> categoryCounts = new LinkedHashMap<>();
    categoryCounts.put("Flood", 0L);
    categoryCounts.put("Fire", 0L);
    categoryCounts.put("Cyclone / Storm", 0L);
    categoryCounts.put("Earthquake", 0L);
    categoryCounts.put("Infrastructure", 0L);
    categoryCounts.put("Other", 0L);

    for (Report r : all) {
      String cat = r.getReportedCategory();
      if (r.getAnalysis() != null && r.getAnalysis().getCategory() != null) {
        String mlCat = r.getAnalysis().getCategory().toLowerCase();
        if (mlCat.contains("flood")) cat = "Flood";
        else if (mlCat.contains("fire")) cat = "Fire";
        else if (mlCat.contains("cyclone") || mlCat.contains("storm")) cat = "Cyclone / Storm";
        else if (mlCat.contains("earthquake")) cat = "Earthquake";
        else if (mlCat.contains("infrastructure")) cat = "Infrastructure";
        else cat = "Other";
      }
      if (cat == null || cat.isBlank()) cat = "Other";
      categoryCounts.merge(cat, 1L, Long::sum);
    }

    List<Map<String, Object>> categoryPieData = categoryCounts.entrySet().stream()
        .map(e -> {
          String color = switch (e.getKey()) {
            case "Flood" -> "#0284c7";
            case "Fire" -> "#ea580c";
            case "Cyclone / Storm" -> "#0d9488";
            case "Earthquake" -> "#e11d48";
            case "Infrastructure" -> "#d97706";
            default -> "#64748b";
          };
          return Map.<String, Object>of("name", e.getKey(), "value", e.getValue(), "color", color);
        })
        .toList();

    // 2. Priority breakdown (Bar Chart)
    Map<String, Long> priorityCounts = new LinkedHashMap<>();
    priorityCounts.put("Critical / High", 0L);
    priorityCounts.put("Medium", 0L);
    priorityCounts.put("Low", 0L);

    for (Report r : all) {
      if (r.getAnalysis() != null && r.getAnalysis().getPriority() != null) {
        String prio = r.getAnalysis().getPriority().toLowerCase();
        if ("high".equals(prio)) priorityCounts.merge("Critical / High", 1L, Long::sum);
        else if ("medium".equals(prio)) priorityCounts.merge("Medium", 1L, Long::sum);
        else priorityCounts.merge("Low", 1L, Long::sum);
      } else {
        priorityCounts.merge("Medium", 1L, Long::sum);
      }
    }

    List<Map<String, Object>> priorityBarData = priorityCounts.entrySet().stream()
        .map(e -> Map.<String, Object>of("priority", e.getKey(), "count", e.getValue()))
        .toList();

    // 3. Status breakdown
    Map<String, Long> statusCounts = new LinkedHashMap<>();
    statusCounts.put("Awaiting Review", all.stream().filter(r -> "AWAITING_REVIEW".equalsIgnoreCase(r.getOfficialStatus())).count());
    statusCounts.put("Under Review", all.stream().filter(r -> "UNDER_REVIEW".equalsIgnoreCase(r.getOfficialStatus())).count());
    statusCounts.put("Action Dispatched", all.stream().filter(r -> "ACTION_RECORDED".equalsIgnoreCase(r.getOfficialStatus())).count());
    statusCounts.put("Resolved", all.stream().filter(r -> "RESOLVED".equalsIgnoreCase(r.getOfficialStatus())).count());

    // 4. Time series trend (Area Chart)
    DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:00");
    Map<String, Integer> hourlyTrend = new TreeMap<>();
    for (int i = 8; i >= 0; i--) {
      String slot = LocalDateTime.now().minusHours(i * 2).format(fmt);
      hourlyTrend.put(slot, 0);
    }
    for (Report r : all) {
      String slot = r.getIncidentAt().format(fmt);
      hourlyTrend.merge(slot, 1, Integer::sum);
    }
    List<Map<String, Object>> timelineData = hourlyTrend.entrySet().stream()
        .map(e -> Map.<String, Object>of("time", e.getKey(), "reports", e.getValue()))
        .toList();

    // 5. Resource Requirements Breakdown
    Map<String, Integer> resourcesNeeded = new LinkedHashMap<>();
    resourcesNeeded.put("Rescue Boats", 0);
    resourcesNeeded.put("Dewatering Pumps", 0);
    resourcesNeeded.put("Medical Emergency", 0);
    resourcesNeeded.put("Food & Water Kits", 0);
    resourcesNeeded.put("Evacuation Shelters", 0);

    for (Report r : all) {
      String text = (r.getDescription() + " " + Objects.toString(r.getResources(), "")).toLowerCase();
      if (text.contains("boat") || text.contains("watercraft")) resourcesNeeded.merge("Rescue Boats", 1, Integer::sum);
      if (text.contains("pump") || text.contains("dewatering")) resourcesNeeded.merge("Dewatering Pumps", 1, Integer::sum);
      if (text.contains("medical") || text.contains("injured") || text.contains("doctor") || text.contains("ambulance")) resourcesNeeded.merge("Medical Emergency", 1, Integer::sum);
      if (text.contains("food") || text.contains("water") || text.contains("ration")) resourcesNeeded.merge("Food & Water Kits", 1, Integer::sum);
      if (text.contains("shelter") || text.contains("evacuate") || text.contains("camp")) resourcesNeeded.merge("Evacuation Shelters", 1, Integer::sum);
    }

    return Map.of(
        "categoryDistribution", categoryPieData,
        "priorityDistribution", priorityBarData,
        "statusDistribution", statusCounts,
        "timeline", timelineData,
        "resourceDemand", resourcesNeeded
    );
  }

  @GetMapping("/map-markers")
  public List<Map<String, Object>> getMapMarkers() {
    List<Map<String, Object>> markers = new ArrayList<>();

    // Map markers from citizen reports
    for (Report r : reports.findAll()) {
      Double lat = r.getLatitude();
      Double lng = r.getLongitude();
      // If coordinates not in report, check analysis extraction
      if ((lat == null || lng == null) && r.getAnalysis() != null) {
        Map<String, Object> extracted = readMap(r.getAnalysis().getExtractionJson());
        if (extracted.get("latitude") instanceof Number nLat) lat = nLat.doubleValue();
        if (extracted.get("longitude") instanceof Number nLng) lng = nLng.doubleValue();
      }

      if (lat != null && lng != null) {
        Map<String, Object> marker = new LinkedHashMap<>();
        marker.put("id", r.getPublicId());
        marker.put("type", "REPORT");
        marker.put("title", r.getTitle());
        marker.put("category", r.getReportedCategory() != null ? r.getReportedCategory() : "Disaster");
        marker.put("latitude", lat);
        marker.put("longitude", lng);
        marker.put("location", r.getLocationText());
        marker.put("landmark", Objects.toString(r.getLandmark(), ""));
        marker.put("affected", Objects.requireNonNullElse(r.getAffectedPeople(), 0));
        marker.put("trapped", Objects.requireNonNullElse(r.getTrappedPeople(), 0));
        marker.put("injured", Objects.requireNonNullElse(r.getInjuredPeople(), 0));
        marker.put("status", r.getOfficialStatus());
        marker.put("assignedTeam", Objects.toString(r.getAssignedTeam(), "Unassigned"));
        marker.put("incidentAt", r.getIncidentAt().toString());

        if (r.getAnalysis() != null) {
          marker.put("priority", r.getAnalysis().getPriority());
          marker.put("severityScore", r.getAnalysis().getSeverityScore());
          marker.put("summary", r.getAnalysis().getSummary());
        } else {
          marker.put("priority", "medium");
          marker.put("severityScore", 50);
          marker.put("summary", r.getDescription());
        }
        markers.add(marker);
      }
    }

    // Also include consolidated incident markers
    for (Incident inc : incidents.findAll()) {
      if (inc.getLatitude() != null && inc.getLongitude() != null) {
        Map<String, Object> marker = new LinkedHashMap<>();
        marker.put("id", inc.getIncidentCode());
        marker.put("type", "CONSOLIDATED_INCIDENT");
        marker.put("title", inc.getTitle());
        marker.put("category", inc.getCategory() != null ? inc.getCategory().toUpperCase() : "FLOOD");
        marker.put("latitude", inc.getLatitude());
        marker.put("longitude", inc.getLongitude());
        marker.put("location", inc.getPrimaryLocation());
        marker.put("affected", inc.getAffectedPeopleTotal());
        marker.put("trapped", inc.getTrappedPeopleTotal());
        marker.put("injured", inc.getInjuredPeopleTotal());
        marker.put("status", inc.getStatus());
        marker.put("assignedTeam", Objects.toString(inc.getAssignedTeam(), "Unassigned"));
        marker.put("priority", "CRITICAL".equalsIgnoreCase(inc.getSeverityLevel()) ? "high" : "medium");
        marker.put("severityScore", inc.getSeverityScore());
        marker.put("summary", inc.getAiSummary());
        marker.put("linkedReportsCount", incidentReports.findByIncidentId(inc.getId()).size());
        markers.add(marker);
      }
    }

    return markers;
  }

  @Transactional
  @PostMapping("/review")
  public ResponseEntity<?> submitOfficialReview(
      @Valid @RequestBody OfficialReviewRequest body,
      Authentication auth) {
    User reviewer = users.findById((Long) auth.getPrincipal()).orElseThrow();

    Report report = null;
    if (body.reportId() != null && !body.reportId().isBlank()) {
      report = reports.findByPublicId(body.reportId()).orElse(null);
    }

    Incident incident = null;
    if (body.incidentCode() != null && !body.incidentCode().isBlank()) {
      incident = incidents.findByIncidentCode(body.incidentCode()).orElse(null);
    }

    if (report == null && incident == null) {
      return ResponseEntity.badRequest().body(Map.of("message", "Valid reportId or incidentCode must be provided."));
    }

    OfficialReview review = new OfficialReview();
    review.setReviewer(reviewer);
    review.setDecision(body.status());
    review.setDispatchedTeam(body.assignedTeam());
    review.setRemarks(body.officialRemarks());
    review.setPriorityAssigned(body.priorityOverride());

    if (report != null) {
      review.setReportId(report.getId());
      report.setOfficialStatus(body.status());
      if (body.assignedTeam() != null && !body.assignedTeam().isBlank()) {
        report.setAssignedTeam(body.assignedTeam());
      }
      if (body.officialRemarks() != null && !body.officialRemarks().isBlank()) {
        report.setOfficialRemarks(body.officialRemarks());
      }
      if (body.verified() != null) {
        report.setVerified(body.verified());
      }
      report.setUpdatedAt(Instant.now());
      reports.save(report);
    }

    if (incident != null) {
      review.setIncidentId(incident.getId());
      incident.setStatus(body.status());
      if (body.assignedTeam() != null && !body.assignedTeam().isBlank()) {
        incident.setAssignedTeam(body.assignedTeam());
      }
      if (body.officialRemarks() != null && !body.officialRemarks().isBlank()) {
        incident.setOfficialRemarks(body.officialRemarks());
      }
      incident.setUpdatedAt(Instant.now());
      incidents.save(incident);
    }

    reviews.save(review);

    return ResponseEntity.ok(Map.of(
        "message", "Official review and response action recorded successfully.",
        "status", body.status(),
        "assignedTeam", Objects.toString(body.assignedTeam(), "None"),
        "timestamp", Instant.now().toString()
    ));
  }

  private Map<String, Object> viewOfficialReport(Report r) {
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
    m.put("hasImage", r.hasImage());
    m.put("hasAudio", r.hasAudio());
    m.put("status", r.getStatus());
    m.put("officialStatus", r.getOfficialStatus());
    m.put("officialRemarks", r.getOfficialRemarks());
    m.put("assignedTeam", r.getAssignedTeam());
    m.put("verified", r.isVerified());
    m.put("latitude", r.getLatitude());
    m.put("longitude", r.getLongitude());
    m.put("createdAt", r.getCreatedAt());

    if (r.getOwner() != null) {
      m.put("reporter", Map.of(
          "name", r.getOwner().getFullName(),
          "email", r.getOwner().getEmail(),
          "phone", Objects.toString(r.getOwner().getPhone(), "Not provided")
      ));
    }

    if (r.getAnalysis() != null) {
      var a = r.getAnalysis();
      m.put("analysis", Map.of(
          "category", a.getCategory(),
          "confidence", a.getConfidence(),
          "priority", a.getPriority(),
          "severityScore", a.getSeverityScore(),
          "evidenceScore", a.getEvidenceScore(),
          "summary", a.getSummary(),
          "extracted", readMap(a.getExtractionJson()),
          "support", readMap(a.getEvidenceJson())
      ));
    }

    return m;
  }

  private Map<String, Object> viewIncident(Incident inc) {
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("incidentCode", inc.getIncidentCode());
    m.put("title", inc.getTitle());
    m.put("category", inc.getCategory());
    m.put("location", inc.getPrimaryLocation());
    m.put("latitude", inc.getLatitude());
    m.put("longitude", inc.getLongitude());
    m.put("severityLevel", inc.getSeverityLevel());
    m.put("severityScore", inc.getSeverityScore());
    m.put("status", inc.getStatus());
    m.put("verificationStatus", inc.getVerificationStatus());
    m.put("aiSummary", inc.getAiSummary());
    m.put("affectedPeopleTotal", inc.getAffectedPeopleTotal());
    m.put("injuredPeopleTotal", inc.getInjuredPeopleTotal());
    m.put("trappedPeopleTotal", inc.getTrappedPeopleTotal());
    m.put("assignedTeam", inc.getAssignedTeam());
    m.put("officialRemarks", inc.getOfficialRemarks());
    m.put("createdAt", inc.getCreatedAt());

    List<Map<String, Object>> linked = new ArrayList<>();
    List<IncidentReport> irList = incidentReports.findByIncidentId(inc.getId());
    for (IncidentReport ir : irList) {
      Map<String, Object> lr = new LinkedHashMap<>();
      lr.put("reportId", ir.getReport() != null ? ir.getReport().getPublicId() : "N/A");
      lr.put("title", ir.getReport() != null ? ir.getReport().getTitle() : "Field Report");
      lr.put("similarityScore", Objects.requireNonNullElse(ir.getSimilarityScore(), 1.0));
      lr.put("linkedAt", ir.getLinkedAt() != null ? ir.getLinkedAt().toString() : Instant.now().toString());
      linked.add(lr);
    }
    m.put("linkedReports", linked);
    m.put("reportCount", linked.size());

    return m;
  }

  private Map<String, Object> readMap(String jsonStr) {
    if (jsonStr == null || jsonStr.isBlank()) return Collections.emptyMap();
    try {
      return json.readValue(jsonStr, new TypeReference<Map<String, Object>>() {});
    } catch (Exception e) {
      return Collections.emptyMap();
    }
  }
}
