-- Migration: CodeComply Home — homeReports table
-- Date: 2026-05-26
-- Rev 2: SHA-256 token hash stored (not raw token), pdfStorageKey for S3,
--         userId INT NULL for optional account linking (Fix 3),
--         formAnswersJson NOT NULL, no stripeCheckoutSessionId

CREATE TABLE IF NOT EXISTS homeReports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reportToken VARCHAR(64) NOT NULL UNIQUE,   -- SHA-256 hash of raw token sent in email
  email VARCHAR(320) NOT NULL,
  userId INT NULL,                           -- links to users.id when account created
  province ENUM('AB','BC','ON') NOT NULL,
  municipality VARCHAR(100),
  projectType VARCHAR(50) NOT NULL,
  formAnswersJson JSON NOT NULL,
  complianceResultJson JSON,
  overallResult ENUM('pass','conditional','fail'),
  stripePaymentIntentId VARCHAR(100),
  paymentStatus ENUM('pending','paid','refunded') DEFAULT 'pending',
  pdfStorageKey VARCHAR(500),               -- S3 object key, not public URL
  reportGeneratedAt TIMESTAMP NULL,
  downloadExpiresAt TIMESTAMP NULL,         -- 30 days from payment
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reportToken (reportToken),
  INDEX idx_email (email),
  INDEX idx_userId (userId),
  INDEX idx_paymentStatus (paymentStatus)
);
