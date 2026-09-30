const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Tried in order. If one is busy, the next one is used.
const MODELS = [
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.8-flash",
  "gemini-3.7-flash",
];

function getStructureGuide(marks) {
  if (!marks) {
    return `No specific mark value was given. First judge the question yourself:
- If it is a simple or quick question (a calculation, a one-fact answer, a basic definition, or a casual message), answer briefly and directly. Return ONLY {"explanation": "..."} and put the working in that one string. No introduction, no conclusion.
- If it is a real concept question, answer like an experienced teacher would. Give a clear definition and a thorough explanation. In the explanation, if the topic has parts (conditions, steps, layers, components), cover each one separately with a short explanation of what it means. If the topic is a problem, also explain how it is prevented or solved. Add examples (prefer computing or engineering examples), types, or a diagram only where they genuinely help.
Never pad the answer, and never add sections just to fill space.`;
  } else if (marks <= 2) {
    return `For a ${marks}-mark question, keep it brief:
- "definition": the direct definition/answer (this should carry most of the marks)
- "explanation": 1-3 sentences of supporting detail
- "examples": an array of 1-3 short real-world examples or applications, ONLY if relevant — otherwise null
Do NOT include introduction, diagram, advantages, disadvantages, applications, types, or conclusion for this mark value.`;
  } else if (marks <= 5) {
    return `For a ${marks}-mark question, include:
- "definition": the core concept/definition
- "diagram": ONLY if this topic genuinely has a visual/process structure that benefits from a flowchart or block diagram, provide valid Mermaid.js syntax (e.g. "flowchart TD\\nA[Input] --> B[Process] --> C[Output]") as a plain string — otherwise use null. Do NOT include explanations, backticks, or the word "mermaid" — just the raw Mermaid syntax.
- "types": an array of types, ONLY if genuinely applicable - otherwise null
- "explanation": the key points or working pipeline, as a short paragraph
- "examples": an array of 1-3 short real-world examples or applications, ONLY if relevant — otherwise null
Do NOT include introduction, advantages, disadvantages, or conclusion for this mark value.`;
  } else {
    return `For a ${marks}-mark question, include a full structured answer:
  - "introduction": 1-3 sentences introducing the topic
  - "diagram": ONLY if the topic genuinely has a visual structure that benefits from a flowchart or block diagram, provide valid Mermaid.js syntax (e.g. "flowchart TD\\nA[Input] --> B[Process] --> C[Output]") as a plain string — otherwise use null. Do NOT include explanations, backticks, or the word "mermaid" — just the raw Mermaid syntax.
  - "explanation": the main working/explanation in detail (this should be the largest section)
  - "types": an array of types, ONLY if genuinely applicable - otherwise null
  - "advantages": an array of advantage strings, ONLY if genuinely applicable — otherwise null
  - "disadvantages": an array of disadvantage strings, ONLY if genuinely applicable — otherwise null
  - "applications": an array of real-world application strings, ONLY if genuinely applicable — otherwise null
  - "conclusion": 1-2 sentences wrapping up
  - "examples": an array of 1-3 short real-world examples or applications, ONLY if relevant — otherwise null
Skip advantages/disadvantages/applications individually if the topic doesn't naturally have them (e.g. a purely mathematical or definitional topic) — never invent filler content just to fill a section.`;
  }
}

async function askGemini(question, marks) {
  const marksLine = marks
    ? `Marks: ${marks}`
    : `Marks: not specified — decide the appropriate depth and length yourself`;

  const prompt = `You are an AI tutor helping an engineering student prepare for exams.

Question: ${question}
${marksLine}

${getStructureGuide(marks)}

PRIORITY RULE (overrides the structure above): If the student's question itself asks for a specific length or style (for example "in one line", "briefly", "in short", "in simple words", "explain like I'm 5"), obey that instruction exactly. In that case return ONLY {"explanation": "your answer here"} with no other keys.

FORMATTING RULE: Inside any text field (like "explanation"), whenever you list numbered points, conditions, or steps, put each one on its own line, separated by \\n, and start the line with its number (for example "1. Mutual Exclusion: ...\\n2. Hold and Wait: ..."). Do not run them together in one paragraph. Do not repeat the same information in "introduction" and "definition". Every item in "types" must be written as "Name: one-line explanation", never just the name. For diagrams, prefer a compact left-to-right layout (flowchart LR) unless a sequence diagram fits the topic better.
Respond with ONLY a valid JSON object (no markdown code fences, no extra text before or after) using exactly these possible keys: "introduction", "definition", "diagram", "explanation", "types", "advantages", "disadvantages", "applications", "examples", "conclusion". Only include the keys relevant to this mark value as described above; omit or set null any key that doesn't apply. "advantages", "disadvantages", "applications", "types", and "examples" should be arrays of short strings when included. The "diagram" field, when included, must be raw Mermaid.js syntax only (no backticks, no "mermaid" label, no explanation text). All other fields should be plain strings.`;

  let lastError;
  let rawText = null;

  for (let round = 1; round <= 2 && rawText === null; round++) {
    for (const name of MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: name }, { timeout: 15000 });
        const result = await model.generateContent(prompt);
        rawText = result.response.text();
        console.log("Answered by model:", name);
        break;
      } catch (err) {
        console.error(`Model ${name} failed:`, err.message);
        lastError = err;
      }
    }
    // wait 3 seconds before trying the whole list a second time
    if (rawText === null && round < 2) {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  if (rawText === null) {
    throw lastError || new Error("All AI models are busy");
  }

  // Gemini sometimes wraps JSON in ```json ... ``` fences even when told not to - strip those before parsing
  const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse Gemini JSON response:", err.message);
    // Fallback so a bad response never crashes the request - just show the raw text
    return { explanation: rawText };
  }
}

module.exports = { askGemini };