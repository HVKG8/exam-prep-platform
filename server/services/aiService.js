const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function askGemini(question, marks) {
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

  const prompt = `You are helping an engineering student prepare for exams.
Answer the following question as it should be answered for ${marks} marks in an exam.
Question: ${question}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

module.exports = { askGemini };