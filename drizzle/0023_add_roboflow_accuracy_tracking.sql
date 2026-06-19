-- Sprint 1: Persist Roboflow IoU accuracy data
-- Adds roboflowIou and roboflowMatched to detectedRooms,
-- and creates roboflowUnmatchedDetections for polygons Claude missed.

ALTER TABLE `detectedRooms`
  ADD COLUMN `roboflowIou` DECIMAL(5,4) DEFAULT NULL COMMENT 'IoU between Claude bbox and best-matching Roboflow detection (NULL if Roboflow unavailable)',
  ADD COLUMN `roboflowMatched` TINYINT(1) DEFAULT NULL COMMENT '1 if matched to a Roboflow polygon, 0 if no match found, NULL if Roboflow unavailable';

CREATE TABLE `roboflowUnmatchedDetections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pageId` INT NOT NULL,
  `roboflowBboxJson` TEXT NOT NULL COMMENT 'JSON {x,y,width,height} in full-image pixel space',
  `roboflowVerticesJson` TEXT NOT NULL COMMENT 'JSON [{x,y},...] polygon vertices in full-image pixel space',
  `roboflowConfidence` DECIMAL(4,3) NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_roboflow_unmatched_pageId` (`pageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
