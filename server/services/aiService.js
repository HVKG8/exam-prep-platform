const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function getStructureGuide(marks) {
  if (!marks) {
    return `No specific mark value was given for this question. Decide the most appropriate depth and structure yourself, as an experienced teacher would — this could range from a short, direct answer to a fuller structured one, depending on how much the topic naturally requires. Only use keys that are genuinely relevant to this topic; don't force in sections (like advantages/disadvantages/types) that don't naturally apply. Keep it well-organized, but only as long as the topic warrants — don't pad it out artificially.`;
  } else if (marks <= 2) {
    return `For a ${marks}-mark question, keep it brief:
- "definition": the direct definition/answer (this should carry most of the marks)
- "explanation": 1-2 sentences of supporting detail
- "examples": an array of 1-2 short real-world examples or applications, ONLY if relevant — otherwise null
Do NOT include introduction, diagram, advantages, disadvantages, applications, types, or conclusion for this mark value.`;
  } else if (marks <= 5) {
    return `For a ${marks}-mark question, include:
- "definition": the core concept/definition
- "diagram": ONLY if this topic genuinely has a visual/process structure that benefits from a flowchart or block diagram, provide valid Mermaid.js syntax (e.g. "flowchart TD\\nA[Input] --> B[Process] --> C[Output]") as a plain string — otherwise use null. Do NOT include explanations, backticks, or the word "mermaid" — just the raw Mermaid syntax.
- "types": an array of types, ONLY if genuinely applicable - otherwise null
- "explanation": the key points or working pipeline, as a short paragraph
- "examples": an array of 1-2 short real-world examples or applications, ONLY if relevant — otherwise null
Do NOT include introduction, advantages, disadvantages, or conclusion for this mark value.`;
} else {
  return `For a ${marks}-mark question, include a full structured answer:
  - "introduction": 1-2 sentences introducing the topic
  - "diagram": ONLY if the topic genuinely has a visual structure that benefits from a flowchart or block diagram, provide valid Mermaid.js syntax (e.g. "flowchart TD\\nA[Input] --> B[Process] --> C[Output]") as a plain string — otherwise use null. Do NOT include explanations, backticks, or the word "mermaid" — just the raw Mermaid syntax.
  - "explanation": the main working/explanation in detail (this should be the largest section)
  - "types": an array of types, ONLY if genuinely applicable - otherwise null
  - "advantages": an array of advantage strings, ONLY if genuinely applicable — otherwise null
  - "disadvantages": an array of disadvantage strings, ONLY if genuinely applicable — otherwise null
  - "applications": an array of real-world application strings, ONLY if genuinely applicable — otherwise null
  - "conclusion": 1-2 sentences wrapping up
  - "examples": an array of 1-2 short real-world examples or applications, ONLY if relevant — otherwise null
Skip advantages/disadvantages/applications individually if the topic doesn't naturally have them (e.g. a purely mathematical or definitional topic) — never invent filler content just to fill a section.`;
  }
}

async function askGemini(question, marks) {
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

  const marksLine = marks
    ? `Marks: ${marks}`
    : `Marks: not specified — decide the appropriate depth and length yourself`;

  const prompt = `You are an AI tutor helping an engineering student prepare for exams.

Question: ${question}
${marksLine}

${getStructureGuide(marks)}

Respond with ONLY a valid JSON object (no markdown code fences, no extra text before or after) using exactly these possible keys: "introduction", "definition", "diagram", "explanation", "types", "advantages", "disadvantages", "applications", "examples", "conclusion". Only include the keys relevant to this mark value as described above; omit or set null any key that doesn't apply. "advantages", "disadvantages", "applications", "types", and "examples" should be arrays of short strings when included. The "diagram" field, when included, must be raw Mermaid.js syntax only (no backticks, no "mermaid" label, no explanation text). All other fields should be plain strings.`;

  const result = await model.generateContent(prompt);
  const rawText = result.response.text();

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