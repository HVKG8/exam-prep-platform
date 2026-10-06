require("dotenv").config();
const { askGeminiMarkdown } = require("./services/aiService");

(async () => {
  const r = await askGeminiMarkdown("Explain TCP three-way handshake", 5);
  console.log(r.markdown);
})();