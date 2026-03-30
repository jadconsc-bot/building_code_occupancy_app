export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// ─────────────────────────────────────────────────────────────────────────────
// TEMPORARY FIX — OAuth Callback URL Hardcoded
// ─────────────────────────────────────────────────────────────────────────────
// Problem:  The callback URL was dynamically built from window.location.origin,
//           which produces a different URL on the preview domain (*.manus.computer)
//           vs the custom domain (buildingcode-9f4j2cdo.manus.space). The Manus
//           OAuth server rejects any callback URL not in its registered redirect
//           URIs list, causing "permission denied, callback URI not set" on login.
//
// Workaround: Hardcode the stable custom domain so the OAuth server always
//             receives the same registered URL regardless of which domain the
//             user is visiting from.
//
// TODO — REVERT THIS once OAuth redirect URIs are properly configured:
//   1. Log into the personal Manus account that owns App ID: 9F4J2CDosTHNgtZbintBLn
//   2. Navigate to the OAuth app settings for the CodeComply project
//   3. Register BOTH callback URLs:
//        https://buildingcode-9f4j2cdo.manus.space/api/oauth/callback
//        https://<preview-domain>.manus.computer/api/oauth/callback
//   4. In this file, replace the OAUTH_CALLBACK_ORIGIN constant usage with:
//        const redirectUri = `${window.location.origin}/api/oauth/callback`;
//   5. Delete the OAUTH_CALLBACK_ORIGIN constant and this comment block
// ─────────────────────────────────────────────────────────────────────────────
const OAUTH_CALLBACK_ORIGIN = "https://buildingcode-9f4j2cdo.manus.space"; // TEMPORARY — see TODO above

// Generate login URL at runtime.
// The redirect URI MUST match what's registered in Manus OAuth app settings.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // TEMPORARY: hardcoded stable domain — see TODO above to revert
  const redirectUri = `${OAUTH_CALLBACK_ORIGIN}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

// Generate registration URL for new users.
export const getRegistrationUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // TEMPORARY: hardcoded stable domain — see TODO above to revert
  const redirectUri = `${OAUTH_CALLBACK_ORIGIN}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signUp");

  return url.toString();
};
