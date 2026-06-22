-- Thread A Step 2: Room adjacency tracking
-- Adds adjacentRoomIds to detectedRooms for fire-separation Rule 7.
-- NULL  = adjacency not yet computed for this room
-- '[]'  = computed, no adjacent rooms found
-- '[1,5,12]' = computed, rooms with those IDs are physically adjacent

ALTER TABLE `detectedRooms`
  ADD COLUMN `adjacentRoomIds` JSON NULL
    COMMENT 'Array of detectedRooms.id values whose polygons are within ADJACENCY_THRESHOLD_PX. NULL = not yet computed.',
  ADD INDEX `idx_detectedRooms_pageId` (`pageId`);
