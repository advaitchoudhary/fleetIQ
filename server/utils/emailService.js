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
    emailPayload.attachments = [{ filename: "invoice.pdf", content: pdfBase64 }];
  }

  await resend.emails.send(emailPayload);
  console.log(`✅ Invoice email sent to ${driverEmail}`);
};

module.exports = {
  sendDriverCredentialsEmail,
  sendDriverApplicationApprovedEmail,
  sendTimesheetApprovedEmail,
  sendInvoiceEmail,
};
