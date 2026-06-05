-- APS (Autodesk Platform Services) integration tables
-- Migration 0030: apsConnections + bcProjectLinks

CREATE TABLE IF NOT EXISTS apsConnections (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  userId          INT NOT NULL,
  accessToken     TEXT,
  refreshToken    TEXT,
  tokenExpiresAt  TIMESTAMP NULL,
  apsAccountId    VARCHAR(100),
  companyName     VARCHAR(200),
  createdAt       TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  UNIQUE KEY uq_user (userId)
);

CREATE TABLE IF NOT EXISTS bcProjectLinks (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  userId               INT NOT NULL,
  bcProjectId          VARCHAR(100) NOT NULL,
  bcProjectName        VARCHAR(200),
  apsProjectId         VARCHAR(100),
  codeComplyProjectId  INT,
  autoCheckEnabled     TINYINT NOT NULL DEFAULT 1,
  lastCheckedAt        TIMESTAMP NULL,
  lastReportId         VARCHAR(200),
  issueCount           INT DEFAULT 0,
  createdAt            TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                       ON UPDATE CURRENT_TIMESTAMP NOT NULL
);
