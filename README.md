SpeechEasy 🎤

An AI-powered speech coaching platform that helps you practice public speaking, track your progress over time, and prepare for real interviews — with live speech recognition, real-time filler-word and pace tracking, and Gemini-powered AI coaching feedback.

Built as a full-stack MERN application with a custom design system supporting light and dark mode.


✨ Features

🔐 Authentication


Secure register/login with JWT-based sessions
Passwords hashed with bcrypt — never stored or transmitted in plain text
Protected routes on both the frontend (redirect if not logged in) and backend (every session/interview endpoint verifies a valid token)


📊 Dashboard


Real-time stats: total sessions, average WPM, average filler count, sessions this week
Practice activity calendar — a GitHub-style contribution heatmap showing exactly which days you practiced, built from real session timestamps
Weekly performance line chart (WPM vs. filler word trend across your last 10 sessions)
Skill breakdown — six scores (Clarity, Pace, Filler, Structure, Confidence, Vocabulary), averaged across the current week, combining deterministic math (Pace, Filler) with AI judgment (the rest)
Weekly AI check-in — an on-demand, user-triggered Gemini analysis of your week's sessions, identifying your single weakest skill and giving one concrete, specific drill to improve it


🎙️ Practice Session


Live microphone recording via the browser's Web Speech API — no external service, completely free
Real-time transcript, live WPM calculation, and live filler-word counting as you speak
Three modes: Free Practice, Timed Pitch, Q&A
Save, discard, or generate AI coaching feedback on any completed session


📁 Session Archive


Full history of past sessions with mode, date, duration, WPM, and filler count at a glance
Click into any session for the full transcript (filler words highlighted inline), stats, and AI feedback
Delete sessions you don't need


🤖 AI Interview Mode


Choose a domain (Technical concepts, HR/Behavioral, General aptitude, Case study), an optional specific topic, an optional resume/job description for personalized questions, and how many questions you want (1–15)
The AI speaks each question aloud via text-to-speech and listens to your spoken answer
One combined grading pass at the end scores both content correctness (factual questions are graded right/wrong against a reference answer; behavioral questions are graded on quality) and delivery (WPM, filler words) together into a single Interview Readiness Score
Full results breakdown per question, with correct answers shown for anything missed


🎨 Design


Custom light/dark theme system built on CSS custom properties, toggleable anywhere, persisted across sessions
Fully responsive, rounded, warm color palette (amber primary, teal secondary) designed from scratch rather than using a default UI kit



🛠️ Tech Stack

Frontend: React (Vite), React Router, Tailwind CSS v4, Chart.js / react-chartjs-2, Axios
Backend: Node.js, Express
Database: MongoDB Atlas with Mongoose
AI: Google Gemini API (@google/genai)
Speech: Browser Web Speech API (SpeechRecognition + SpeechSynthesis)
Auth: JSON Web Tokens (JWT) + bcrypt


📂 Project Structure

SpeechEasy/
├── backend/
│   ├── config/           # MongoDB connection
│   ├── controllers/      # Route logic (auth, sessions, interviews)
│   ├── middleware/        # JWT auth middleware
│   ├── models/            # Mongoose schemas (User, Session, Interview)
│   ├── routes/            # Express route definitions
│   ├── services/          # Gemini API integration (isolated from controllers)
│   └── server.js
├── frontend/
│   └── src/
│       ├── api/            # Shared axios instance with auth interceptor
│       ├── components/     # Reusable pieces (Layout, ActivityHeatmap, InterviewSession, etc.)
│       ├── context/        # AuthContext, ThemeContext
│       ├── pages/          # Login, Dashboard, PracticeSession, SessionArchive, SessionDetail, AIInterview
│       └── App.jsx
└── ai_prompt.txt          # Documented prompt design for the AI coaching feature


🚀 Getting Started

Prerequisites


Node.js (v18+)
A free MongoDB Atlas cluster
A free Google Gemini API key
Google Chrome or Microsoft Edge (required for speech recognition — see Known Limitations)


Backend Setup

bashcd backend
npm install

Create a .env file in backend/ (see .env.example):

MONGO_URI=your_mongodb_connection_string_here
PORT=5000
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here

bashnpm run dev

Frontend Setup

bashcd frontend
npm install
npm run dev

Visit http://localhost:5173.


🔌 API Overview

MethodEndpointDescriptionPOST/api/auth/registerCreate a new accountPOST/api/auth/loginLog in, returns a JWTPOST/api/sessionsSave a completed practice sessionGET/api/sessionsList sessions (supports ?mode= and date filters)GET/api/sessions/summaryDashboard stats, activity calendar, skill breakdownPOST/api/sessions/weekly-insightOn-demand AI analysis of the current weekGET/api/sessions/:idGet one session's full detailDELETE/api/sessions/:idDelete a sessionPOST/api/sessions/:id/ai-feedbackGenerate Gemini coaching feedback + skill scoresPOST/api/interviews/generate-questionsGenerate mock interview questionsPOST/api/interviewsSubmit answers, get graded resultsGET/api/interviews/:idGet one past interview's full results

All routes except register/login require a Authorization: Bearer <token> header.


🧠 AI Design Philosophy

Rather than routing everything through the AI, SpeechEasy splits scoring into two categories:


Deterministic (plain math): Pace score (distance from the 130–160 WPM ideal range) and Filler score (fillers per minute) — objectively measurable, instant, free, and fully explainable.
AI-judged (Gemini): Clarity, Structure, Confidence, and Vocabulary — qualities that require actual semantic understanding of what was said, which a formula can't capture.


This hybrid approach keeps the system fast, cheap, and transparent, while still using AI exactly where it adds real value. See ai_prompt.txt for the full documented prompt design.


⚠️ Known Limitations


Browser support: The Web Speech API is only reliably supported in Chrome and Edge. Firefox and Safari have inconsistent or no support.
"Um"/"uh" detection: Chrome's built-in speech recognition engine silently filters disfluencies like "um" and "uh" before returning transcribed text, with no setting to disable this (confirmed via Chromium's own developer forums). All other tracked filler words (like, so, basically, actually, literally, you know) are captured reliably. A future version could integrate a dedicated speech API (e.g. AssemblyAI, Rev AI) that preserves disfluencies, at the cost of a more complex audio-upload pipeline in place of the current free, instant, client-side recognition.
No live adaptive interview follow-ups: AI Interview questions are generated upfront as a fixed set rather than dynamically branching based on each answer in real time — a deliberate scope decision to keep the feature simple, fast, and cheap to run.



🔮 Possible Future Improvements


Live adaptive follow-up questions in AI Interview mode
Integration with a dedicated speech-to-text API for full disfluency capture
Pagination for users with very large session histories
Retry/redo flow for weak AI Interview questions
Previous-year view for the practice activity calendar



📄 License

Personal portfolio project. Not licensed for commercial use.