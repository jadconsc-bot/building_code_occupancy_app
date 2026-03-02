/**
 * Database Indexes for Performance Optimization
 * Run these queries to add indexes to your database
 */

-- User queries optimization
CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openId);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Project queries optimization
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(userId);
CREATE INDEX IF NOT EXISTS idx_projects_occupancy_code ON projects(occupancyCode);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(createdAt);

-- Checklist items optimization
CREATE INDEX IF NOT EXISTS idx_checklist_project_id ON projectChecklistItems(projectId);
CREATE INDEX IF NOT EXISTS idx_checklist_completed ON projectChecklistItems(isCompleted);
CREATE INDEX IF NOT EXISTS idx_checklist_phase ON projectChecklistItems(phase);

-- Calculator results optimization
CREATE INDEX IF NOT EXISTS idx_results_project_id ON projectCalculatorResults(projectId);
CREATE INDEX IF NOT EXISTS idx_results_type ON projectCalculatorResults(calculationType);

-- Usage metrics optimization
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON usageMetrics(userId);
CREATE INDEX IF NOT EXISTS idx_usage_month ON usageMetrics(month);
CREATE INDEX IF NOT EXISTS idx_usage_user_month ON usageMetrics(userId, month);

-- Subscription optimization
CREATE INDEX IF NOT EXISTS idx_subscription_user_id ON userSubscriptions(userId);
CREATE INDEX IF NOT EXISTS idx_subscription_status ON userSubscriptions(status);

-- Bookmarks optimization
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(userId);
CREATE INDEX IF NOT EXISTS idx_bookmarks_code ON bookmarks(occupancyCode);

-- Notes optimization
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(userId);
CREATE INDEX IF NOT EXISTS idx_notes_code ON notes(occupancyCode);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_projects_user_created ON projects(userId, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_checklist_project_completed ON projectChecklistItems(projectId, isCompleted);
CREATE INDEX IF NOT EXISTS idx_usage_user_month_created ON usageMetrics(userId, month, createdAt DESC);
