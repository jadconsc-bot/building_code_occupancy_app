-- Migration 0033: Add geocoding jurisdiction fields to projects
-- address, parcelLat, parcelLng, province, municipality already exist
-- Only add the missing jurisdictionSource and geocodedAt columns

ALTER TABLE projects
  ADD COLUMN jurisdictionSource ENUM('geocoded','manual','device','fallback') NOT NULL DEFAULT 'manual',
  ADD COLUMN geocodedAt DATETIME NULL;
