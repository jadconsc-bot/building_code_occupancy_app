ALTER TABLE `drawingPages`
  ADD COLUMN `evalAccuracy` decimal(4,3) DEFAULT NULL,
  ADD COLUMN `evalPassingRooms` int DEFAULT NULL,
  ADD COLUMN `evalTotalRooms` int DEFAULT NULL,
  ADD COLUMN `evalMissedRoomsJson` text DEFAULT NULL;
