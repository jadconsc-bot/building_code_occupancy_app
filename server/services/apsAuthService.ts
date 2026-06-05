import {
  APS_CLIENT_ID,
  APS_CLIENT_SECRET,
  APS_CALLBACK_URL,
  APS_SCOPE,
} from "../_core/apsEnv.js";

const APS_BASE = "https://developer.api.autodesk.com";

export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: APS_CLIENT_ID,
    redirect_uri: APS_CALLBACK_URL,
    scope: APS_SCOPE,
    state,
  });
  return `${APS_BASE}/authentication/v2/authorize?${params}`;
}

export async function exchangeCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(`${APS_BASE}/authentication/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: APS_CLIENT_ID,
      client_secret: APS_CLIENT_SECRET,
      redirect_uri: APS_CALLBACK_URL,
    }),
  });
  if (!res.ok) throw new Error(`APS token exchange failed: ${res.status}`);
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(`${APS_BASE}/authentication/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: APS_CLIENT_ID,
      client_secret: APS_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error(`APS token refresh failed: ${res.status}`);
  return res.json();
}
