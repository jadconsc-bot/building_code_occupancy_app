-- CIM-AUDIT-040: persist detached room-detection failures for the client
ALTER TABLE `drawingPages`
  ADD COLUMN `detectionError` TEXT NULL DEFAULT NULL;
