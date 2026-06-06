-- Add Phase C columns to detectedRooms
ALTER TABLE detectedRooms
  ADD COLUMN seedX FLOAT NULL,
  ADD COLUMN seedY FLOAT NULL,
  ADD COLUMN doorBarriersJson JSON NULL,
  ADD COLUMN detectionMethod ENUM('flood_fill','dda_ray_cast','manual','fallback_bbox') NOT NULL DEFAULT 'flood_fill';

-- Update existing polygonSource enum to include dda_ray_cast
ALTER TABLE detectedRooms
  MODIFY COLUMN polygonSource ENUM('flood_fill','fallback_bbox','manual','dda_ray_cast') NULL;
