<h1 align="center">✨ Starbox UI</h1>

<p align="center">
  <b>A sleek, local AI chat interface built for <a href="https://ollama.com/">Ollama</a></b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" />
  <img src="https://img.shields.io/badge/Node.js-≥18.0.0-green.svg" />
  <img src="https://img.shields.io/badge/Platform-Windows-lightgrey.svg" />
</p>



<p align="center">
  <img src="screenshots/1.png" width="400"/>
  <img src="screenshots/2.png" width="400"/>
</p>
<p align="center">
  <i>Chat with your local AI models — fast, private, and totally offline.</i>
</p>

---

## 🖼️ Overview

Currently in alpha state, **Starbox UI** is a premium-designed web interface that lets you chat with any model installed through **Ollama** directly on your machine, with zero data sent to the cloud. It features real-time response streaming, a fully-featured conversation manager, and a fully offline-capable UI served locally.

> ⚠️ **Performance depends on the model and your device's hardware.**

---

## 🎨 Features

- **Works Fully Offline** — All UI libraries (icons, markdown, syntax highlighting, math) are bundled locally. No internet required after installation.
- **Thinking Mode** — Real-time visualization of the model's thought process, with collapsible thinking blocks and infinite-loop protection (60s wall-clock cap + 45s inactivity watchdog).
- **Web Search** — Enable web search in the settings menu with your Tavily API key (Only works online obviously).
- **Temporary Chat** — Enable ghost mode to chat without saving anything to disk. The conversation is wiped the moment you navigate away or refresh.
- **Real-time Streaming** — Responses appear token-by-token using WebSockets for a fluid, ChatGPT-like experience.
- **Export & Import Chats** — Download individual chat histories as `.json` files and easily import them back to transfer or restore conversations.
- **Personalization** — Set custom AI behaviors globally by providing your name, occupation, extra context, and system instructions via the settings.
- **Performance Optimized** — Toggleable limits on rendered messages and full DOM-caching ensure the UI remains blazing fast, even in long chat sessions.
- **Instant Chat Search** — Filter your entire conversation history in real time from the sidebar.
- **Drag-and-Drop Reordering** — Reorganize your chat list with native HTML5 drag-and-drop.
- **File & Image Uploads** — Attach images with an interactive full-screen lightbox for visual analysis (with models like llava), and extract text contents directly from files.
- **Persistent History** — All conversations are saved locally to a `data/state.json` file on the server.
- **Settings Panel** — Centralized settings menu with chat history deletion safeguards and data managers.
- **Auto Model Detection** — Automatically fetches all locally available Ollama models on startup via the Ollama REST API.
- **Stop Session** — Safely unload the current model from memory and return to the setup screen at any time to explicitly free up VRAM.
- **Multi-device Access** — Access Starbox UI from your phone or tablet via your local network.

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

**3. Pull an Ollama model** (if you haven't already):
```bash
ollama pull <model_name>
```

**4. Start Ollama:**

> **On Windows**, the recommended way is to launch the **Ollama desktop app** and keep it minimized in the system tray. This ensures GPU drivers and model paths are configured correctly.
>
> Running `ollama serve` in a terminal may work on Linux/macOS, but on Windows it can fail to detect models if environment variables are not set up manually.

**5. Launch Starbox UI:**
```bash
npm start
```
or
```bash
node server.js
```

**6. Open your browser** and navigate to:
```
http://localhost:4000
```

> **Port behavior:**
> - The server defaults to port **4000**.
> - If port 4000 is taken by another application, it automatically tries the next port up to **5000**.

**7. Accessing from other devices on the same network:**
```
http://YOUR_LOCAL_IP:4000
```
> Replace `YOUR_LOCAL_IP` with your computer's local IP address (e.g., `192.168.1.x`). You can find it by running `ipconfig` (Windows) or `ifconfig` (macOS/Linux).

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Runtime** | [Node.js](https://nodejs.org/) |
| **Backend** | [Express.js](https://expressjs.com/), [WebSockets](https://github.com/websockets/ws), [Multer](https://github.com/expressjs/multer) |
| **Frontend** | Vanilla JavaScript (ES6+), [Tailwind CSS](https://tailwindcss.com/) |
| **UI Icons** | [Phosphor Icons](https://phosphoricons.com/) *(bundled locally)* |
| **Markdown** | [Marked.js](https://marked.js.org/) *(bundled locally)* |
| **Math Renderer** | [KaTeX](https://katex.org/) *(bundled locally)* |
| **Code Highlighting** | [Highlight.js](https://highlightjs.org/) *(bundled locally)* |
| **AI Backend** | [Ollama](https://ollama.com/) (local) |

---

## 📁 Project Structure

```
starbox-ui/
├── public/
│   ├── index.html          # Main UI shell
│   ├── app.js              # Frontend logic (WebSocket, chat, state)
│   ├── styles.css          # Global styles & glassmorphism theme
│   ├── input.css           # Tailwind CSS entry point
│   ├── output.css          # Compiled Tailwind CSS (auto-generated)
│   └── local-vendor/       # Locally bundled JS/CSS libraries (offline support)
│       ├── highlight.js/
│       └── marked/
├── data/
│   └── state.json          # Persisted server-side state (chats, settings)
├── uploads/                # Temporary file upload storage
├── server.js               # Express + WebSocket backend
├── package.json
├── tailwind.config.js
├── LICENSE
└── README.md
```

---

## ⚠️ Important Notes

- All conversations are stored **locally** in `data/state.json`. There is no cloud sync.
- The `uploads/` and `data/` directories are created automatically on first run and are excluded from Git.
- **Temporary Chat** mode is session-only — nothing is saved to disk while it's active. Refreshing the page will clear the conversation.
- Make sure the **Ollama app is running** before launching Starbox UI, or the model list will appear empty.

---

## 🗺️ Upcoming Features

- Support for additional LLM providers beyond Ollama
- Agentic capabilities

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for full details.
