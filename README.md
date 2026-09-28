# ExamPrep AI

An AI-powered exam preparation platform for students. Students can browse study material by subject, ask an AI tutor questions, and get answers sized to the marks they are worth (2, 5 or 10 marks).

**Live demo:** https://examprep-ai-kappa.vercel.app

> The backend runs on a free hosting plan and sleeps when idle, so the first request after a quiet period can take up to ~50 seconds. Please wait rather than refreshing.

Project status: **actively in development**. More features are being added.

## Features

- Sign up and log in with email and password, or with Google
- Dashboard with study stats
- Study material organised by subject
- AI Tutor chat with a marks selector (2 / 5 / 10) that controls answer depth
- Saved conversations that can be renamed and deleted
- File uploads stored on Cloudinary

## Tech stack

| Area | Tools |
| --- | --- |
| Frontend | React, Vite, React Router, Axios |
| Backend | Node.js, Express |
| Database | MongoDB (Atlas), Mongoose |
| Auth | JWT, bcrypt, Google Sign-In (OAuth) |
| AI | Google Gemini API |
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

Then run `npm run dev` (starts on port 5000).

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

## Author

Built by Harsh Vijay Gupta.