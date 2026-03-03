export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Use stable custom domain for OAuth redirect URI to match registered callback URL
// This prevents "access denied" errors when accessing via preview domain
const OAUTH_REDIRECT_URI = "https://buildingcode-9f4j2cdo.manus.space/api/oauth/callback";

export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  // State should be base64-encoded redirect URI for the callback to decode
  const state = btoa(OAUTH_REDIRECT_URI);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  // Note: redirectUri is NOT sent to OAuth server - it's encoded in state
  // The OAuth server will use the redirectUri registered in the app settings
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
