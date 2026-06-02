-- Founding Member LTP offer
ALTER TABLE userSubscriptions
  ADD COLUMN isFoundingMember TINYINT NOT NULL DEFAULT 0,
  ADD COLUMN homeReportsRemaining INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS foundingMemberCounter (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  claimed    INT NOT NULL DEFAULT 247,
  cap        INT NOT NULL DEFAULT 1000,
  updatedAt  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
             ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO foundingMemberCounter (claimed, cap)
VALUES (247, 1000)
ON DUPLICATE KEY UPDATE claimed = claimed;
