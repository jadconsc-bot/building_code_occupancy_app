ALTER TABLE `drawingPages`
  ADD COLUMN `evalAccuracy` float DEFAULT NULL,
  ADD COLUMN `evalPassingRooms` int DEFAULT NULL,
  ADD COLUMN `evalTotalRooms` int DEFAULT NULL,
  ADD COLUMN `evalMissedRoomsJson` text DEFAULT NULL;
