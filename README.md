# 🎓 ExamPrep AI

**Learn smarter. Prepare better.** An AI-powered exam preparation platform for engineering students: marks-aware AI answers, organised study materials, and viva (oral exam) practice.

### 🌐 Live demo: https://examprep-ai-kappa.vercel.app

> ⏳ The server runs on a free plan and goes to sleep when nobody uses it, so the very first load can take up to a minute. After that it is fast.

<!--
Screenshots: put images in docs/screenshots/ and add lines like this:
![AI Tutor](docs/screenshots/ai-tutor.png)
-->

---

## ✨ Features

### 🤖 AI Tutor
- Answers scaled to the marks you pick (**2, 5 or 10**), or let the AI decide the depth
- Structured answers (definition, explanation, types, advantages, conclusion and more) with **Mermaid diagrams** where they help
- Saved chat history: rename, delete, copy an answer, or **regenerate** it (the new answer is saved)
- Daily and per-minute limits per student, so the free AI quota stays fair for everyone

### 📚 Study Materials
- Notes, books, assignments, question papers, diagrams, syllabus and quick revision, organised by **subject and unit**
- Search, type filters and quick-access shortcuts
- Admin-only upload and delete (PDF, Word, PowerPoint, PNG, JPG up to 10 MB)

### 🎤 Viva Prep
- An AI examiner asks 5 questions on your subject and topic
- Answer **out loud** (browser speech recognition) or type; get feedback and follow-up questions
- Readiness result for every session and a progress card on the dashboard

### 🔐 Accounts
- Sign up with email and password, verified with a **6-digit code** sent to your inbox
- **Sign in with Google**
- Forgot password with a 6-digit code
- Roles: **student**, **teacher**, **admin**
- Light and dark theme

### 📊 Dashboard
- Greeting, live stats (materials, subjects, AI conversations, vivas finished) and quick-access shortcuts

---

## 🧰 Tech stack

| Part | Technology |
|---|---|
| Frontend | React + Vite, React Router, Axios, plain CSS |
| Backend | Node.js, Express |
| Database | MongoDB Atlas (Mongoose) |
| AI | Google Gemini |
| Auth | JWT, bcrypt, Google Sign-In (`@react-oauth/google`) |
| Email | Brevo (transactional email API) |
| File storage | Cloudinary |
| Diagrams | Mermaid |
| Hosting | Vercel (frontend), Render (backend) |

---

## 🛡️ Security and reliability

- Passwords are stored hashed (bcrypt); email and reset codes are stored hashed too, expire in 10 minutes, and die after 5 wrong tries
- Rate limits on login, code checks and email sending; separate per-student limits on AI requests
- Server-side validation of all input, and ownership checks so students can only touch their own chats and sessions
- Admin-only uploads with file-type and size checks; safe file names
- CORS limited to the app's own websites
- Automatic sign-out when a login token is expired or rejected
- Privacy Policy and Terms of Service pages

---

## 📁 Project structure

```
exam-prep-platform/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── pages/           # Welcome, Login, Register, ForgotPassword, Dashboard,
│       │                    # AISolver, Materials, Viva, Privacy, Terms
│       ├── components/      # Sidebar, ProtectedRoute, CheckEmailNotice,
│       │                    # MermaidDiagram, ServerWakeNotice
│       ├── hooks/           # useLightTheme, useSpeech
│       └── utils/
└── server/                  # Express API
    ├── config/              # database and Cloudinary setup
    ├── middleware/          # auth, uploads, AI rate limits
    ├── models/              # Mongoose models
    ├── routes/              # API routes
    ├── services/            # Gemini AI service
    └── utils/               # email sending
```

---

## 🚀 Run it locally

**You need:** Node.js 18 or newer, Git, a MongoDB database (a free Atlas cluster works), and free accounts for Google AI Studio (Gemini), Cloudinary, Google Cloud (Sign-In) and Brevo.

```bash
git clone https://github.com/HVKG8/exam-prep-platform.git
cd exam-prep-platform
```

### 1. Server

```bash
cd server
npm install
```

Create `server/.env`:

| Variable | What it is |
|---|---|
| `MONGODB_URI` | Your MongoDB connection string |
| `JWT_SECRET` | A long random secret for login tokens |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary credentials |
| `GOOGLE_CLIENT_ID` | Google OAuth Web client ID |
| `BREVO_API_KEY` | Brevo API key (sends the verification codes) |
| `EMAIL_FROM` | A sender address verified in Brevo |
| `EXTRA_ORIGINS` | Optional. Extra website addresses allowed to call the API, comma separated |
| `PORT` | Optional. Defaults to 5000 |

```bash
npm run dev
```

### 2. Client

```bash
cd client
npm install
```

Create `client/.env`:

| Variable | What it is |
|---|---|
| `VITE_API_URL` | The server address, for example `http://localhost:5000` |
| `VITE_GOOGLE_CLIENT_ID` | The same Google OAuth Web client ID as the server |

In Google Cloud, add `http://localhost:5173` to the client's **Authorized JavaScript origins**.

```bash
npm run dev
```

Open http://localhost:5173.

### 3. Make an admin

New accounts are students. To upload materials, open your database (Atlas or MongoDB Compass), find your user, and change its `role` to `admin`.

---

## 🔌 API overview

| Area | Main endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `/verify-email`, `/resend-verification`, `/login`, `/google`, `/forgot-password`, `/reset-password`, `GET /me` |
| AI Tutor | `POST /api/ai/solve` |
| Chats | `/api/conversations` (create, list, read, rename, delete, add and regenerate messages) |
| Materials | `GET /api/materials`, `/search`, `/:id/download`; admin: `POST`, `DELETE` |
| Viva | `POST /api/viva/start`, `GET /api/viva`, `/stats`, `/:id`, `POST /:id/answer`, `/:id/finish` |
| Structure | `/api/subjects`, `/api/topics` |

All routes except sign-up and sign-in need a login token.

---

## 🗺️ Roadmap

- Smarter answers grounded in the uploaded study materials (RAG)
- Interview preparation
- Practice questions and analytics
- Admin panel
- Mobile app

---

## ⚠️ Good to know

- The platform currently covers **Computer Engineering, 7th and 8th semester**.
- AI answers can be wrong or incomplete. Always check important facts with your textbooks and teachers.
- Voice answers in Viva work best in Chrome; other browsers can use typing.
- This is a student project on free hosting plans, so it can be slow when it wakes up.

---

## 👤 Author

Built by [HVKG8](https://github.com/HVKG8).