ALTER TABLE drawingSetContexts
  ADD COLUMN doorScheduleJson JSON NULL,
  ADD COLUMN windowScheduleJson JSON NULL,
  ADD COLUMN schedulePageNumbers JSON NULL,
  ADD COLUMN totalDoorTypes INT DEFAULT 0,
  ADD COLUMN totalWindowTypes INT DEFAULT 0;
