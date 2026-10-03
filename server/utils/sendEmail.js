// Sends an email through Brevo's HTTP API (works on Render's free plan)
const sendEmail = async ({ to, subject, html }) => {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: "ExamPrep AI", email: process.env.EMAIL_FROM },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Email failed (${response.status}): ${details}`);
  }
};

module.exports = sendEmail;