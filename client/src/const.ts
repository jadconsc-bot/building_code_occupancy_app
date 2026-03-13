export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Check if dev auth mode is enabled
const isDevAuthMode = () => {
  return import.meta.env.VITE_DEV_AUTH_MODE === 'true' || 
         import.meta.env.VITE_DEV_AUTH_MODE === true;
};

// Generate login URL at runtime so redirect URI reflects the current origin.
// The redirect URI MUST match what's registered in Manus OAuth app settings
export const getLoginUrl = () => {
  // If dev auth mode is enabled, return the home page (dev login will show there)
  if (isDevAuthMode()) {
    return '/';
  }
  
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  // State should be base64-encoded redirect URI for the callback to decode
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  // Note: redirectUri is NOT sent to OAuth server - it's encoded in state
  // The OAuth server will use the redirectUri registered in the app settings
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

export const isDevAuth = isDevAuthMode;
