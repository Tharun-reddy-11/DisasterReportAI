package com.disasterreportai.incident;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IncidentRepository extends JpaRepository<Incident, Long> {
  Optional<Incident> findByIncidentCode(String incidentCode);
  List<Incident> findAllByOrderByCreatedAtDesc();
  List<Incident> findByStatusOrderByCreatedAtDesc(String status);
  long countByStatus(String status);
}
