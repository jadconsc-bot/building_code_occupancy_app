ALTER TABLE trainingExamples
  ADD COLUMN conventionType ENUM(
    'label_convention',
    'symbol_convention',
    'layout_convention',
    'equipment_convention',
    'occupancy_convention',
    'correction'
  ) NOT NULL DEFAULT 'correction' AFTER promptContribution,
  ADD INDEX idx_conventionType (conventionType);
