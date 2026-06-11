-- POLYGON-D-001: add roboflow_segmentation to polygonSource enum
-- NOTE: spec had incorrect current enum (listed 'vision_prompt' instead of 'manual').
-- Corrected to preserve all existing live values.
ALTER TABLE detectedRooms
  MODIFY COLUMN polygonSource
  ENUM('flood_fill','fallback_bbox','manual','dda_ray_cast','roboflow_segmentation')
  NULL;
