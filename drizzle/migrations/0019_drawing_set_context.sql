CREATE TABLE IF NOT EXISTS drawingSetContexts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projectId INT NOT NULL,
  drawingAnalysisId INT NOT NULL,

  projectName VARCHAR(200),
  projectAddress VARCHAR(300),
  architectFirm VARCHAR(200),
  clientName VARCHAR(200),

  buildingOccupancy VARCHAR(50),
  numberOfStoreys INT,
  constructionType VARCHAR(100),
  sprinklered TINYINT DEFAULT 0,
  basementPresent TINYINT DEFAULT 0,

  codeEdition VARCHAR(50),
  municipality VARCHAR(100),
  province VARCHAR(5),

  totalPages INT,
  pageInventoryJson JSON,
  floorHierarchyJson JSON,

  confirmedScale VARCHAR(50),
  overallWidthM DECIMAL(8,2),
  overallDepthM DECIMAL(8,2),
  typicalCeilingHeightM DECIMAL(6,2),

  abbreviationsJson JSON,
  exitLocationsJson JSON,
  stairLocationsJson JSON,

  currentRevision VARCHAR(20),
  revisionDate DATE,

  rawContextJson JSON,

  extractedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  extractedBy INT,

  INDEX idx_dsc_projectId (projectId),
  INDEX idx_dsc_drawingAnalysisId (drawingAnalysisId)
);
