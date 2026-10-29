package com.disasterreportai.incident;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IncidentReportRepository extends JpaRepository<IncidentReport, Long> {
  List<IncidentReport> findByIncidentId(Long incidentId);
  List<IncidentReport> findByReportId(Long reportId);
}
