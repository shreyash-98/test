const express = require("express");
const path = require("path");

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// AI detection logic
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

// 🟢 Store only the latest request
let log = null;

app.use((req, res, next) => {
  const aiSource = detectAI(req.headers);

  log = {
    method: req.method,
    url: req.url,
    aiSource,
    headers: req.headers,
    time: new Date().toLocaleString(),
  };

  next();
});

app.get("/", (req, res) => {
  res.render("index", { topic: "AI Request Detector", log });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

