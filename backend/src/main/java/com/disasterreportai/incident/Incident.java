package com.disasterreportai.incident;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "incidents")
public class Incident {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String incidentCode;

  @Column(nullable = false)
  private String title;

  private String category;

  @Column(nullable = false)
  private String primaryLocation;

  private Double latitude;
  private Double longitude;

  @Column(nullable = false)
  private String severityLevel = "NEEDS_ASSESSMENT";

  private Integer severityScore = 50;

  @Column(nullable = false)
  private String status = "AWAITING_REVIEW";

  @Column(nullable = false)
  private String verificationStatus = "UNVERIFIED_CITIZEN_REPORTS";

  @Lob
  @Column(columnDefinition = "LONGTEXT")
  private String aiSummary;

  private Integer affectedPeopleTotal = 0;
  private Integer injuredPeopleTotal = 0;
  private Integer trappedPeopleTotal = 0;

  private String assignedTeam;

  @Lob
  @Column(columnDefinition = "LONGTEXT")
  private String officialRemarks;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  private Instant updatedAt = Instant.now();

  @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  private List<IncidentReport> linkedReports = new ArrayList<>();

  public Long getId() { return id; }
  public String getIncidentCode() { return incidentCode; }
  public void setIncidentCode(String v) { incidentCode = v; }
  public String getTitle() { return title; }
  public void setTitle(String v) { title = v; }
  public String getCategory() { return category; }
  public void setCategory(String v) { category = v; }
  public String getPrimaryLocation() { return primaryLocation; }
  public void setPrimaryLocation(String v) { primaryLocation = v; }
  public Double getLatitude() { return latitude; }
  public void setLatitude(Double v) { latitude = v; }
  public Double getLongitude() { return longitude; }
  public void setLongitude(Double v) { longitude = v; }
  public String getSeverityLevel() { return severityLevel; }
  public void setSeverityLevel(String v) { severityLevel = v; }
  public Integer getSeverityScore() { return severityScore; }
  public void setSeverityScore(Integer v) { severityScore = v; }
  public String getStatus() { return status; }
  public void setStatus(String v) { status = v; }
  public String getVerificationStatus() { return verificationStatus; }
  public void setVerificationStatus(String v) { verificationStatus = v; }
  public String getAiSummary() { return aiSummary; }
  public void setAiSummary(String v) { aiSummary = v; }
  public Integer getAffectedPeopleTotal() { return affectedPeopleTotal; }
  public void setAffectedPeopleTotal(Integer v) { affectedPeopleTotal = v; }
  public Integer getInjuredPeopleTotal() { return injuredPeopleTotal; }
  public void setInjuredPeopleTotal(Integer v) { injuredPeopleTotal = v; }
  public Integer getTrappedPeopleTotal() { return trappedPeopleTotal; }
  public void setTrappedPeopleTotal(Integer v) { trappedPeopleTotal = v; }
  public String getAssignedTeam() { return assignedTeam; }
  public void setAssignedTeam(String v) { assignedTeam = v; }
  public String getOfficialRemarks() { return officialRemarks; }
  public void setOfficialRemarks(String v) { officialRemarks = v; }
  public Instant getCreatedAt() { return createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant v) { updatedAt = v; }
  public List<IncidentReport> getLinkedReports() { return linkedReports; }
  public void setLinkedReports(List<IncidentReport> v) { linkedReports = v; }
}
