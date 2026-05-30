ALTER TABLE projects
  ADD COLUMN municipality VARCHAR(100) NULL AFTER address,
  ADD COLUMN zoneCode VARCHAR(50) NULL AFTER province,
  ADD COLUMN zoneName VARCHAR(200) NULL AFTER zoneCode,
  ADD COLUMN zoneLookupSource ENUM('manual','geocoded_calgary','geocoded_edmonton','geocoded_other') DEFAULT 'manual' AFTER zoneName,
  ADD COLUMN parcelLat DECIMAL(10,7) NULL,
  ADD COLUMN parcelLng DECIMAL(10,7) NULL,
  ADD COLUMN communityName VARCHAR(100) NULL,
  ADD COLUMN zoneConfirmedAt TIMESTAMP NULL;
