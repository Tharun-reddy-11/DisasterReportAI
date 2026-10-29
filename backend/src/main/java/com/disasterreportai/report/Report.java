package com.disasterreportai.report;

import com.disasterreportai.user.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
public class Report {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String publicId;

  @ManyToOne(optional = false)
  private User owner;

  @Column(nullable = false)
  private String title;

  @Column(nullable = false, length = 8000)
  private String description;

  private String reportedCategory;

  @Column(nullable = false)
  private String locationText;

  private String landmark;

  @Column(nullable = false)
  private LocalDateTime incidentAt;

  private Double latitude;
  private Double longitude;

  private Integer affectedPeople;
  private Integer injuredPeople;
  private Integer trappedPeople;

  @Column(length = 2000)
  private String resources;

  private boolean hasImage;
  private boolean hasAudio;

  @Column(nullable = false)
  private String status = "ANALYSIS_PENDING";

  @Column(nullable = false)
  private String officialStatus = "AWAITING_REVIEW";

  @Column(length = 4000)
  private String officialRemarks;

  private String assignedTeam;

  private boolean verified = false;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  private Instant updatedAt = Instant.now();

  @OneToOne(mappedBy = "report", cascade = CascadeType.ALL)
  private Analysis analysis;

  public Long getId() { return id; }
  public String getPublicId() { return publicId; }
  public void setPublicId(String v) { publicId = v; }
  public User getOwner() { return owner; }
  public void setOwner(User v) { owner = v; }
  public String getTitle() { return title; }
  public void setTitle(String v) { title = v; }
  public String getDescription() { return description; }
  public void setDescription(String v) { description = v; }
  public String getReportedCategory() { return reportedCategory; }
  public void setReportedCategory(String v) { reportedCategory = v; }
  public String getLocationText() { return locationText; }
  public void setLocationText(String v) { locationText = v; }
  public String getLandmark() { return landmark; }
  public void setLandmark(String v) { landmark = v; }
  public LocalDateTime getIncidentAt() { return incidentAt; }
  public void setIncidentAt(LocalDateTime v) { incidentAt = v; }
  public Double getLatitude() { return latitude; }
  public void setLatitude(Double v) { latitude = v; }
  public Double getLongitude() { return longitude; }
  public void setLongitude(Double v) { longitude = v; }
  public Integer getAffectedPeople() { return affectedPeople; }
  public void setAffectedPeople(Integer v) { affectedPeople = v; }
  public Integer getInjuredPeople() { return injuredPeople; }
  public void setInjuredPeople(Integer v) { injuredPeople = v; }
  public Integer getTrappedPeople() { return trappedPeople; }
  public void setTrappedPeople(Integer v) { trappedPeople = v; }
  public String getResources() { return resources; }
  public void setResources(String v) { resources = v; }
  public boolean hasImage() { return hasImage; }
  public void setHasImage(boolean v) { hasImage = v; }
  public boolean hasAudio() { return hasAudio; }
  public void setHasAudio(boolean v) { hasAudio = v; }
  public String getStatus() { return status; }
  public void setStatus(String v) { status = v; }
  public String getOfficialStatus() { return officialStatus; }
  public void setOfficialStatus(String v) { officialStatus = v; }
  public String getOfficialRemarks() { return officialRemarks; }
  public void setOfficialRemarks(String v) { officialRemarks = v; }
  public String getAssignedTeam() { return assignedTeam; }
  public void setAssignedTeam(String v) { assignedTeam = v; }
  public boolean isVerified() { return verified; }
  public void setVerified(boolean v) { verified = v; }
  public Instant getCreatedAt() { return createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant v) { updatedAt = v; }
  public Analysis getAnalysis() { return analysis; }
  public void setAnalysis(Analysis v) { analysis = v; }
}
