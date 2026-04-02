const { Resend } = require("resend");

const getClient = () => {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
};

const FROM = () => process.env.EMAIL_FROM || "FleetIQ <noreply@fleetiq.app>";

const emailShell = (title, body) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: #fff; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 20px; }
    .body { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .box { background: #fff; border: 2px solid #4F46E5; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .row { margin: 10px 0; padding: 10px; background: #f0f0f0; border-radius: 4px; }
    .label { font-weight: bold; color: #4F46E5; font-size: 12px; text-transform: uppercase; }
    .value { font-family: monospace; font-size: 16px; margin-top: 4px; }
    .warning { background: #fff3cd; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 16px 0; font-size: 14px; }
    .badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: bold; }
    .footer { text-align: center; margin-top: 24px; color: #999; font-size: 11px; }
  </style>
</head>
<body>
  <div class="header"><h1>${title}</h1></div>
  <div class="body">${body}</div>
  <div class="footer">This is an automated message. Please do not reply.</div>
</body>
</html>`;

// Sends login credentials to a newly created driver (direct admin creation)
const sendDriverCredentialsEmail = async (email, name, username, password) => {
  const resend = getClient();
  if (!resend) {
    console.warn("⚠️  RESEND_API_KEY not set. Skipping driver credentials email.");
    return;
  }

  const html = emailShell(
    "FleetIQ — Your Driver Account",
    `<p>Dear ${name},</p>
    <p>Your driver account has been created. Use the credentials below to log in to the FleetIQ driver portal.</p>
    <div class="box">
      <div class="row"><div class="label">Username</div><div class="value">${username}</div></div>
      <div class="row"><div class="label">Password</div><div class="value">${password}</div></div>
    </div>
    <div class="warning"><strong>Important:</strong> Please change your password after your first login.</div>
    <p>Best regards,<br><strong>FleetIQ Team</strong></p>`
  );

  await resend.emails.send({
    from: FROM(),
    to: email,
    subject: "Welcome to FleetIQ — Your Driver Login Credentials",
    html,
  });

  console.log(`✅ Driver credentials email sent to ${email}`);
};

// Sends welcome + credentials when a driver application is approved
const sendDriverApplicationApprovedEmail = async (email, name, username, password) => {
  const resend = getClient();
  if (!resend) {
    console.warn("⚠️  RESEND_API_KEY not set. Skipping application approval email.");
    return;
  }

  const html = emailShell(
    "FleetIQ — Application Approved!",
    `<p>Dear ${name},</p>
    <p>We are pleased to inform you that your driver application has been <strong>approved</strong>. Welcome aboard!</p>
    <p>You can now access the FleetIQ driver portal using the credentials below:</p>
    <div class="box">
      <div class="row"><div class="label">Username</div><div class="value">${username}</div></div>
      <div class="row"><div class="label">Password</div><div class="value">${password}</div></div>
    </div>
    <div class="warning"><strong>Important:</strong> For security, please change your password immediately after your first login.</div>
    <p>If you have any questions, please contact your fleet administrator.</p>
    <p>Best regards,<br><strong>FleetIQ Team</strong></p>`
  );

  await resend.emails.send({
    from: FROM(),
    to: email,
    subject: "Your Driver Application Has Been Approved — FleetIQ",
    html,
  });

  console.log(`✅ Application approval email sent to ${email}`);
};

// Notifies a driver when their timesheet is approved
const sendTimesheetApprovedEmail = async (driverEmail, driverName, date, customer, totalHours) => {
  const resend = getClient();
  if (!resend) {
    console.warn("⚠️  RESEND_API_KEY not set. Skipping timesheet approval email.");
    return;
  }

  const html = emailShell(
    "FleetIQ — Timesheet Approved",
    `<p>Dear ${driverName || driverEmail},</p>
    <p>Your timesheet has been reviewed and <span class="badge">Approved</span></p>
    <div class="box">
      <div class="row"><div class="label">Date</div><div class="value">${date || "—"}</div></div>
      <div class="row"><div class="label">Customer</div><div class="value">${customer || "—"}</div></div>
      <div class="row"><div class="label">Total Hours</div><div class="value">${totalHours || "—"}</div></div>
    </div>
    <p>Log in to the driver portal to view your timesheet details.</p>
    <p>Best regards,<br><strong>FleetIQ Team</strong></p>`
  );

  await resend.emails.send({
    from: FROM(),
    to: driverEmail,
    subject: `Your Timesheet Has Been Approved — ${date || "FleetIQ"}`,
    html,
  });

  console.log(`✅ Timesheet approval email sent to ${driverEmail}`);
};

// Sends an invoice PDF to a driver
const sendInvoiceEmail = async (driverEmail, driverName, amount, pdfBase64) => {
  const resend = getClient();
  if (!resend) {
    console.warn("⚠️  RESEND_API_KEY not set. Skipping invoice email.");
    return;
  }

  const html = emailShell(
    "FleetIQ — Your Invoice",
    `<p>Dear ${driverName || driverEmail},</p>
    <p>Please find your invoice attached to this email.</p>
    <div class="box">
      <div class="row"><div class="label">Invoice Total</div><div class="value">$${amount}</div></div>
    </div>
    <p>If you have any questions, please contact your fleet administrator.</p>
    <p>Best regards,<br><strong>FleetIQ Team</strong></p>`
  );

  const emailPayload = {
    from: FROM(),
    to: driverEmail,
    subject: "Your Invoice — FleetIQ",
    html,
  };

  if (pdfBase64) {
    emailPayload.attachments = [{ filename: "invoice.pdf", content: Buffer.from(pdfBase64, "base64") }];
  }

  await resend.emails.send(emailPayload);
  console.log(`✅ Invoice email sent to ${driverEmail}`);
};

// Sends daily fleet digest to a company_admin
const sendDailyDigestEmail = async (email, name, orgName, sections) => {
  const resend = getClient();
  if (!resend) {
    console.warn("⚠️  RESEND_API_KEY not set. Skipping daily digest email.");
    return;
  }

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const daysUntil = (dateVal) => {
    const diff = new Date(dateVal) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const urgencyColor = (days) => {
    if (days <= 0) return "#ef4444";   // red — overdue
    if (days <= 3) return "#ef4444";   // red — critical
    if (days <= 14) return "#f59e0b";  // amber — warning
    return "#3b82f6";                  // blue — informational
  };

  const urgencyBg = (days) => {
    if (days <= 3) return "#fef2f2";
    if (days <= 14) return "#fffbeb";
    return "#eff6ff";
  };

  const vehicleLabel = (v) => v ? `${v.unitNumber || ""} ${v.make || ""} ${v.model || ""}`.trim() : "—";

  const sectionHtml = (title, rows) => {
    if (!rows || rows.length === 0) return "";
    return `
      <div style="margin:20px 0;">
        <div style="background:#4F46E5;color:#fff;padding:10px 16px;border-radius:6px 6px 0 0;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.05em;">${title} (${rows.length})</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 6px 6px;">
          ${rows.join("")}
        </table>
      </div>`;
  };

  const row = (label, detail, badgeText, badgeColor, badgeBg) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:13px;">
        <div style="font-weight:600;color:#111;">${label}</div>
        <div style="color:#6b7280;margin-top:2px;">${detail}</div>
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;text-align:right;white-space:nowrap;">
        <span style="display:inline-block;background:${badgeBg};color:${badgeColor};padding:3px 10px;border-radius:9999px;font-size:12px;font-weight:600;">${badgeText}</span>
      </td>
    </tr>`;

  let body = `<p>Good morning, <strong>${name || "Fleet Admin"}</strong>.</p>
  <p>Here is your daily fleet health summary for <strong>${orgName}</strong> on ${date}.</p>`;

  // Warranties
  if (sections.warranties && sections.warranties.length > 0) {
    const rows = sections.warranties.map((w) => {
      const days = daysUntil(w.expiryDate);
      return row(
        `${w.title} — ${vehicleLabel(w.vehicleId)}`,
        `Type: ${w.type}${w.provider ? ` · ${w.provider}` : ""}`,
        days <= 0 ? "Expired" : `${days}d left`,
        urgencyColor(days), urgencyBg(days)
      );
    });
    body += sectionHtml("Warranties Expiring Soon", rows);
  }

  // Overdue maintenance
  if (sections.maintenance_overdue && sections.maintenance_overdue.length > 0) {
    const rows = sections.maintenance_overdue.map((m) => {
      const days = daysUntil(m.scheduledDate);
      return row(
        `${m.title || m.type || "Maintenance"} — ${vehicleLabel(m.vehicleId)}`,
        `Scheduled: ${new Date(m.scheduledDate).toLocaleDateString()}`,
        `${Math.abs(days)}d overdue`,
        "#ef4444", "#fef2f2"
      );
    });
    body += sectionHtml("Overdue Maintenance", rows);
  }

  // Upcoming maintenance
  if (sections.maintenance_upcoming && sections.maintenance_upcoming.length > 0) {
    const rows = sections.maintenance_upcoming.map((m) => {
      const days = daysUntil(m.scheduledDate);
      return row(
        `${m.title || m.type || "Maintenance"} — ${vehicleLabel(m.vehicleId)}`,
        `Scheduled: ${new Date(m.scheduledDate).toLocaleDateString()}`,
        `in ${days}d`,
        urgencyColor(days), urgencyBg(days)
      );
    });
    body += sectionHtml("Upcoming Maintenance (14 days)", rows);
  }

  // Overdue PM
  if (sections.pm_overdue && sections.pm_overdue.length > 0) {
    const rows = sections.pm_overdue.map((p) =>
      row(
        `${p.taskName || "PM"} — ${vehicleLabel(p.vehicleId)}`,
        p.nextDueDate ? `Was due: ${new Date(p.nextDueDate).toLocaleDateString()}` : "Past due",
        "Overdue",
        "#ef4444", "#fef2f2"
      )
    );
    body += sectionHtml("Preventive Maintenance Overdue", rows);
  }

  // PM due soon
  if (sections.pm_due_soon && sections.pm_due_soon.length > 0) {
    const rows = sections.pm_due_soon.map((p) => {
      const days = p.nextDueDate ? daysUntil(p.nextDueDate) : null;
      return row(
        `${p.taskName || "PM"} — ${vehicleLabel(p.vehicleId)}`,
        p.nextDueDate ? `Due: ${new Date(p.nextDueDate).toLocaleDateString()}` : "Due soon",
        days !== null ? `in ${days}d` : "Due soon",
        "#f59e0b", "#fffbeb"
      );
    });
    body += sectionHtml("Preventive Maintenance Due Soon", rows);
  }

  // Insurance expiring
  if (sections.insurance && sections.insurance.length > 0) {
    const rows = sections.insurance.map((v) => {
      const days = daysUntil(v.insuranceExpiry);
      return row(
        vehicleLabel(v),
        `Insurance expires: ${new Date(v.insuranceExpiry).toLocaleDateString()}`,
        `${days}d left`,
        urgencyColor(days), urgencyBg(days)
      );
    });
    body += sectionHtml("Insurance Expiring (30 days)", rows);
  }

  // Registration expiring
  if (sections.registration && sections.registration.length > 0) {
    const rows = sections.registration.map((v) => {
      const days = daysUntil(v.registrationExpiry);
      return row(
        vehicleLabel(v),
        `Registration expires: ${new Date(v.registrationExpiry).toLocaleDateString()}`,
        `${days}d left`,
        urgencyColor(days), urgencyBg(days)
      );
    });
    body += sectionHtml("Registration Expiring (30 days)", rows);
  }

  // Vehicles out of service
  if (sections.vehicles_oos && sections.vehicles_oos.length > 0) {
    const rows = sections.vehicles_oos.map((v) =>
      row(vehicleLabel(v), "Status: Out of Service", "OOS", "#ef4444", "#fef2f2")
    );
    body += sectionHtml("Vehicles Out of Service", rows);
  }

  // Driver licences
  if (sections.driver_licences && sections.driver_licences.length > 0) {
    const rows = sections.driver_licences.map((d) => {
      const days = daysUntil(d.licence_expiry_date);
      return row(
        d.name || d.email,
        `Licence expires: ${new Date(d.licence_expiry_date).toLocaleDateString()}`,
        `${days}d left`,
        urgencyColor(days), urgencyBg(days)
      );
    });
    body += sectionHtml("Driver Licences Expiring (30 days)", rows);
  }

  // Low stock parts
  if (sections.parts_low_stock && sections.parts_low_stock.length > 0) {
    const rows = sections.parts_low_stock.map((p) =>
      row(
        `${p.name}${p.partNumber ? ` (${p.partNumber})` : ""}`,
        `Category: ${p.category || "—"} · Stock: ${p.quantity} / Min: ${p.minimumQuantity}`,
        "Low Stock",
        "#f59e0b", "#fffbeb"
      )
    );
    body += sectionHtml("Parts Low on Stock", rows);
  }

  body += `
  <div style="margin-top:28px;text-align:center;">
    <a href="${process.env.CLIENT_URL || "https://fleetiqlogistics.com"}" style="display:inline-block;background:#4F46E5;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;">Log in to FleetIQ to take action →</a>
  </div>
  <p style="margin-top:20px;color:#6b7280;font-size:12px;">You are receiving this digest because you are the fleet administrator for <strong>${orgName}</strong>.</p>`;

  const html = emailShell(`FleetIQ Daily Digest — ${date}`, body);

  await resend.emails.send({
    from: FROM(),
    to: email,
    subject: `FleetIQ Daily Digest — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    html,
  });

  console.log(`✅ Daily digest sent to ${email}`);
};

module.exports = {
  sendDriverCredentialsEmail,
  sendDriverApplicationApprovedEmail,
  sendTimesheetApprovedEmail,
  sendInvoiceEmail,
  sendDailyDigestEmail,
};
