import LegalLayout from '../components/LegalLayout'
import { APP_NAME, CONTACT_EMAIL, LAST_UPDATED } from '../legalInfo'

function Privacy() {
  return (
    <LegalLayout title="Privacy Policy" updated={LAST_UPDATED}>
      <p>
        {APP_NAME} is a study platform for college students. It offers study
        materials, an AI Tutor and viva (oral exam) practice. This page explains
        what information we collect, why we collect it, and what choices you have.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account details:</strong> your name and email address. If you sign
          up with a password, we store only a scrambled (hashed) version of it, never
          the password itself. If you use Google sign-in, we receive your name, email
          address and Google account ID from Google.
        </li>
        <li>
          <strong>Your study activity:</strong> the questions you ask the AI Tutor and
          the answers you receive, and your viva practice sessions (the questions, the
          text of your answers, feedback and readiness results).
        </li>
        <li>
          <strong>Temporary codes:</strong> the 6-digit codes we email you to verify
          your email or reset your password. They expire after 10 minutes.
        </li>
        <li>
          <strong>Technical data:</strong> basic request information, such as your IP
          address, used to keep the service secure and to limit abuse. Your browser
          also keeps a sign-in token so you stay logged in.
        </li>
      </ul>

      <h2>Voice answers in viva practice</h2>
      <p>
        The viva feature can use your browser's speech recognition so you can answer
        out loud. We do not record or store audio. Only the text of your answer is
        saved. Depending on your browser, your speech may be processed by the
        browser's provider (for example, Google in Chrome).
      </p>

      <h2>How we use your information</h2>
      <ul>
        <li>To create your account and keep you signed in.</li>
        <li>To send verification and password reset codes.</li>
        <li>To give you AI answers and viva feedback, and show your progress.</li>
        <li>To protect the service from abuse, for example with request limits.</li>
      </ul>
      <p>We do not sell your information and we do not show ads.</p>

      <h2>Services that help us run {APP_NAME}</h2>
      <p>We share information with these providers only so the service can work:</p>
      <ul>
        <li>
          <strong>Google:</strong> sign-in, and the Gemini AI service. The questions
          and answers you write are sent to Gemini to produce AI responses.
        </li>
        <li><strong>Brevo:</strong> sends our emails (codes), so it receives your email address.</li>
        <li><strong>MongoDB Atlas:</strong> stores our database.</li>
        <li><strong>Render and Vercel:</strong> host the website and server.</li>
        <li><strong>Cloudinary:</strong> stores the study material files that administrators upload.</li>
      </ul>

      <h2>How long we keep it</h2>
      <p>
        We keep your account and activity while your account exists. You can ask us to
        delete your account and its data at any time (see below).
      </p>

      <h2>Your choices</h2>
      <p>
        You can ask to see, correct or delete your information by emailing{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We will respond as
        soon as we can.
      </p>

      <h2>Security</h2>
      <p>
        Connections use HTTPS, passwords are stored hashed, and codes expire quickly.
        No online service is perfectly secure, so please choose a strong password and
        keep it private.
      </p>

      <h2>Children</h2>
      <p>{APP_NAME} is meant for college students and is not for children under 13.</p>

      <h2>Changes</h2>
      <p>
        If we change this policy, we will update the date at the top of this page.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalLayout>
  )
}

export default Privacy