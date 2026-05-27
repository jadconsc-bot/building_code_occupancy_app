-- Migration: CodeComply Home — homeReports table
-- Date: 2026-05-26
-- Suggestion baked in: userId (optional FK for account linking), crypto-token column

CREATE TABLE homeReports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reportToken VARCHAR(64) NOT NULL UNIQUE,        -- 256-bit hex token, never guessable
  email VARCHAR(320) NOT NULL,
  userId INT NULL,                                  -- optional: links to users when account created
  province ENUM('AB','BC','ON') NOT NULL,
  municipality VARCHAR(100),
  projectType VARCHAR(50) NOT NULL,
  formAnswersJson JSON,
  complianceResultJson JSON,
  overallResult ENUM('pass','conditional','fail'),
  stripePaymentIntentId VARCHAR(100),
  stripeCheckoutSessionId VARCHAR(100),
  paymentStatus ENUM('pending','paid','refunded') NOT NULL DEFAULT 'pending',
  pdfGeneratedAt TIMESTAMP NULL,
  downloadExpiresAt TIMESTAMP NULL,               -- 30 days from payment
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reportToken (reportToken),
  INDEX idx_email (email),
  INDEX idx_paymentStatus (paymentStatus),
  INDEX idx_userId (userId)
);
