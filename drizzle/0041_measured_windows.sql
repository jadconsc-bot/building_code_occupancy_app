CREATE TABLE `measuredWindows` (
  `id` int NOT NULL AUTO_INCREMENT,
  `projectId` int NOT NULL,
  `pageId` int NOT NULL,
  `face` enum('N','S','E','W','unknown') NOT NULL DEFAULT 'unknown',
  `widthMm` decimal(10,2) NOT NULL,
  `heightMm` decimal(10,2) NOT NULL,
  `areaM2` decimal(10,2) NOT NULL,
  `positionJson` json NOT NULL,
  `pixelWidth` decimal(12,2) NOT NULL,
  `provenanceJson` json NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_measuredWindows_project_page` (`projectId`, `pageId`),
  CONSTRAINT `fk_measuredWindows_project`
    FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_measuredWindows_page`
    FOREIGN KEY (`pageId`) REFERENCES `drawingPages` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
);
