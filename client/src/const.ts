export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const origin = window.location.origin;
  const redirectUri = `${origin}/api/oauth/callback`;
  
  // Log OAuth debug info
  console.log("\n[OAuth] Debug Info:");
  console.log("  Current domain (window.location.origin):", origin);
  console.log("  App ID:", appId);
  console.log("  OAuth Portal:", oauthPortalUrl);
  console.log("  Redirect URI:", redirectUri);
  console.log("  State (base64):", btoa(redirectUri).substring(0, 20) + "...");
  
  // State should be base64-encoded redirect URI for the callback to decode
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  // Note: redirectUri is NOT sent to OAuth server - it's encoded in state
  // The OAuth server will use the redirectUri registered in the app settings
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");
  
  console.log("  Final OAuth URL:", url.toString().substring(0, 100) + "...");
  console.log("\n");

  return url.toString();
};
