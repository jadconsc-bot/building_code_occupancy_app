/**
 * CodeComply Home — Email Service
 *
 * Pluggable email delivery. Checks RESEND_API_KEY env var.
 * If not configured, logs the report link (dev/staging fallback).
 *
 * To wire up production email:
 *   1. Set RESEND_API_KEY in Railway env vars
 *   2. Set RESEND_FROM_EMAIL (e.g. "reports@codecomply.ca")
 * Resend is recommended: simple REST API, great deliverability, free tier.
 */

interface SendReportEmailOptions {
  to: string;
  reportToken: string;
  projectTypeLabel: string;
  downloadUrl: string;
  expiresAt: Date;
}

export async function sendReportEmail(opts: SendReportEmailOptions): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "reports@codecomply.ca";

  if (!resendKey) {
    console.log(
      `[HomeEmail] RESEND_API_KEY not configured — skipping email delivery.\n` +
      `  To: ${opts.to}\n` +
      `  Subject: Your CodeComply Home Report is ready\n` +
      `  Download: ${opts.downloadUrl}\n` +
      `  Expires: ${opts.expiresAt.toISOString()}`,
    );
    return;
  }

  const html = buildEmailHtml(opts);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: opts.to,
      subject: `Your CodeComply Home Report — ${opts.projectTypeLabel}`,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[HomeEmail] Resend delivery failed: ${res.status} ${body}`);
  }
}

function buildEmailHtml(opts: SendReportEmailOptions): string {
  const expiry = opts.expiresAt.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
  return `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #374151;">
  <div style="background: #1e40af; padding: 20px 24px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">CodeComply Home</h1>
    <p style="color: #bfdbfe; margin: 4px 0 0;">Building Code Compliance Report</p>
  </div>
  <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    <p>Your compliance report for <strong>${opts.projectTypeLabel}</strong> is ready.</p>
    <a href="${opts.downloadUrl}"
       style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 12px 0;">
      Download Your Report
    </a>
    <p style="color: #6b7280; font-size: 13px;">
      This link expires on <strong>${expiry}</strong>. After that date, you will need to contact support to recover your report.
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
    <p style="color: #9ca3af; font-size: 11px;">
      This report is based on the information you provided and the applicable building code at the time of generation.
      It is not a professional stamp, building permit, or zoning opinion.
      Always verify requirements with your local building department before construction.
    </p>
  </div>
</body>
</html>`;
}
