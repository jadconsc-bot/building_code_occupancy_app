-- Add home_user role to users table
ALTER TABLE users MODIFY COLUMN role
  ENUM('free','home_user','basic','professional','rule_editor','admin','org_admin')
  NOT NULL DEFAULT 'free';
