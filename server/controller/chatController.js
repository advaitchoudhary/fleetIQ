const OpenAI = require("openai");
const Driver = require("../model/driverModel.js");
const Timesheet = require("../model/timesheetModel.js");
const Vehicle = require("../model/vehicleModel.js");

const PLATFORM_FEATURES = `
**Vehicles & Tracking**
- Vehicle registry (VIN, plates, insurance, registration, odometer, status)
- Live GPS tracking via browser-based polling (30s interval)
- Trip history with distance calculation

**Maintenance**
- Work orders (scheduled, in-progress, completed, cancelled)
- Preventive maintenance templates and schedules with auto work order generation
- Due/overdue alerts based on date and odometer intervals
- Next inspection date tracking

**Fleet Operations**
- Parts inventory with low-stock alerts and usage history
- Warranties with claim management (submitted, approved, denied, pending)
- Service history timeline per vehicle
- Cost tracking dashboard (maintenance + fuel costs, 6-month trends)
- Fuel logs with L/100km efficiency
- Inspections (DVIR pre/post-trip)

**Driver Management**
- Driver profiles with compliance documents and training records
- Driver applications and onboarding
- Timesheets with approval workflow
- Driver payments via Stripe Connect
- Driver portal with personal dashboard

**Scheduling & Billing**
- Job scheduling and dispatch
- Invoice generation
- Subscription plans: Driver plan, Vehicle plan, Bundle plan (monthly/annual)
- 14-day free trial on signup`;

// Super admin — sees everything across all orgs
const SUPER_ADMIN_SYSTEM_PROMPT = `You are FleetIQ Assistant, a helpful AI built into the FleetIQ fleet management platform. You only answer questions related to FleetIQ and fleet management topics.

FleetIQ is a SaaS platform for trucking and logistics companies. Here is what the platform includes:
${PLATFORM_FEATURES}

You are speaking with a platform administrator who has full access to all organizations and platform-level configuration.

When answering:
- Be concise and specific to FleetIQ features
- If a user asks how to do something, give step-by-step instructions based on the UI
- If a question is not related to FleetIQ or fleet management, politely say you can only help with FleetIQ-related questions
- Never make up features that don't exist in FleetIQ`;

// Company admin / dispatcher — scoped to their own org only
const COMPANY_ADMIN_SYSTEM_PROMPT = `You are FleetIQ Assistant, a helpful AI built into the FleetIQ fleet management platform. You only answer questions related to FleetIQ and fleet management topics.

FleetIQ is a SaaS platform for trucking and logistics companies. Here is what the platform includes:
${PLATFORM_FEATURES}

You are speaking with a company administrator. You must only discuss information relevant to their own organization. Do NOT discuss:
- Other organizations or their data
- Platform-level configuration or super admin settings
- Other companies' drivers, vehicles, subscriptions, or billing details
- Any cross-organization analytics or comparisons

If asked about other organizations or platform-wide data, respond: "I can only provide information related to your own organization."

When answering:
- Be concise and specific to FleetIQ features
- If a user asks how to do something, give step-by-step instructions based on the UI
- If a question is not related to FleetIQ or fleet management, politely say you can only help with FleetIQ-related questions
- Never make up features that don't exist in FleetIQ`;

const buildDriverSystemPrompt = (driver, timesheets, assignedVehicle) => {
  const recentTimesheets = timesheets.slice(0, 10).map((ts) => ({
    date: ts.date ? new Date(ts.date).toDateString() : "N/A",
    status: ts.status,
    totalHours: ts.totalHours || ts.hoursWorked || 0,
    totalAmount: ts.totalAmount || ts.totalPay || 0,
    weekEnding: ts.weekEnding ? new Date(ts.weekEnding).toDateString() : "N/A",
  }));

  return `You are FleetIQ Assistant, a helpful AI built into the FleetIQ fleet management platform for drivers.

You are speaking with a driver. You must ONLY discuss information that belongs to this specific driver. Never reveal, reference, or discuss any other driver's data, timesheets, payments, or personal information — even if asked.

If asked about other drivers, other people's pay, or any information outside this driver's own profile, respond: "I can only provide information about your own account."

**Driver's Profile:**
- Name: ${driver.name}
- Email: ${driver.email}
- Driver ID: ${driver.driverId || "N/A"}
- Status: ${driver.status}
- Work Status: ${driver.workStatus}
- Licence: ${driver.licence}
- Licence Expiry: ${driver.licence_expiry_date ? new Date(driver.licence_expiry_date).toDateString() : "N/A"}
- Hours This Week: ${driver.hoursThisWeek || 0}

**Assigned Vehicle:**
${assignedVehicle ? `- Unit: ${assignedVehicle.unitNumber}, Make: ${assignedVehicle.make}, Model: ${assignedVehicle.model}, Status: ${assignedVehicle.status}` : "- No vehicle currently assigned"}

**Recent Timesheets (last 10):**
${recentTimesheets.length > 0
  ? recentTimesheets.map((ts) => `- ${ts.date} | Status: ${ts.status} | Hours: ${ts.totalHours} | Pay: $${ts.totalAmount} | Week Ending: ${ts.weekEnding}`).join("\n")
  : "- No timesheets found"}

**What you can help this driver with:**
- Their own timesheet history and status
- Their assigned vehicle details
- How to use the driver portal (submit timesheets, view info, contact admin)
- Their licence expiry reminders
- General FleetIQ platform questions

When answering:
- Be concise and helpful
- Only reference this driver's own data shown above
- If a question is not related to FleetIQ or this driver's own information, politely decline`;
};

const chat = async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "AI assistant is not configured. Set OPENAI_API_KEY in server .env." });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Build role-specific system prompt
  let systemPrompt;
  if (req.user.role === "admin") {
    systemPrompt = SUPER_ADMIN_SYSTEM_PROMPT;
  } else if (req.user.role === "company_admin" || req.user.role === "dispatcher") {
    systemPrompt = COMPANY_ADMIN_SYSTEM_PROMPT;
  } else {
    systemPrompt = COMPANY_ADMIN_SYSTEM_PROMPT; // safe default
  }

  if (req.user.role === "driver") {
    try {
      const driver = await Driver.findOne({ email: req.user.email }).lean();
      if (!driver) {
        return res.status(403).json({ error: "Driver profile not found." });
      }

      const timesheets = await Timesheet.find({ driverEmail: driver.email })
        .sort({ date: -1 })
        .limit(10)
        .lean();

      const allVehicles = await Vehicle.find({ organizationId: driver.organizationId }).lean();
      const assignedVehicle = allVehicles.find(
        (v) => v.assignedDriverId && v.assignedDriverId.toString() === driver._id.toString()
      ) || null;

      systemPrompt = buildDriverSystemPrompt(driver, timesheets, assignedVehicle);
    } catch (err) {
      console.error("Failed to build driver context:", err.message);
      // Fall back to a safe restricted prompt if DB fetch fails
      systemPrompt = `You are FleetIQ Assistant. You are speaking with a driver. Only answer general questions about how to use the FleetIQ driver portal. Do not discuss any specific driver data, other drivers, or admin-level information.`;
    }
  }

  try {
    const filtered = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }));

    while (filtered.length > 0 && filtered[0].role === "assistant") {
      filtered.shift();
    }

    if (filtered.length === 0) {
      return res.status(400).json({ error: "No user message found." });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: [{ role: "system", content: systemPrompt }, ...filtered],
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ error: "Failed to get response from AI assistant." });
  }
};

module.exports = { chat };
