ALTER TABLE `projects`
  ADD `bedroomCountJson` JSON NULL,
  ADD `totalDwellingUnitsJson` JSON NULL,
  ADD `sprinklersRequiredJson` JSON NULL;

ALTER TABLE `detectedRooms`
  ADD `occupancyGroupJson` JSON NULL,
  ADD `areaSqmJson` JSON NULL;

UPDATE `projects`
SET `bedroomCountJson` = JSON_OBJECT('value', `bedroomCount`, 'confirmed', FALSE, 'source', 'ai-extracted')
WHERE `bedroomCount` IS NOT NULL AND `bedroomCountJson` IS NULL;

UPDATE `projects`
SET `totalDwellingUnitsJson` = JSON_OBJECT('value', `totalDwellingUnits`, 'confirmed', FALSE, 'source', 'ai-extracted')
WHERE `totalDwellingUnits` IS NOT NULL AND `totalDwellingUnitsJson` IS NULL;

UPDATE `projects`
SET `sprinklersRequiredJson` = JSON_OBJECT('value', JSON_EXTRACT(IF(`sprinklersRequired` = 1, 'true', 'false'), '$'), 'confirmed', FALSE, 'source', 'ai-extracted')
WHERE `sprinklersRequired` IS NOT NULL AND `sprinklersRequiredJson` IS NULL;

UPDATE `detectedRooms`
SET `occupancyGroupJson` = JSON_OBJECT('value', `occupancyGroup`, 'confirmed', FALSE, 'source', 'ai-extracted')
WHERE `occupancyGroup` IS NOT NULL AND `occupancyGroupJson` IS NULL;

UPDATE `detectedRooms`
SET `areaSqmJson` = JSON_OBJECT('value', CAST(`areaSqm` AS DECIMAL(10,2)), 'confirmed', FALSE, 'source', 'ai-extracted')
WHERE `areaSqm` IS NOT NULL AND `areaSqmJson` IS NULL;

UPDATE `detectedRooms` r
JOIN (
  SELECT DISTINCT `roomId`
  FROM `roomCorrections`
  WHERE `correctionType` = 'occupancy_change'
) c ON c.`roomId` = r.`id`
SET r.`occupancyGroupJson` = JSON_OBJECT('value', r.`occupancyGroup`, 'confirmed', TRUE, 'source', 'user-confirmed')
WHERE r.`manualOverride` = 1 AND r.`occupancyGroup` IS NOT NULL;

UPDATE `detectedRooms` r
JOIN (
  SELECT DISTINCT `roomId`
  FROM `roomCorrections`
  WHERE `correctionType` = 'missing_room_add'
    AND JSON_EXTRACT(`correctedValueJson`, '$.areaSqm') IS NOT NULL
) c ON c.`roomId` = r.`id`
SET r.`areaSqmJson` = JSON_OBJECT('value', CAST(r.`areaSqm` AS DECIMAL(10,2)), 'confirmed', TRUE, 'source', 'user-confirmed')
WHERE r.`manualOverride` = 1 AND r.`areaSqm` IS NOT NULL;
