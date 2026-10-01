require("dotenv").config();
const { evaluateVivaAnswer } = require("./services/aiService");

(async () => {
  try {
    const result = await evaluateVivaAnswer(
      "What is a deadlock in an operating system?",
      "deadlock is when a process is waiting for something and it does not get it",
      "Operating System",
      "Deadlock"
    );
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("TEST FAILED:", err.message);
  }
})();