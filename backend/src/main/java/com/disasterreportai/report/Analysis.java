package com.disasterreportai.report;
import jakarta.persistence.*;
import java.time.Instant;
@Entity @Table(name="report_analyses") public class Analysis {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  @OneToOne(optional=false) private Report report; private String category; private Double confidence; private String priority; private Integer severityScore; private Integer evidenceScore;
  @Lob @Column(columnDefinition="LONGTEXT") private String summary;
  @Lob @Column(columnDefinition="LONGTEXT") private String extractionJson;
  @Lob @Column(columnDefinition="LONGTEXT") private String evidenceJson;
  @Column(nullable=false) private Instant createdAt=Instant.now();
  public void setReport(Report v){report=v;} public String getCategory(){return category;} public void setCategory(String v){category=v;} public Double getConfidence(){return confidence;} public void setConfidence(Double v){confidence=v;} public String getPriority(){return priority;} public void setPriority(String v){priority=v;} public Integer getSeverityScore(){return severityScore;} public void setSeverityScore(Integer v){severityScore=v;} public Integer getEvidenceScore(){return evidenceScore;} public void setEvidenceScore(Integer v){evidenceScore=v;} public String getSummary(){return summary;} public void setSummary(String v){summary=v;} public String getExtractionJson(){return extractionJson;} public void setExtractionJson(String v){extractionJson=v;} public String getEvidenceJson(){return evidenceJson;} public void setEvidenceJson(String v){evidenceJson=v;}
}
