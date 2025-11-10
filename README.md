# Sankat Sanket  

[![CI](https://github.com/cfsage/sanket/actions/workflows/ci.yml/badge.svg)](https://github.com/cfsage/sanket/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Stars](https://img.shields.io/github/stars/cfsage/sanket?style=social)](https://github.com/cfsage/sanket/stargazers)
[![Issues](https://img.shields.io/github/issues/cfsage/sanket)](https://github.com/cfsage/sanket/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Fully Open-Source | Zero-Cost | Community-Powered Climate Resilience Network**

> _From a voice in the dark — to a task in a hand._

---

## 📖 About the Project
**Sankat Sanket** is a global, open-source initiative to build a **community-driven climate resilience network** — with **no paid APIs**, **no cloud bills**, and **no barriers to access**.

Anyone can report a disaster by capturing a short **photo** or **audio clip**, even without internet. 

On-device AI detects threats like **floods, storms, or fires** and sends **real-time alerts** to nearby users via **voice, text, or emoji notifications**.

Local **volunteers and businesses** can pledge rooms, meals, or supplies.  
AI then matches every reported need with nearby help, and each act of aid is tracked and rewarded with **Resilience Badges**, promoting trust, transparency, and collaboration.

---

## 💡 Mission
To build a **free, open, and decentralized disaster response network** — powered entirely by **people, phones, and open technology**.

---

## 🚀 Key Features
- 📸 **Smart Crisis Reporting:** Photo or audio-based disaster detection (on-device AI)  
- 🔔 **Instant Local Alerts:** Voice, text, and emoji notifications in multiple languages  
- 🏅 **Resilience Badges:** Recognition system for verified contributions  
- 🌐 **Offline First:** Works in low-connectivity disaster zones  
- 💬 **Open Collaboration:** 100% open-source and community-driven  

---

## 🧩 How It Works
1. **Report:** Capture photo/audio + location  
2. **Detect:** On-device AI identifies disaster type & urgency  
3. **Alert:** Real-time localized notifications  
4. **Respond:** Volunteers & businesses pledge aid  
5. **Match:** AI connects needs with resources  
6. **Reward:** Earn Resilience Badges for verified help  

---

## ⚙️ Installation

- Prerequisites: Node.js 18+ and npm
- Clone the repo and install dependencies:

```
npm install
```

- Configure environment variables:
  - Copy `.env.example` to `.env.local`
  - Adjust values for your setup (MongoDB, admin emails, etc.)

```
cp .env.example .env.local
```

- Start the web app:

```
npm run dev
```

- Open `http://localhost:9002`.

## 🔧 Configuration
- `MONGODB_URI`, `MONGODB_DB_NAME`: database connection (defaults to local)
- `NEXT_PUBLIC_ADMIN_EMAILS`: comma-separated emails allowed as admins
- `INTERNAL_API_KEYS`, `ACTIVE_INTERNAL_API_KEY`: server route protection for internal APIs
- `NEXT_PUBLIC_MAP_TILES_URL`: tile provider for Leaflet (defaults to OSM)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: optional; enables web push subscription
- `NEXT_PUBLIC_TAILWIND_THEME`: optional; Tailwind theme class appended to `<body>`
- External SMS integration has been removed for the public baseline. You may add your own integration separately if needed.

## 🧪 Development
- Typecheck: `npm run typecheck`
- Tests: `npm run test` (Vitest)
- Build: `npm run build`

## 🤝 Contribute
- GitHub Repo: https://github.com/cfsage/sanket
- Issues: https://github.com/cfsage/sanket/issues
- Pull Requests: https://github.com/cfsage/sanket/pulls
- See `CONTRIBUTING.md` for setup and guidelines

## 🗂️ Project Structure (Highlights)
- `src/app`: Next.js routes and pages
- `src/components`: UI components, dashboard, report flows
- `src/lib`: data, auth, config, offline queue, push, Mongo helpers
- `src/hooks`: reusable hooks for realtime, geolocation, tasks
- `docs`: product and architecture documentation


---

## 🛡️ Data & Privacy
- This public repository contains only anonymized and dummy data.
- No personal identifiers, secrets, or private endpoints are included.
- Admin whitelists must be configured via `NEXT_PUBLIC_ADMIN_EMAILS` in your environment.

## 🔧 Integrations
- The experimental `n8n` chat integration has been removed for public release.
- Optional third‑party services (e.g., SMS) are disabled unless you configure environment variables.

## 📄 License
This project is licensed under the MIT License. By using this software, you agree to retain the copyright notice and permission notice in any copies or substantial portions of the Software.

See `LICENSE` for full terms.

## 🙌 Credits
- Built with ❤️ by cfsage • Open‑Source • #संकटसंकेत
- Contributions welcome — see `CONTRIBUTING.md` for guidelines.
