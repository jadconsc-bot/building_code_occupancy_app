ALTER TABLE `permitReviews`
  ADD COLUMN `submittedDate` DATE NULL AFTER `notes`,
  ADD COLUMN `permitApplicationNumber` VARCHAR(100) NULL AFTER `submittedDate`,
  ADD COLUMN `reviewingAuthority` VARCHAR(200) NULL AFTER `permitApplicationNumber`,
  ADD COLUMN `submissionStatus` ENUM('not_submitted','submitted','under_review','approved','rejected') DEFAULT 'not_submitted' AFTER `reviewingAuthority`,
  ADD COLUMN `permitNumber` VARCHAR(100) NULL AFTER `submissionStatus`;
