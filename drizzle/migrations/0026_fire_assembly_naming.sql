ALTER TABLE fireAssemblies
  ADD COLUMN wallCode       VARCHAR(30)   NULL,
  ADD COLUMN wallName       VARCHAR(200)  NULL,
  ADD COLUMN sequenceNum    INT           NOT NULL DEFAULT 1,
  ADD COLUMN isStacked      TINYINT       NOT NULL DEFAULT 0,
  ADD COLUMN stackedWithId  INT           NULL,
  ADD COLUMN stackSuffix    CHAR(1)       NULL,
  ADD COLUMN effectiveFrr   DECIMAL(4,2)  NULL,
  ADD COLUMN wallCodeFormat VARCHAR(20)   NOT NULL DEFAULT 'FW',
  ADD COLUMN ulcDesign      VARCHAR(50)   NULL,
  ADD COLUMN assemblyDesc   VARCHAR(200)  NULL;
