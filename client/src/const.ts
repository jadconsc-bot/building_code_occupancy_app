export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
// The redirect URI MUST match what's registered in Manus OAuth app settings
export const getLoginUrl = () => {
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

// Generate registration URL for new users
export const getRegistrationUrl = () => {
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
  url.searchParams.set("type", "signUp");

  return url.toString();
};
