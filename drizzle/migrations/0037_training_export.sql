-- TRAINING-001: track which training examples have been exported
-- to Roboflow to avoid duplicate uploads
ALTER TABLE trainingExamples
  ADD COLUMN exportedAt TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN roboflowImageId VARCHAR(255) NULL;
