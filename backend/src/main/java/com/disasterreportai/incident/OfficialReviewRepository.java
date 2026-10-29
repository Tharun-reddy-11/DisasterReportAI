package com.disasterreportai.incident;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OfficialReviewRepository extends JpaRepository<OfficialReview, Long> {
  List<OfficialReview> findByReportIdOrderByCreatedAtDesc(Long reportId);
  List<OfficialReview> findByIncidentIdOrderByCreatedAtDesc(Long incidentId);
  List<OfficialReview> findAllByOrderByCreatedAtDesc();
}
