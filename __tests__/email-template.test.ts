import { doctorReportEmail, patientReportEmail, type EmailLabels } from "@/src/lib/email-template";

const labels: EmailLabels = {
  greeting: "<strong>Hi Doctor</strong>",
  intro: 'Intro with "quotes" & <tags>',
  disclaimer: "Disclaimer",
  preheader: "Preheader text",
  footerTagline: "Tagline",
};

describe("doctorReportEmail", () => {
  it("renders branded HTML with the report body", () => {
    const html = doctorReportEmail({
      reportContent: "Line 1\n\n## Heading\n**Bold:**\nNormal",
      labels,
    });
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("IMI Health");
    expect(html).toContain(labels.greeting);
    expect(html).toContain("Heading");
    expect(html).toContain("Bold:");
    expect(html).toContain("Normal");
  });

  it("escapes html-unsafe characters in labels", () => {
    const html = doctorReportEmail({ reportContent: "x", labels });
    expect(html).toContain("&lt;tags&gt;");
  });

  it("includes a preheader span when provided", () => {
    const html = doctorReportEmail({ reportContent: "x", labels });
    expect(html).toContain("Preheader text");
  });
});

describe("patientReportEmail", () => {
  it("renders branded HTML for patient reports", () => {
    const html = patientReportEmail({
      reportContent: "# Title\nbody line",
      labels,
    });
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Title");
    expect(html).toContain("body line");
  });

  it("handles empty preheader gracefully", () => {
    const html = patientReportEmail({
      reportContent: "body",
      labels: { ...labels, preheader: "" },
    });
    expect(html).toContain("<!DOCTYPE html>");
  });

  it("inserts <br /> for blank lines", () => {
    const html = patientReportEmail({ reportContent: "a\n\nb", labels });
    expect(html).toContain("<br />");
  });
});
