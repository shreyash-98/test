const express = require("express");
const path = require("path");
const { Resend } = require("resend");

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY); // no username/password needed

app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

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

async function sendHeaderEmail(log) {
  try {
    await resend.emails.send({
      from: "AI Detector <ai-detector@yourdomain.com>",
      to: "shreyash.sarnaik@hotmail.com",
      subject: `🧠 New Request Logged: ${log.aiSource}`,
      text: `
New Request Detected
---------------------
Time: ${log.time}
Method: ${log.method}
URL: ${log.url}
AI Source: ${log.aiSource}

Headers:
${JSON.stringify(log.headers, null, 2)}
      `,
    });
    console.log("📨 Email sent via Resend!");
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
}

app.use(async (req, res, next) => {
  const aiSource = detectAI(req.headers);

  log = {
    method: req.method,
    url: req.url,
    aiSource,
    headers: req.headers,
    time: new Date().toLocaleString(),
  };

  sendHeaderEmail(log);
  next();
});

app.get("/", (req, res) => {
  res.render("index", { topic: "AI Request Detector", log });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
