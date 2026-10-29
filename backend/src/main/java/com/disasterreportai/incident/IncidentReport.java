package com.disasterreportai.incident;

import com.disasterreportai.report.Report;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "incident_reports")
public class IncidentReport {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false, fetch = FetchType.EAGER)
  private Incident incident;

  @ManyToOne(optional = false, fetch = FetchType.EAGER)
  private Report report;

  private Double similarityScore = 1.0;

  @Column(nullable = false)
  private Instant linkedAt = Instant.now();

  public Long getId() { return id; }
  public Incident getIncident() { return incident; }
  public void setIncident(Incident v) { incident = v; }
  public Report getReport() { return report; }
  public void setReport(Report v) { report = v; }
  public Double getSimilarityScore() { return similarityScore; }
  public void setSimilarityScore(Double v) { similarityScore = v; }
  public Instant getLinkedAt() { return linkedAt; }
  public void setLinkedAt(Instant v) { linkedAt = v; }
}
