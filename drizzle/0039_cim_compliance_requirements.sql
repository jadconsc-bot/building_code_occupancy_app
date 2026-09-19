CREATE TABLE `complianceRequirementSnapshots` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `projectId` INT NOT NULL,
  `snapshotVersion` INT NOT NULL,
  `scope` VARCHAR(50) NOT NULL,
  `contentHash` CHAR(64) NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_compliance_snapshot` (`projectId`, `scope`, `snapshotVersion`),
  INDEX `idx_compliance_snapshot_hash` (`projectId`, `scope`, `contentHash`),
  CONSTRAINT `fk_compliance_snapshot_project` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `complianceRequirements` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `projectId` INT NOT NULL,
  `snapshotVersion` INT NOT NULL,
  `provisionRef` VARCHAR(255) NOT NULL,
  `requirementType` VARCHAR(100) NOT NULL,
  `appliesTo` JSON NOT NULL,
  `requiredValue` JSON NOT NULL,
  `actualValue` JSON NULL,
  `status` ENUM('compliant', 'violation', 'insufficient-evidence', 'stale') NOT NULL,
  `triggeredBy` JSON NOT NULL,
  `supersedes` VARCHAR(36) NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_complianceRequirements_project_snapshot` (`projectId`, `snapshotVersion`),
  INDEX `idx_complianceRequirements_status` (`projectId`, `status`),
  CONSTRAINT `fk_complianceRequirements_project` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_complianceRequirements_supersedes` FOREIGN KEY (`supersedes`) REFERENCES `complianceRequirements` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `requirementDependencies` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `projectId` INT NOT NULL,
  `requirementId` VARCHAR(36) NOT NULL,
  `dependsOnRequirementId` VARCHAR(36) NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_requirement_dependency` (`requirementId`, `dependsOnRequirementId`),
  INDEX `idx_requirementDependencies_project` (`projectId`),
  INDEX `idx_requirementDependencies_depends_on` (`dependsOnRequirementId`),
  CONSTRAINT `fk_requirementDependencies_project` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_requirementDependencies_requirement` FOREIGN KEY (`requirementId`) REFERENCES `complianceRequirements` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_requirementDependencies_depends_on` FOREIGN KEY (`dependsOnRequirementId`) REFERENCES `complianceRequirements` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
