const express = require("express");
const path = require("path");
const { Resend } = require("resend");
require("dotenv").config();

console.log("🔹 Starting AI Request Logger...");

// ✅ Verify .env key
if (!process.env.RESEND_API_KEY) {
  console.error("❌ Missing RESEND_API_KEY in .env file");
  process.exit(1);
} else {
  console.log("✅ RESEND_API_KEY loaded successfully");
}

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

console.log("✅ Resend client initialized");

app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// 🔍 AI Detector (for info only, doesn’t control sending)
function detectAI(headers) {
  const userAgent = headers["user-agent"]?.toLowerCase() || "";
  if (userAgent.includes("chatgpt")) return "ChatGPT";
  if (userAgent.includes("openai")) return "OpenAI";
  if (userAgent.includes("bard")) return "Google Bard";
  if (userAgent.includes("claude")) return "Anthropic Claude";
  if (userAgent.includes("gemini")) return "Google Gemini";
  if (userAgent.includes("copilot")) return "GitHub Copilot";
  if (userAgent.includes("perplexity")) return "Perplexity AI";
  return "Human / Unknown";
}

let log = null;

// 📧 Email sending function with detailed logs
async function sendHeaderEmail(log) {
  console.log("📩 Preparing to send email...");
  console.log("📤 Email metadata:", {
    from: "AI Detector <onboarding@resend.dev>",
    to: "shreyashsarnaik.ai@gmail.com",
    subject: `New Request: ${log.method} ${log.url}`,
  });

  try {
    const result = await resend.emails.send({
      from: "AI Detector <onboarding@resend.dev>", // verified sender
      to: "shreyashsarnaik.ai@gmail.com",
      subject: `📨 New Request: ${log.method} ${log.url}`,
      text: `
New Request Logged
-------------------
Time: ${log.time}
Method: ${log.method}
URL: ${log.url}
Source: ${log.aiSource}

Headers:
${JSON.stringify(log.headers, null, 2)}
      `,
    });

    console.log("✅ Email sent successfully!");
    console.log("🧾 Resend API Response:", result);
  } catch (error) {
    console.error("❌ Failed to send email:");
    console.error(error);
  }
}

// 🧠 Request Middleware (send on every hit)
app.use(async (req, res, next) => {
  console.log("\n==================== NEW REQUEST ====================");
  console.log(`➡️  ${req.method} ${req.url}`);
  console.log("📅 Time:", new Date().toLocaleString());
  console.log("📥 Headers:", req.headers);

  const aiSource = detectAI(req.headers);

  log = {
    method: req.method,
    url: req.url,
    aiSource,
    headers: req.headers,
    time: new Date().toLocaleString(),
  };

  console.log("🔎 Source Detected:", aiSource);
  await sendHeaderEmail(log);

  next();
});

// 🏠 Default route
app.get("/", (req, res) => {
  res.render("index", { topic: "AI Request Logger", log });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
