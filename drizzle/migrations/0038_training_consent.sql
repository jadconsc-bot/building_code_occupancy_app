-- CIM-AUDIT-038: per-user consent for Roboflow-relevant image capture
ALTER TABLE `users`
  ADD COLUMN `trainingConsent` INT NOT NULL DEFAULT 0,
  ADD COLUMN `trainingConsentUpdatedAt` TIMESTAMP NULL DEFAULT NULL;
