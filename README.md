# 🎬 Vamoos Clips

**Vamoos Clips** is a web platform for collecting, browsing, and sharing Twitch clips.  
It is built with **React + Vite (frontend)** and **Express.js (backend)**.

---

## 🚀 Features

- 📥 Add clips via Google Forms integration
- 🖼️ Automatic fetching of Twitch clip previews
- 👥 "About Us" page with team members info
- 📢 Contact section with Telegram & Email links
- 🛡️ Basic anti-spam protection (rate limiting)
- 🎨 Modern dark UI with Tailwind CSS

---

## 🛠️ Tech Stack

### Frontend

- ⚡ [React](https://react.dev/) (with Vite)
- 🎨 [Tailwind CSS](https://tailwindcss.com/)

### Backend

- 🟢 [Node.js](https://nodejs.org/)
- 🚂 [Express.js](https://expressjs.com/)
- 🔄 [node-fetch](https://www.npmjs.com/package/node-fetch) for API calls
- 📊 Google Sheets + Forms integration

## 📂 Project Structure

my-clips-site/
├── public/ # favicon, fonts, static files
├── server/ # Express.js backend
│ └── server.js
├── src/ # React frontend
│ ├── assets/img/ # images
│ ├── components/ # reusable UI components
│ └── pages/ # pages (Home, About, SubmitClip, ...)
├── dist/ # production build (ignored by Git)
├── package.json
├── vite.config.js
└── tailwind.config.js

---

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Maxsvit/vamoos-clips.git
cd my-clips-site
npm install
cd server
node server.js


---
📝 License

This project is created for educational and personal use.

---

Do you want me to also prepare a **`.gitignore` file** in English (tailored for React + Vite + Node/Express) so your GitHub repo is clean from `node_modules` and `dist`?

```
