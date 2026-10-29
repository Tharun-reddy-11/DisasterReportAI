-- DisasterReportAI Complete Relational Database Schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS disasterreport;
USE disasterreport;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('AUTHORITY', 'CITIZEN', 'VOLUNTEER') NOT NULL DEFAULT 'CITIZEN',
  phone VARCHAR(32),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  public_id VARCHAR(40) NOT NULL UNIQUE,
  owner_id BIGINT NOT NULL,
  title VARCHAR(160) NOT NULL,
  description VARCHAR(8000) NOT NULL,
  reported_category VARCHAR(48),
  location_text VARCHAR(250) NOT NULL,
  landmark VARCHAR(250),
  incident_at DATETIME NOT NULL,
  latitude DOUBLE,
  longitude DOUBLE,
  affected_people INT,
  injured_people INT,
  trapped_people INT,
  resources VARCHAR(2000),
  has_image BOOLEAN NOT NULL DEFAULT FALSE,
  has_audio BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(32) NOT NULL DEFAULT 'ANALYSIS_PENDING',
  official_status VARCHAR(48) NOT NULL DEFAULT 'AWAITING_REVIEW',
  official_remarks TEXT,
  assigned_team VARCHAR(160),
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reports_user FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS report_analyses (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  report_id BIGINT NOT NULL UNIQUE,
  category VARCHAR(48),
  confidence DOUBLE,
  priority VARCHAR(16),
  severity_score INT,
  evidence_score INT,
  summary LONGTEXT,
  extraction_json LONGTEXT,
  evidence_json LONGTEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_analysis_report FOREIGN KEY (report_id) REFERENCES reports(id)
);

CREATE TABLE IF NOT EXISTS incidents (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  incident_code VARCHAR(48) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(48),
  primary_location VARCHAR(250) NOT NULL,
  latitude DOUBLE,
  longitude DOUBLE,
  severity_level VARCHAR(32) NOT NULL DEFAULT 'NEEDS_ASSESSMENT',
  severity_score INT DEFAULT 50,
  status VARCHAR(48) NOT NULL DEFAULT 'AWAITING_REVIEW',
  verification_status VARCHAR(64) NOT NULL DEFAULT 'UNVERIFIED_CITIZEN_REPORTS',
  ai_summary LONGTEXT,
  affected_people_total INT DEFAULT 0,
  injured_people_total INT DEFAULT 0,
  trapped_people_total INT DEFAULT 0,
  assigned_team VARCHAR(160),
  official_remarks LONGTEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incident_reports (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  incident_id BIGINT NOT NULL,
  report_id BIGINT NOT NULL,
  similarity_score DOUBLE DEFAULT 1.0,
  linked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ir_incident FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
  CONSTRAINT fk_ir_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS official_reviews (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  report_id BIGINT,
  incident_id BIGINT,
  reviewer_id BIGINT NOT NULL,
  decision VARCHAR(64) NOT NULL,
  priority_assigned VARCHAR(32),
  dispatched_team VARCHAR(160),
  remarks LONGTEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_user FOREIGN KEY (reviewer_id) REFERENCES users(id)
);
