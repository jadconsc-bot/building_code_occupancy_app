export const APS_CLIENT_ID =
  process.env.APS_CLIENT_ID ?? "";
export const APS_CLIENT_SECRET =
  process.env.APS_CLIENT_SECRET ?? "";
export const APS_CALLBACK_URL =
  process.env.APS_CALLBACK_URL ??
  "http://localhost:3000/api/autodesk/callback";
export const APS_SCOPE = [
  "data:read",
  "data:write",
  "data:create",
  "account:read",
  "bucket:read",
].join(" ");
