// Ported from imihealth-web/src/lib/email-template/*. The web project will
// likely keep evolving these — keep them in sync (or extract a shared package
// later, as the user noted).

const BRAND = {
  navy: "#0f172a",
  teal: "#2a9d90",
  lightBg: "#f1f5f9",
  white: "#ffffff",
  gray: "#64748b",
  border: "#e2e8f0",
  fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  logoUrl: "https://www.imihealth.ai/assets/images/imihealth-logo.webp",
} as const;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function brandedEmail({
  preheader,
  body,
  footerTagline = "AI-powered medical consultation reports",
}: {
  preheader?: string;
  body: string;
  footerTagline?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>IMI Health</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.lightBg};font-family:${BRAND.fontFamily};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.lightBg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${BRAND.white};border-radius:12px;overflow:hidden;border:1px solid ${BRAND.border};">
          <tr>
            <td style="background-color:${BRAND.white};padding:24px 32px;text-align:center;border-bottom:1px solid ${BRAND.border};">
              <img src="${BRAND.logoUrl}" alt="IMI Health" width="180" style="display:block;margin:0 auto;max-width:180px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:${BRAND.navy};font-size:15px;line-height:1.6;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px;">
              <hr style="border:none;border-top:1px solid ${BRAND.border};margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;text-align:center;color:${BRAND.gray};font-size:12px;line-height:1.5;">
              <p style="margin:0 0 4px;">
                &copy; ${new Date().getFullYear()} IMI Health &mdash; ${escapeHtml(footerTagline)}
              </p>
              <p style="margin:0;">
                <a href="https://imihealth.ai" style="color:${BRAND.teal};text-decoration:none;">imihealth.ai</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function reportContentToHtml(reportContent: string): string {
  return reportContent
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "<br />";
      if (trimmed.startsWith("#")) {
        const clean = trimmed.replace(/^#+\s*/, "").replace(/\*\*/g, "");
        return `<p style="font-weight:700;font-size:16px;color:${BRAND.navy};margin:16px 0 4px;">${escapeHtml(clean)}</p>`;
      }
      if (/^\*\*[^*]+\*\*:?\s*$/.test(trimmed)) {
        const clean = trimmed.replace(/\*\*/g, "").trim();
        return `<p style="font-weight:600;color:${BRAND.navy};margin:12px 0 2px;">${escapeHtml(clean)}</p>`;
      }
      return `<p style="margin:4px 0;">${escapeHtml(trimmed)}</p>`;
    })
    .join("\n");
}

export interface EmailLabels {
  /** Pre-rendered greeting — may contain `<strong>` HTML. */
  greeting: string;
  intro: string;
  disclaimer: string;
  preheader: string;
  footerTagline: string;
}

export function doctorReportEmail({
  reportContent,
  labels,
}: {
  reportContent: string;
  labels: EmailLabels;
}): string {
  const reportHtml = reportContentToHtml(reportContent);
  const body = `
    <p style="margin:0 0 16px;">${labels.greeting}</p>
    <p style="margin:0 0 24px;">
      ${escapeHtml(labels.intro)} <span style="color:${BRAND.teal};font-weight:600;">IMI Health</span>:
    </p>
    <div style="background-color:${BRAND.lightBg};border-radius:8px;padding:20px 24px;border-left:4px solid ${BRAND.teal};">
      ${reportHtml}
    </div>
    <p style="margin:24px 0 0;font-size:13px;color:${BRAND.gray};">
      ${escapeHtml(labels.disclaimer)}
    </p>`;
  return brandedEmail({
    preheader: labels.preheader,
    body,
    footerTagline: labels.footerTagline,
  });
}

export function patientReportEmail({
  reportContent,
  labels,
}: {
  reportContent: string;
  labels: EmailLabels;
}): string {
  const reportHtml = reportContentToHtml(reportContent);
  const body = `
    <p style="margin:0 0 16px;">${labels.greeting}</p>
    <p style="margin:0 0 24px;">
      ${escapeHtml(labels.intro)} <span style="color:${BRAND.teal};font-weight:600;">IMI Health</span>:
    </p>
    <div style="background-color:${BRAND.lightBg};border-radius:8px;padding:20px 24px;border-left:4px solid ${BRAND.teal};">
      ${reportHtml}
    </div>
    <p style="margin:24px 0 0;font-size:13px;color:${BRAND.gray};">
      ${escapeHtml(labels.disclaimer)}
    </p>`;
  return brandedEmail({
    preheader: labels.preheader,
    body,
    footerTagline: labels.footerTagline,
  });
}
