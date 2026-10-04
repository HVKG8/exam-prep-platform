import LegalLayout from '../components/LegalLayout'
import { APP_NAME, CONTACT_EMAIL, LAST_UPDATED } from '../legalInfo'

function Terms() {
  return (
    <LegalLayout title="Terms of Service" updated={LAST_UPDATED}>
      <p>
        By creating an account or using {APP_NAME}, you agree to these terms. If you
        do not agree, please do not use the service.
      </p>

      <h2>The service</h2>
      <p>
        {APP_NAME} gives students study materials, an AI Tutor and viva practice. It
        is a student-built project, provided "as is". Features may change, and the
        service may be unavailable at times or stopped.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Give accurate information and keep your password private.</li>
        <li>You are responsible for what happens under your account.</li>
        <li>Verify your email with the code we send you to activate your account.</li>
      </ul>

      <h2>Using the AI</h2>
      <ul>
        <li>
          AI answers can be wrong or incomplete. Always check important facts with
          your textbooks and teachers.
        </li>
        <li>
          Use the AI to learn and practise, and follow your college's rules about
          assignments and exams.
        </li>
        <li>
          To keep the service fair for everyone, each student has a daily and
          per-minute limit on AI requests.
        </li>
      </ul>

      <h2>What you must not do</h2>
      <ul>
        <li>Break the law or break other people's rights.</li>
        <li>Try to hack, overload or disrupt the service, or get around its limits.</li>
        <li>Use someone else's account or pretend to be someone else.</li>
        <li>Upload or share harmful, abusive or illegal content.</li>
        <li>Copy and redistribute the study materials outside the platform.</li>
      </ul>

      <h2>Study materials</h2>
      <p>
        Study materials are shared by administrators for learning. They may belong to
        their original authors, so use them for your own study only.
      </p>

      <h2>Suspending accounts</h2>
      <p>
        We may limit or close accounts that break these terms or harm the service. You
        can ask us to delete your account at any time.
      </p>

      <h2>Our responsibility</h2>
      <p>
        We try to keep {APP_NAME} useful and safe, but we cannot promise it will be
        error-free or always available. To the extent allowed by law, we are not
        responsible for losses that come from using the service or relying on AI
        answers.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. If we do, the date at the top changes. Using the
        service after that means you accept the new terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalLayout>
  )
}

export default Terms