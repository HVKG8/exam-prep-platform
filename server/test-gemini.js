require("dotenv").config();

async function tryModel(name) {
  const key = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${name}:generateContent?key=${key}`;
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Say hello in one word." }] }],
      }),
      signal: AbortSignal.timeout(30000),
    });
    const data = await res.json();
    const secs = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`\n${name} -> Status ${res.status} (${secs}s)`);
    if (res.ok) {
      console.log("Reply:", data.candidates?.[0]?.content?.parts?.[0]?.text);
    } else {
      console.log("Google says:", data.error?.message);
    }
  } catch (e) {
    console.log(`\n${name} -> FAILED:`, e.message, "| cause:", e.cause?.code || e.cause);
  }
}

async function main() {
  await tryModel("gemini-3.8-flash");
  await tryModel("gemini-3.7-flash");
  await tryModel("gemini-3.1-flash-lite");
  await tryModel("gemini-3.5-flash");
}
main();