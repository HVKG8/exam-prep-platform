# ExamPrep AI

An AI-powered exam preparation platform for students. Browse study material by subject, ask an AI tutor questions and get answers sized to the marks they are worth (2, 5 or 10 marks), and practise with a spoken mock viva.

**Live demo:** https://examprep-ai-kappa.vercel.app

> The backend runs on a free hosting plan and sleeps when idle, so the first request after a quiet period can take up to ~50 seconds. Please wait rather than refreshing.
>
> Email sign-up works for everyone. Google sign-in is currently limited to approved test accounts.

Project status: **actively in development**. More features are being added.

## Features

- Sign up and log in with email and password, or with Google
- Welcome page, plus a dashboard with study stats (materials, subjects, AI conversations, vivas finished)
- **AI Tutor** chat with a marks selector (2 / 5 / 10) that controls answer depth, or leave it unselected and the AI decides; answers can include diagrams
- Saved conversations that can be renamed and deleted
- **Viva Prep**: practise an oral viva by speaking your answers, get follow-up questions, and track your progress
- **Study material** organised by subject, with units/topics, type tabs (notes, question papers, syllabus and more) and search
- Role-based access: students browse, teachers and admins upload and manage material (files stored on Cloudinary)
- Light and dark theme, and a layout that works on phones

## Tech stack

| Area | Tools |
| --- | --- |
| Frontend | React, Vite, React Router, Axios, Mermaid.js |
| Backend | Node.js, Express |
| Database | MongoDB (Atlas), Mongoose |
| Auth | JWT, bcrypt, Google Sign-In (OAuth) |
| AI | Google Gemini API |
| Voice | Browser speech recognition (works best in Chrome) |
| Storage | Cloudinary |
| Hosting | Vercel (frontend), Render (backend) |

## Run it locally

Requires Node.js and a MongoDB database (a free MongoDB Atlas cluster works).

```bash
git clone https://github.com/HVKG8/exam-prep-platform.git
cd exam-prep-platform
```

**Backend**

```bash
cd server
npm install
```

Create `server/.env` with:

```
MONGODB_URI=
JWT_SECRET=
GEMINI_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GOOGLE_CLIENT_ID=
```

Then run `npm run dev` (starts on port 5000). Optionally run `node seed.js` once to add the starting branch and subjects.

**Frontend**

```bash
cd client
npm install
```

Create `client/.env` with:

```
VITE_GOOGLE_CLIENT_ID=
```

Then run `npm run dev` (starts on port 5173). To point the frontend at a deployed backend instead of `localhost:5000`, also set `VITE_API_URL`.

**Roles:** new accounts are students. To upload material locally, change your user's `role` to `teacher` or `admin` in the database.

## Author

Built by Harsh Vijay Gupta.