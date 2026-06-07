ALTER TABLE userSubscriptions
  ADD COLUMN contractorPackPurchased BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN contractorPackPurchasedAt DATETIME NULL;
