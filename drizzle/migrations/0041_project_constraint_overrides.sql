CREATE TABLE `projectConstraintOverrides` (
  `id` int NOT NULL AUTO_INCREMENT,
  `projectId` int NOT NULL,
  `snapshotId` varchar(100) NOT NULL,
  `constraintId` varchar(255) NOT NULL,
  `assertedValue` text NOT NULL,
  `justification` text NOT NULL,
  `createdByUserId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `credentialEngineerName` varchar(255) NOT NULL,
  `credentialLicenseNumber` varchar(100) NOT NULL,
  `credentialAssociation` varchar(100) NOT NULL,
  `credentialAssociationProvince` varchar(50) NULL,
  PRIMARY KEY (`id`),
  KEY `projectConstraintOverrides_project_idx` (`projectId`),
  KEY `projectConstraintOverrides_snapshot_idx` (`snapshotId`),
  KEY `projectConstraintOverrides_created_by_idx` (`createdByUserId`)
);
