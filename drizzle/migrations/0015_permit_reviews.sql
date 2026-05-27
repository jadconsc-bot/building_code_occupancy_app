CREATE TABLE IF NOT EXISTS permitReviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projectId INT NOT NULL,
  orgId INT NOT NULL,
  reviewedBy INT NOT NULL,
  reviewType ENUM('code_strategy','calculations','permit_package') NOT NULL,
  decision ENUM('approved','revision_requested','rejected') NOT NULL,
  notes TEXT,
  reviewedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_projectId (projectId),
  INDEX idx_orgId (orgId)
);
