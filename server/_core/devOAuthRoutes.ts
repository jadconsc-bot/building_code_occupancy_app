/**
 * ⚠️ DEVELOPMENT ONLY - REMOVE FOR PRODUCTION
 * 
 * Development OAuth Routes
 * 
 * Provides simple password-based authentication for development testing.
 * Allows testing without external OAuth dependencies.
 * 
 * REMOVAL INSTRUCTIONS:
 * 1. Delete this entire file: rm server/_core/devOAuthRoutes.ts
 * 2. Remove import from server/_core/index.ts
 * 3. Remove route registration from server/_core/index.ts
 * 4. See DEV_AUTH_REMOVAL_GUIDE.md for complete removal steps
 * 
 * PRODUCTION IMPACT: None - Dev routes removed, OAuth used instead
 * 
 * Created: 2026-03-08
 * Status: Development Only
 */

import type { Express } from "express";
import { ENV } from "./env";
import { getDevUser, generateDevSessionToken } from "./devAuth";

export function registerDevOAuthRoutes(app: Express) {
  // Only register dev routes if DEV_AUTH_MODE is enabled
  if (!ENV.devAuthMode) {
    return;
  }

  // Dev login page with HTML form
  app.get("/api/dev/login", (_req, res) => {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Dev Login</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .login-box {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      width: 100%;
      max-width: 400px;
    }
    h1 {
      color: #333;
      margin-top: 0;
      text-align: center;
    }
    .dev-notice {
      background: #fff3cd;
      border: 1px solid #ffc107;
      color: #856404;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      color: #555;
      font-weight: 600;
      font-size: 14px;
    }
    input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
    }
    input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    button {
      width: 100%;
      padding: 10px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover {
      background: #5568d3;
    }
    .users-list {
      background: #f0f0f0;
      padding: 15px;
      border-radius: 4px;
      margin-top: 20px;
      font-size: 12px;
    }
    .users-list strong {
      display: block;
      margin-bottom: 8px;
    }
    .user-item {
      padding: 5px 0;
      border-bottom: 1px solid #ddd;
    }
    .user-item:last-child {
      border-bottom: none;
    }
    code {
      background: white;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="login-box">
    <h1>🧪 Dev Login</h1>
    
    <div class="dev-notice">
      ⚠️ This is a development-only login page. Not for production use.
    </div>

    <form method="POST">
      <div class="form-group">
        <label>Password:</label>
        <input type="password" name="password" placeholder="Enter password" required autofocus>
      </div>
      <button type="submit">Login</button>
    </form>

    <div class="users-list">
      <strong>Available Dev Users:</strong>
      <div class="user-item">
        <code>admin@dev.local</code> / <code>admin123</code>
      </div>
      <div class="user-item">
        <code>user1@dev.local</code> / <code>user123</code>
      </div>
      <div class="user-item">
        <code>user2@dev.local</code> / <code>user456</code>
      </div>
    </div>
  </div>
</body>
</html>
    `;
    res.set("Content-Type", "text/html").send(html);
  });

  // Dev login POST handler
  app.post("/api/dev/login", (req, res) => {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password required" });
    }

    // Get dev user by password
    const user = getDevUser(password);

    if (!user) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Generate session token
    const token = generateDevSessionToken(user.id);

    // Set session cookie
    res.cookie("dev-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to home or return success
    res.json({ success: true, user });
  });

  // Dev logout handler
  app.post("/api/dev/logout", (req, res) => {
    res.clearCookie("dev-session");
    res.json({ success: true });
  });

  console.log("[DevOAuthRoutes] Development OAuth routes registered");
}
