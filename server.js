const express = require('express');
const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/vendor/@phosphor-icons/web', express.static(path.join(__dirname, 'node_modules', '@phosphor-icons', 'web')));
app.use('/vendor/marked', express.static(path.join(__dirname, 'node_modules', 'marked')));
app.use('/vendor/highlight.js', express.static(path.join(__dirname, 'node_modules', 'highlight.js')));
app.use('/vendor/katex', express.static(path.join(__dirname, 'node_modules', 'katex')));

// Set up Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// -- State Management --
const dataDir = path.join(__dirname, 'data');
const stateFile = path.join(dataDir, 'state.json');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const defaultState = {
    sessionActive: false,
    engine: 'ollama',
    model: '',
    thinkingMode: false,
    keepModelAlive: false,
    modelIdleTimeoutEnabled: true,
    modelIdleTimeout: 5,
    appliedModelIdleTimeoutEnabled: null,
    appliedModelIdleTimeout: null,
    lastActivityTime: null,
    activeChatId: null,
    personalization: { name: '', occupation: '', moreInfo: '', instructions: '' },
    webSearch: { enabled: false, tavilyApiKey: '' },
    timestampFormat: '12h',
    folders: [],
    chats: []
};

if (!fs.existsSync(stateFile)) {
    fs.writeFileSync(stateFile, JSON.stringify(defaultState, null, 2));
}

function readState() {
    try {
        return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    } catch (e) {
        return defaultState;
    }
}

function writeState(state) {
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

app.get('/api/state', (req, res) => {
    res.json(readState());
});

app.post('/api/state', (req, res) => {
    const currentState = readState();
    const newState = { ...currentState, ...req.body };
    writeState(newState);

    // Broadcast state update to all connected clients
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'state_update', state: newState }));
        }
    });

    res.json(newState);
});

app.post('/api/unload-model', async (req, res) => {
    const state = readState();
    const { model } = state;
    if (model && state.engine === 'ollama') {
        try {
            await fetch('http://127.0.0.1:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model, prompt: '', keep_alive: 0, stream: false })
            });
            console.log(`[UNLOAD] Model ${model} unloaded.`);
        } catch (e) {
            console.error('[UNLOAD] Error:', e.message);
        }
    }

    state.sessionActive = false;
    writeState(state);

    // Broadcast state update
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'state_update', state }));
        }
    });

    res.json({ ok: true });
});


// API to get available Ollama models natively via REST
app.get('/api/models', async (req, res) => {
    try {
        const response = await fetch('http://127.0.0.1:11434/api/tags');
        if (!response.ok) {
            res.json({ ollama: [] });
            return;
        }
        const data = await response.json();
        const models = (data.models || []).map(m => m.name);
        res.json({ ollama: models });
    } catch (e) {
        res.json({ ollama: [] });
    }
});

// API to check which models are currently loaded in Ollama memory
app.get('/api/model-status', async (req, res) => {
    try {
        const response = await fetch('http://127.0.0.1:11434/api/ps');
        if (!response.ok) { res.json({ running: [] }); return; }
        const data = await response.json();
        const running = data.models || [];
        res.json({ running });
    } catch (e) {
        res.json({ running: [] });
    }
});

// Pre-warm a model so it's loaded into memory before the first chat
app.post('/api/warm-model', async (req, res) => {
    const { model } = req.body;
    if (!model) { res.json({ ok: false }); return; }
    try {
        // Sending an empty prompt with keep_alive forces Ollama to load the model
        // without generating any output — this is the official "pre-load" pattern
        const state = readState();
        // If idle timeout is disabled (toggle off), keep the model alive indefinitely.
        const idleEnabled = state.modelIdleTimeoutEnabled !== false;
        const idleMinutes = typeof state.modelIdleTimeout === 'number' ? state.modelIdleTimeout : 5;
        const keepAlive = !idleEnabled ? -1 : `${idleMinutes}m`;
        const response = await fetch('http://127.0.0.1:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, prompt: '', keep_alive: keepAlive, stream: false })
        });
        if (response.ok) {
            console.log(`[WARM] Model ${model} loaded. keep_alive=${keepAlive}`);
            res.json({ ok: true });
        } else {
            res.json({ ok: false, status: response.status });
        }
    } catch (e) {
        console.error('[WARM] Error:', e.message);
        res.json({ ok: false, error: e.message });
    }
});

// Perform a Tavily web search and return structured results
app.post('/api/web-search', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'No query provided.' });

    const state = readState();
    // Support legacy searchSettings field as fallback
    const apiKey = state.webSearch?.tavilyApiKey || state.searchSettings?.tavilyApiKey || '';
    if (!apiKey) return res.status(400).json({ error: 'No Tavily API key configured. Add one in Settings → Web Search.' });

    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: apiKey,
                query,
                search_depth: 'basic',
                max_results: 5,
                include_answer: false
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return res.status(response.status).json({ error: err.message || `Tavily error: ${response.status}` });
        }

        const data = await response.json();
        const results = (data.results || []).map(r => ({
            title: r.title || '',
            url: r.url || '',
            content: (r.content || '').substring(0, 600)
        }));
        console.log(`[WEB SEARCH] query="${query}" — ${results.length} results`);
        res.json({ results });
    } catch (e) {
        console.error('[WEB SEARCH] Error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/upload', upload.array('files'), (req, res) => {
    try {
        const fileContents = req.files.map(f => {
            const mimeType = f.mimetype || '';
            const isImage = mimeType.startsWith('image/');

            let content, type;
            if (isImage) {
                // Return image as base64 data URI so the UI can preview it
                const imageBuffer = fs.readFileSync(f.path);
                const base64 = imageBuffer.toString('base64');
                content = `data:${mimeType};base64,${base64}`;
                type = 'image';
            } else {
                // Try to read as text; fall back gracefully for unknown binary
                try {
                    content = fs.readFileSync(f.path, 'utf8');
                } catch (e) {
                    content = '[Binary file — cannot display as text]';
                }
                type = 'text';
            }

            fs.unlinkSync(f.path); // clean up temp file
            return { name: f.originalname, content, type };
        });
        res.json(fileContents);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

wss.on('connection', (ws) => {
    let currentProcess = null;

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'start') {
                const { engine, model, prompt, thinkingMode } = data;

                if (engine === 'ollama') {
                    const controller = new AbortController();
                    currentProcess = { kill: () => controller.abort() };

                    let isTimeout = false;
                    try {
                        // Build messages array for /api/chat (proper multi-turn context)
                        const rawMessages = Array.isArray(data.messages)
                            ? data.messages
                            : [{ role: 'user', content: data.prompt || '' }];

                        // Forward images arrays for vision-capable models
                        const chatMessages = rawMessages.map(m => {
                            const msg = { role: m.role, content: m.content };
                            if (Array.isArray(m.images) && m.images.length > 0) {
                                msg.images = m.images; // raw base64 strings, no data-URI prefix
                            }
                            return msg;
                        });

                        // Prepend a system message if thinking mode is on
                        const payload = { model, stream: true, messages: chatMessages };
                        // Explicitly set think=true/false — Qwen3 and other models default to think=true
                        // if the field is omitted, so we must always pass it explicitly.
                        payload.think = !!thinkingMode;

                        // keep_alive: -1 = stay loaded until manually unloaded.
                        // Controlled by modelIdleTimeoutEnabled toggle + modelIdleTimeout minutes.
                        const state = readState();
                        const idleEnabled = state.modelIdleTimeoutEnabled !== false;
                        const idleMinutes = typeof state.modelIdleTimeout === 'number' ? state.modelIdleTimeout : 5;
                        payload.keep_alive = !idleEnabled ? -1 : `${idleMinutes}m`;

                        console.log(`[CHAT] Ollama /api/chat — model=${model}, think=${!!thinkingMode}, messages=${payload.messages.length}`);

                        // Add a timeout if no response is received in 90 seconds
                        const timeoutId = setTimeout(() => {
                            isTimeout = true;
                            controller.abort();
                        }, 90000);

                        const response = await fetch('http://127.0.0.1:11434/api/chat', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload),
                            signal: controller.signal
                        });

                        clearTimeout(timeoutId);

                        if (!response.ok) {
                            ws.send(JSON.stringify({ type: 'error', message: `Ollama error: ${response.status} ${response.statusText}` }));
                            return;
                        }
                        const decoder = new TextDecoder();
                        let buffer = '';
                        let hasContent = false;         // true once a real content token arrives
                        let thinkingWatchdog = null;    // timer: fires if no new thinking token for 45s
                        let thinkingAbsoluteTimer = null; // hard cap: abort if thinking > 60s total

                        const resetThinkingWatchdog = () => {
                            if (thinkingWatchdog) clearTimeout(thinkingWatchdog);
                            if (!hasContent) {
                                // Inactivity watchdog: 45s silence = stuck
                                thinkingWatchdog = setTimeout(() => {
                                    isTimeout = true;
                                    controller.abort();
                                }, 45000);

                                // Absolute cap: start only once (when thinking first begins)
                                if (!thinkingAbsoluteTimer) {
                                    thinkingAbsoluteTimer = setTimeout(() => {
                                        if (!hasContent) {
                                            isTimeout = true;
                                            controller.abort();
                                        }
                                    }, 60000); // 60s hard limit on total thinking
                                }
                            }
                        };

                        for await (const chunk of response.body) {
                            buffer += decoder.decode(chunk, { stream: true });
                            const lines = buffer.split('\n');
                            buffer = lines.pop();

                            for (const line of lines) {
                                if (!line.trim()) continue;
                                try {
                                    const parsed = JSON.parse(line);
                                    // Stream thinking tokens separately, and reset watchdog
                                    const thinkChunk = parsed.message?.thinking;
                                    if (typeof thinkChunk === 'string' && thinkChunk.length > 0) {
                                        ws.send(JSON.stringify({ type: 'thinking', chunk: thinkChunk }));
                                        resetThinkingWatchdog(); // restart 45s clock each thinking token
                                    }
                                    // /api/chat puts text in parsed.message.content
                                    const token = parsed.message?.content;
                                    if (typeof token === 'string' && token.length > 0) {
                                        hasContent = true;
                                        if (thinkingWatchdog) clearTimeout(thinkingWatchdog);
                                        if (thinkingAbsoluteTimer) clearTimeout(thinkingAbsoluteTimer); // loops over, content started
                                        ws.send(JSON.stringify({ type: 'stream', chunk: token }));
                                    }
                                    if (parsed.done) {
                                        if (thinkingWatchdog) clearTimeout(thinkingWatchdog);
                                        if (thinkingAbsoluteTimer) clearTimeout(thinkingAbsoluteTimer);
                                        ws.send(JSON.stringify({ type: 'done' }));
                                        currentProcess = null;
                                    }
                                } catch (e) {
                                    console.error('JSON parse error:', e.message);
                                }
                            }
                        }
                    } catch (err) {
                        if (err.name === 'AbortError' && isTimeout) {
                            ws.send(JSON.stringify({ type: 'error', message: 'Thinking timed out after 45 seconds. Try disabling Thinking Mode or using a larger model.' }));
                        } else if (err.name !== 'AbortError') {
                            ws.send(JSON.stringify({ type: 'error', message: err.message }));
                        }
                    }

                } else if (engine === 'claude') {
                    // Claude Code CLI
                    const args = ['-p'];
                    // We need to enclose the prompt properly, but spawn with shell: true passes as string array

                    if (thinkingMode) {
                        args.push(`"Please think step-by-step before answering. ${prompt.replace(/"/g, '\\"')}"`);
                    } else {
                        args.push(`"${prompt.replace(/"/g, '\\"')}"`);
                    }

                    if (model) {
                        args.push('--model', model);
                    }

                    currentProcess = spawn('claude', args, { shell: true });

                    currentProcess.stdout.on('data', (d) => {
                        const str = d.toString();
                        // Claude Code often prints ansi codes, we'll strip them on the frontend or backend
                        // Also, when run with -p, it just outputs text
                        ws.send(JSON.stringify({ type: 'stream', chunk: str }));
                    });

                    currentProcess.stderr.on('data', (d) => {
                        ws.send(JSON.stringify({ type: 'stream', chunk: d.toString() })); // Claude CLI might write to stderr
                    });

                    currentProcess.on('close', () => {
                        ws.send(JSON.stringify({ type: 'done' }));
                        currentProcess = null;
                    });
                }
            } else if (data.type === 'stop') {
                if (currentProcess) {
                    if (typeof currentProcess.kill === 'function') {
                        currentProcess.kill();
                    } else if (typeof currentProcess.destroy === 'function') {
                        currentProcess.destroy();
                    }
                    ws.send(JSON.stringify({ type: 'stopped' }));
                    currentProcess = null;
                }
            }
        } catch (e) {
            ws.send(JSON.stringify({ type: 'error', message: e.message }));
        }
    });

    ws.on('close', () => {
        if (currentProcess) {
            if (typeof currentProcess.kill === 'function') {
                currentProcess.kill();
            } else if (typeof currentProcess.destroy === 'function') {
                currentProcess.destroy();
            }
        }
    });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'starbox-ui-active' });
});

app.post('/api/shutdown', (req, res) => {
    console.log('[SHUTDOWN] Received shutdown request from UI. Exiting...');
    res.json({ ok: true });
    setTimeout(() => {
        process.exit(0);
    }, 500);
});

let currentPort = parseInt(process.env.PORT, 10) || 4000;

server.on('error', async (err) => {
    if (err.code === 'EADDRINUSE') {
        try {
            // Check if the port is occupied by another instance of Starbox UI
            const res = await fetch(`http://127.0.0.1:${currentPort}/api/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(500)
            });
            const data = await res.json();
            if (data.status === 'starbox-ui-active') {
                console.error(`\n[!] Starbox UI is already running on port ${currentPort}.`);
                console.error('[!] Duplicate instances are not allowed. Exiting...\n');
                process.exit(1);
            }
        } catch {
            // Port is used by a different program — safe to try the next one
        }
        const nextPort = currentPort + 1;
        if (nextPort <= 5000) {
            console.log(`Port ${currentPort} is in use by another program, trying ${nextPort}...`);
            currentPort = nextPort;
            server.listen(currentPort, '0.0.0.0');
        } else {
            console.error('All ports in range 4000–5000 are in use. Exiting.');
            process.exit(1);
        }
    } else {
        console.error(err);
    }
});

server.on('listening', () => {
    console.log(`Starbox UI running on http://localhost:${currentPort}`);
});

server.listen(currentPort, '0.0.0.0');