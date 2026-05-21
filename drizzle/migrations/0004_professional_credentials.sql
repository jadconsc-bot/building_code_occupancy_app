-- 0004: Professional Credentials table + drawingAnalyses credential columns
CREATE TABLE `professionalCredentials` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `licenseNumber` varchar(50) NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `province` varchar(10) NOT NULL,
  `discipline` varchar(20) NOT NULL,
  `registryName` varchar(20) NOT NULL,
  `verifiedName` varchar(255),
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `licenseExpiryDate` date NOT NULL,
  `lastVerifiedAt` timestamp,
  `verificationMethod` varchar(20) DEFAULT 'live_lookup',
  `rawResponseHash` varchar(64),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `professionalCredentials_id` PRIMARY KEY(`id`),
  INDEX `idx_userId` (`userId`),
  INDEX `idx_licenseNumber` (`licenseNumber`),
  INDEX `idx_status` (`status`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
);

ALTER TABLE `drawingAnalyses`
  ADD COLUMN `reviewerCredentialId` int,
  ADD COLUMN `credentialStatusAtReview` varchar(20),
  ADD FOREIGN KEY (`reviewerCredentialId`) REFERENCES `professionalCredentials`(`id`);
