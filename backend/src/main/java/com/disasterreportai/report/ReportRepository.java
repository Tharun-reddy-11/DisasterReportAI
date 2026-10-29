package com.disasterreportai.report;

import com.disasterreportai.user.User;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {
  List<Report> findByOwnerOrderByCreatedAtDesc(User owner);
  Optional<Report> findByPublicIdAndOwner(String publicId, User owner);
  Optional<Report> findByPublicId(String publicId);
  List<Report> findAllByOrderByCreatedAtDesc();
  List<Report> findByOfficialStatusOrderByCreatedAtDesc(String officialStatus);
  long countByOfficialStatus(String officialStatus);
}
