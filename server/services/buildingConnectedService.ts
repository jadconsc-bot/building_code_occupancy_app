const BC_BASE =
  "https://developer.api.autodesk.com/construction/buildingconnected/v2";
const DM_BASE = "https://developer.api.autodesk.com/data/v1";
const WEBHOOK_BASE = "https://developer.api.autodesk.com/webhooks/v1";

export async function getBCProjects(accessToken: string) {
  const res = await fetch(`${BC_BASE}/projects?limit=100`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`BC projects fetch failed: ${res.status}`);
  const data = await res.json();
  return data.results ?? [];
}

export async function getBidPackages(
  accessToken: string,
  projectId: string,
) {
  const res = await fetch(
    `${BC_BASE}/bid-packages?projectId=${projectId}&limit=100`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`BC bid packages fetch failed: ${res.status}`);
  const data = await res.json();
  return data.results ?? [];
}

export async function getFolderContents(
  accessToken: string,
  apsProjectId: string,
  folderId: string,
) {
  const res = await fetch(
    `${DM_BASE}/projects/${apsProjectId}/folders/${folderId}/contents`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`Folder contents fetch failed: ${res.status}`);
  return res.json();
}

export async function postOpportunityComment(
  accessToken: string,
  opportunityId: string,
  htmlContent: string,
) {
  const res = await fetch(
    `${BC_BASE}/opportunities/${opportunityId}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: htmlContent }),
    },
  );
  if (!res.ok) throw new Error(`Comment post failed: ${res.status}`);
  return res.json();
}

export async function registerWebhook(
  accessToken: string,
  callbackUrl: string,
  companyId: string,
) {
  const events = [
    "opportunity.created",
    "opportunity.status.updated",
    "bid.created",
  ];

  const results = [];
  for (const event of events) {
    const res = await fetch(
      `${WEBHOOK_BASE}/systems/buildingconnected/hooks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          callbackUrl,
          scope: { companyId },
          event,
        }),
      },
    );
    if (res.ok) results.push(await res.json());
  }
  return results;
}
