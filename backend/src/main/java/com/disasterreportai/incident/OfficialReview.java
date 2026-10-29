package com.disasterreportai.incident;

import com.disasterreportai.user.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "official_reviews")
public class OfficialReview {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private Long reportId;
  private Long incidentId;

  @ManyToOne(optional = false)
  private User reviewer;

  @Column(nullable = false)
  private String decision; // e.g. "ACTION_RECORDED", "DISPATCHED", "RESOLVED", "FALSE_ALARM"

  private String priorityAssigned;
  private String dispatchedTeam;

  @Lob
  @Column(columnDefinition = "LONGTEXT")
  private String remarks;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  public Long getId() { return id; }
  public Long getReportId() { return reportId; }
  public void setReportId(Long v) { reportId = v; }
  public Long getIncidentId() { return incidentId; }
  public void setIncidentId(Long v) { incidentId = v; }
  public User getReviewer() { return reviewer; }
  public void setReviewer(User v) { reviewer = v; }
  public String getDecision() { return decision; }
  public void setDecision(String v) { decision = v; }
  public String getPriorityAssigned() { return priorityAssigned; }
  public void setPriorityAssigned(String v) { priorityAssigned = v; }
  public String getDispatchedTeam() { return dispatchedTeam; }
  public void setDispatchedTeam(String v) { dispatchedTeam = v; }
  public String getRemarks() { return remarks; }
  public void setRemarks(String v) { remarks = v; }
  public Instant getCreatedAt() { return createdAt; }
}
