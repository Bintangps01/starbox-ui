# ✨ Starbox UI

**A sleek, local AI chat interface built for [Ollama](https://ollama.com/)**

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-≥18.0.0-green.svg)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)

*Chat with your local AI models — fast, private, and totally offline.*

---

## 🖼️ Overview

Currently in alpha state, **Starbox UI** is a premium-designed web interface that lets you chat with any model installed through **Ollama** directly on your machine, with zero data sent to the cloud. It features real-time response streaming, and a fully-featured conversation manager. (NOTE: Performance depends on the model and your device.)

---

## 🎨 Features

- **Thinking Mode** — Real-time visualization of the model's thought process, with collapsible thinking blocks and infinite-loop protection (60s wall-clock cap + 45s inactivity watchdog).
- **Real-time Streaming** — Responses appear token-by-token using WebSockets for a fluid, ChatGPT-like experience.
- **Instant Chat Search** — Filter your entire conversation history in real time from the sidebar.
- **Drag-and-Drop Reordering** — Reorganize your chat list with native HTML5 drag-and-drop.
- **File Upload** — Attach images and text documents to conversations. (Currently doesn't work, will be fixed in the future)
- **Persistent History** — All conversations are saved locally to a `data/state.json` file on the server.
- **Settings Panel** — Centralized settings menu with a safe "Clear All History" feature (includes a confirmation prompt).
- **Auto Model Detection** — Automatically fetches all locally available Ollama models on startup via the Ollama REST API, no manual configuration needed.
- **Stop Session** — Safely unload the current model from memory and return to the setup screen at any time. ***(Make sure you do this before closing the server, or the model will remain in memory.)***

---

## 🚀 Getting Started

### Prerequisites

Before you start, make sure you have the following installed:

- **[Ollama](https://ollama.com/)** — Running locally with at least one model pulled (e.g., `ollama pull qwen3:2b`).
- **[Node.js](https://nodejs.org/)** — Version 18 or higher.

### Installation

**1. Clone the repository:**
```bash
git clone https://github.com/bintangps01/starbox-ui.git
cd starbox-ui
```

**2. Install dependencies:**
```bash
npm install
```

**3. Install Ollama Models:**
```bash
ollama pull <model_name>
```

**4. Start Ollama** (if it is not already running on startup):
```bash
ollama serve
```

**5. Launch Starbox UI:**
```bash
npm start
```

**6. Open your browser** and navigate to:
```
http://localhost:4000
```

> **Port behavior:**
> - The server defaults to port **4000**.
> - If port 4000 is taken by another application, it automatically tries the next port up to **5000**.

**7. Accessing from other devices**:
> You can access the same interface on your other devices if its connected to the same network by replacing `localhost` with your main computer's IP address. 
```
(e.g. `http://IP_ADDRESS:4000`).
```

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Runtime** | [Node.js](https://nodejs.org/) |
| **Backend** | [Express.js](https://expressjs.com/), [WebSockets](https://github.com/websockets/ws), [Multer](https://github.com/expressjs/multer) |
| **Frontend** | Vanilla JavaScript (ES6+), [Tailwind CSS](https://tailwindcss.com/) |
| **UI Icons** | [Phosphor Icons](https://phosphoricons.com/) |
| **Markdown** | [Marked.js](https://marked.js.org/) |
| **Math Renderer** | [KaTeX](https://katex.org/) |
| **Code Highlighting** | [Highlight.js](https://highlightjs.org/) |
| **AI Backend** | [Ollama](https://ollama.com/) (local) |

---

## 📁 Project Structure

```
starbox-ai/
├── public/
│   ├── index.html      # Main UI shell
│   ├── app.js          # Frontend logic (WebSocket, chat, state)
│   └── styles.css      # Global styles & glassmorphism theme
├── data/
│   └── state.json      # Persisted server-side state (chats, settings)
├── uploads/            # Temporary file upload storage
├── server.js           # Express + WebSocket backend
├── package.json
├── LICENSE
└── README.md
```

---

## ⚠️ Important Notes

- All your conversations are stored **locally** in `data/state.json`. There is no cloud sync.
- The `uploads/` and `data/` directories are created automatically on first run.
- Make sure the **model is installed** on your local machine before launching the server, or the model list will appear empty.

---

## 🗺️ Upcoming Features

- Support for additional LLM providers beyond Ollama
- Agentic capabilities

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for full details.
