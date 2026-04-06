const setupPage = document.getElementById('setupPage');
const appContainer = document.getElementById('appContainer');
const setupProceedBtn = document.getElementById('setupProceedBtn');
const activeModelLabel = document.getElementById('activeModelLabel');
const activeEngineIcon = document.getElementById('activeEngineIcon');
const unloadModelBtn = document.getElementById('unloadModelBtn');
const newChatBtn = document.getElementById('newChatBtn');
const chatList = document.getElementById('chatList');
const thinkingCheckbox = document.getElementById('thinkingCheckbox');
const messagesContainer = document.getElementById('messagesContainer');
const emptyState = document.getElementById('emptyState');
const promptInput = document.getElementById('promptInput');
const sendBtn = document.getElementById('sendBtn');
const stopBtn = document.getElementById('stopBtn');
const fileUpload = document.getElementById('fileUpload');
const filePreview = document.getElementById('filePreview');
const typingIndicator = document.getElementById('typingIndicator');
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const inputPanel = document.getElementById('inputPanel');
const chatMessages = document.getElementById('chatMessages');
const chatSearchBox = document.getElementById('chatSearchBox');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const clearHistoryTriggerBtn = document.getElementById('clearHistoryTriggerBtn');
const clearConfirmModal = document.getElementById('clearConfirmModal');
const clearCancelBtn = document.getElementById('clearCancelBtn');
const clearProceedBtn = document.getElementById('clearProceedBtn');
const deleteChatConfirmModal = document.getElementById('deleteChatConfirmModal');
const deleteChatCancelBtn = document.getElementById('deleteChatCancelBtn');
const deleteChatProceedBtn = document.getElementById('deleteChatProceedBtn');
const stopSessionConfirmModal = document.getElementById('stopSessionConfirmModal');
const stopSessionCancelBtn = document.getElementById('stopSessionCancelBtn');
const stopSessionProceedBtn = document.getElementById('stopSessionProceedBtn');
const shutdownServerBtn = document.getElementById('shutdownServerBtn');
const tempChatBtn = document.getElementById('tempChatBtn');

const persName = document.getElementById('persName');
const persOccupation = document.getElementById('persOccupation');
const persMoreInfo = document.getElementById('persMoreInfo');
const persInstructions = document.getElementById('persInstructions');

let chatSearchQuery = '';
let draggedChatId = null;
let chatToDeleteId = null;
let isTemporaryChat = false; // When true, active chat is not persisted to backend

document.addEventListener('click', (e) => {
    if (!e.target.closest('.chat-actions')) {
        document.querySelectorAll('.chat-options-menu').forEach(m => m.classList.add('hidden'));
        document.querySelectorAll('.chat-actions').forEach(a => a.style.opacity = '');
    }
});

// ── DOM refs ──────────────────────────────────────────────────────────────────
// ── CustomDropdown ────────────────────────────────────────────────────────────
class CustomDropdown {
    constructor(elId) {
        this.el = document.getElementById(elId);
        this.trigger = this.el.querySelector('.dropdown-trigger');
        this.menu = this.el.querySelector('.dropdown-menu');
        this._value = this.el.querySelector('.dropdown-option.active')?.dataset.value
            || this.el.querySelector('.dropdown-option')?.dataset.value
            || '';
        this._onChange = null;

        this.trigger.addEventListener('click', e => { e.stopPropagation(); this.toggle(); });
        this.el.addEventListener('click', e => e.stopPropagation()); // prevent doc close
        document.addEventListener('click', () => this.close());
        this._bindOptions();
    }

    get value() { return this._value; }
    set value(v) {
        const opt = this.menu.querySelector(`.dropdown-option[data-value="${v}"]`);
        if (opt) this._select(opt);
    }

    _bindOptions() {
        this.menu.querySelectorAll('.dropdown-option[data-value]').forEach(opt => {
            opt.addEventListener('click', () => {
                this._select(opt);
                if (this._onChange) this._onChange(this._value);
            });
        });
    }

    _select(opt) {
        this._value = opt.dataset.value;
        this.trigger.querySelector('.dropdown-label').textContent = opt.textContent.trim();
        this.menu.querySelectorAll('.dropdown-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        this.close();
    }

    setOptions(options) {
        this.menu.innerHTML = '';
        options.forEach(({ value, label, icon }) => {
            const div = document.createElement('div');
            div.className = 'dropdown-option';
            div.dataset.value = value;
            div.innerHTML = icon ? `<i class="${icon}"></i> ${label}` : label;
            div.addEventListener('click', () => {
                this._select(div);
                if (this._onChange) this._onChange(this._value);
            });
            this.menu.appendChild(div);
        });

        // Auto-select the first option so the trigger label stays in sync
        const first = this.menu.querySelector('.dropdown-option[data-value]');
        if (first) {
            this._value = first.dataset.value;
            this.trigger.querySelector('.dropdown-label').textContent = first.textContent.trim();
            first.classList.add('active');
        }
    }

    onChange(cb) { this._onChange = cb; }

    toggle() {
        const isOpen = this.el.classList.toggle('open');
        this.menu.classList.toggle('hidden', !isOpen);
        // Close sibling dropdowns
        document.querySelectorAll('.custom-dropdown.open').forEach(d => {
            if (d !== this.el) { d.classList.remove('open'); d.querySelector('.dropdown-menu').classList.add('hidden'); }
        });
    }

    close() {
        this.el.classList.remove('open');
        this.menu.classList.add('hidden');
    }
}

// ── State ─────────────────────────────────────────────────────────────────────
let globalState = {
    sessionActive: false,
    engine: 'ollama',
    model: '',
    thinkingMode: false,
    activeChatId: null,
    chats: []
};
let availableModels = { ollama: [], claude: [] };
let isGenerating = false;
let generatingChatId = null;
let pendingFiles = [];   // [{ type, name, content }] — text or image
let ws = null;
let aiMessageBuffer = '';
let aiMessageEl = null;  // DOM element to stream into
let thinkingBuffer = '';
let thinkingEl = null;  // DOM element for live thinking block
let setupEngineDropdown, setupModelDropdown;

// ── Render Settings (localStorage, frontend-only) ─────────────────────────────
let renderSettings = {
    limitMessages: false,
    messageLimit: 20
};
let renderOffset = {}; // { [chatId]: startIndex } tracks how far back we've loaded

function loadRenderSettings() {
    try {
        const saved = localStorage.getItem('starbox_renderSettings');
        if (saved) renderSettings = { ...renderSettings, ...JSON.parse(saved) };
    } catch (e) { /* ignore */ }
}

function saveRenderSettings() {
    localStorage.setItem('starbox_renderSettings', JSON.stringify(renderSettings));
}

// ── Boot ──────────────────────────────────────────────────────────────────────
init();

async function init() {
    setupEngineDropdown = new CustomDropdown('setupEngineDropdown');
    setupModelDropdown = new CustomDropdown('setupModelDropdown');

    loadRenderSettings();
    applyRenderSettingsToUI();

    setupEventListeners();
    await fetchModels();
    await fetchGlobalState();

    connectWebSocket();

    marked.setOptions({
        highlight: function (code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        },
        langPrefix: 'hljs language-', breaks: true, gfm: true
    });

    const syncPadding = () => {
        if (chatMessages && inputPanel) chatMessages.style.paddingBottom = (inputPanel.offsetHeight + 8) + 'px';
    };
    syncPadding();
    if (inputPanel) new ResizeObserver(syncPadding).observe(inputPanel);
}

function applyRenderSettingsToUI() {
    const toggle = document.getElementById('limitMessagesToggle');
    const limitRow = document.getElementById('messageLimitRow');
    const limitInput = document.getElementById('messageLimitInput');
    if (toggle) toggle.checked = renderSettings.limitMessages;
    if (limitRow) limitRow.classList.toggle('hidden', !renderSettings.limitMessages);
    if (limitInput) limitInput.value = renderSettings.messageLimit;
}

async function fetchGlobalState() {
    try {
        const port = window.location.port || '4000';
        const res = await fetch(`http://${window.location.hostname}:${port}/api/state`);
        globalState = await res.json();

        // Sanitize legacy state
        if (globalState.engine === 'claude') {
            globalState.engine = 'ollama';
            globalState.model = availableModels['ollama']?.[0] || '';
            globalState.sessionActive = false; // Force re-setup
            updateState(globalState); // Save sanitized state back
        }

        applyStateToUI();
    } catch (e) { console.error(e); }
}

async function updateState(newState) {
    globalState = { ...globalState, ...newState };
    try {
        // Strip temporary chats from backend persistence
        const persistChats = (globalState.chats || []).filter(c => !c.isTemporary);
        const persistActiveChatId = persistChats.find(c => c.id === globalState.activeChatId)
            ? globalState.activeChatId
            : (persistChats[0]?.id || null);

        const persistPayload = { ...newState };
        if ('chats' in newState) persistPayload.chats = persistChats;
        if ('activeChatId' in newState) persistPayload.activeChatId = persistActiveChatId;

        const port = window.location.port || '4000';
        await fetch(`http://${window.location.hostname}:${port}/api/state`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(persistPayload)
        });
    } catch (e) { console.error(e); }
}

function applyStateToUI() {
    if (globalState.personalization) {
        if (persName) persName.value = globalState.personalization.name || '';
        if (persOccupation) persOccupation.value = globalState.personalization.occupation || '';
        if (persMoreInfo) persMoreInfo.value = globalState.personalization.moreInfo || '';
        if (persInstructions) persInstructions.value = globalState.personalization.instructions || '';
    }

    if (globalState.sessionActive && globalState.model) {
        if (setupPage) setupPage.classList.add('hidden');
        if (appContainer) appContainer.classList.remove('hidden');

        if (activeModelLabel) activeModelLabel.textContent = globalState.model;
        if (activeEngineIcon) activeEngineIcon.className = globalState.engine === 'ollama' ? 'ph ph-cpu text-xs text-indigo-400' : 'ph ph-terminal text-xs text-violet-400';
        if (thinkingCheckbox) thinkingCheckbox.checked = globalState.thinkingMode;

        if (!globalState.chats || globalState.chats.length === 0) {
            createNewChat(true);
        } else {
            if (!globalState.activeChatId || !globalState.chats.find(c => c.id === globalState.activeChatId)) {
                globalState.activeChatId = globalState.chats[0].id;
                updateState({ activeChatId: globalState.activeChatId });
            }
            renderChatList();
            loadChat(globalState.activeChatId);
        }
    } else {
        if (setupPage) setupPage.classList.remove('hidden');
        if (appContainer) appContainer.classList.add('hidden');
        if (setupEngineDropdown) setupEngineDropdown.value = globalState.engine || 'ollama';
        populateModelSelector();
    }
}

// ── Event listeners ───────────────────────────────────────────────────────────
function setupEventListeners() {
    if (shutdownServerBtn) {
        shutdownServerBtn.addEventListener('click', async () => {
            shutdownServerBtn.innerHTML = '<i class="ph ph-spinner animate-spin text-lg"></i> Stopping...';
            shutdownServerBtn.disabled = true;
            try {
                const port = window.location.port || '4000';
                await fetch(`http://${window.location.hostname}:${port}/api/shutdown`, { method: 'POST' });
                shutdownServerBtn.innerHTML = '<i class="ph ph-check-circle text-lg"></i> Server Stopped';
                shutdownServerBtn.classList.replace('text-red-400', 'text-green-400');
                shutdownServerBtn.classList.replace('bg-red-500/10', 'bg-green-500/10');
                shutdownServerBtn.classList.replace('border-red-500/20', 'border-green-500/20');
                showToast('Server has been shut down. You can close this window.', 'info');
            } catch (e) {
                shutdownServerBtn.innerHTML = '<i class="ph ph-check-circle text-lg"></i> Server Stopped';
                shutdownServerBtn.classList.replace('text-red-400', 'text-green-400');
                shutdownServerBtn.classList.replace('bg-red-500/10', 'bg-green-500/10');
                shutdownServerBtn.classList.replace('border-red-500/20', 'border-green-500/20');
                showToast('Server has been shut down. You can close this window.', 'info');
            }
        });
    }

    if (promptInput) {
        promptInput.addEventListener('input', () => {
            promptInput.style.height = 'auto';
            promptInput.style.height = promptInput.scrollHeight + 'px';
            updateSendBtn();
        });

        promptInput.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const text = promptInput.value.trim();
                const hasFiles = pendingFiles.length > 0;
                if ((text || hasFiles) && !isGenerating) {
                    sendMessage();
                }
            }
        });
    }

    if (sendBtn) sendBtn.addEventListener('click', () => {
        if (!sendBtn.disabled && !isGenerating) sendMessage();
    });

    if (stopBtn) stopBtn.addEventListener('click', stopGeneration);
    if (fileUpload) fileUpload.addEventListener('change', handleFileUpload);
    if (newChatBtn) newChatBtn.addEventListener('click', () => {
        isTemporaryChat = false;
        updateTempChatBtn();
        createNewChat(false);
    });

    if (tempChatBtn) {
        tempChatBtn.addEventListener('click', () => {
            // Cannot toggle temporary mode once a chat has started
            const current = globalState.chats.find(c => c.id === globalState.activeChatId);
            if (current && current.messages.length > 0) return;

            isTemporaryChat = !isTemporaryChat;
            // Mark the current (empty) chat as temporary
            if (current) current.isTemporary = isTemporaryChat;
            updateTempChatBtn();
        });
    }

    if (chatSearchBox) chatSearchBox.addEventListener('input', e => {
        chatSearchQuery = e.target.value.toLowerCase().trim();
        renderChatList();
    });

    if (settingsBtn) settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));

    if (clearHistoryTriggerBtn) clearHistoryTriggerBtn.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
        clearConfirmModal.classList.remove('hidden');
    });

    if (clearCancelBtn) clearCancelBtn.addEventListener('click', () => clearConfirmModal.classList.add('hidden'));

    // ── Render Settings listeners ──
    const limitMessagesToggle = document.getElementById('limitMessagesToggle');
    const messageLimitRow = document.getElementById('messageLimitRow');
    const messageLimitInput = document.getElementById('messageLimitInput');
    const messageLimitMinus = document.getElementById('messageLimitMinus');
    const messageLimitPlus = document.getElementById('messageLimitPlus');

    if (limitMessagesToggle) {
        limitMessagesToggle.addEventListener('change', () => {
            renderSettings.limitMessages = limitMessagesToggle.checked;
            saveRenderSettings();
            if (messageLimitRow) messageLimitRow.classList.toggle('hidden', !renderSettings.limitMessages);
            // Re-render active chat with new setting
            if (globalState.activeChatId) loadChat(globalState.activeChatId);
        });
    }

    if (messageLimitMinus) {
        messageLimitMinus.addEventListener('click', () => {
            const newVal = Math.max(5, renderSettings.messageLimit - 5);
            renderSettings.messageLimit = newVal;
            saveRenderSettings();
            if (messageLimitInput) messageLimitInput.value = newVal;
        });
    }

    if (messageLimitPlus) {
        messageLimitPlus.addEventListener('click', () => {
            const newVal = Math.min(100, renderSettings.messageLimit + 5);
            renderSettings.messageLimit = newVal;
            saveRenderSettings();
            if (messageLimitInput) messageLimitInput.value = newVal;
        });
    }

    if (messageLimitInput) {
        messageLimitInput.addEventListener('change', () => {
            const parsed = parseInt(messageLimitInput.value, 10);
            if (!isNaN(parsed)) {
                renderSettings.messageLimit = Math.max(5, Math.min(100, Math.round(parsed / 5) * 5));
                messageLimitInput.value = renderSettings.messageLimit;
                saveRenderSettings();
            }
        });
    }

    if (clearProceedBtn) clearProceedBtn.addEventListener('click', () => {
        globalState.chats = [];
        globalState.activeChatId = null;
        saveChats();
        createNewChat(true);
        clearConfirmModal.classList.add('hidden');
    });

    if (deleteChatCancelBtn) {
        deleteChatCancelBtn.addEventListener('click', () => {
            deleteChatConfirmModal.classList.add('hidden');
            chatToDeleteId = null;
        });
    }

    if (deleteChatProceedBtn) {
        deleteChatProceedBtn.addEventListener('click', () => {
            if (chatToDeleteId) {
                deleteChat(chatToDeleteId);
            }
            deleteChatConfirmModal.classList.add('hidden');
            chatToDeleteId = null;
        });
    }

    const savePersonalization = () => {
        updateState({
            personalization: {
                name: persName?.value.trim() || '',
                occupation: persOccupation?.value.trim() || '',
                moreInfo: persMoreInfo?.value.trim() || '',
                instructions: persInstructions?.value.trim() || ''
            }
        });
    };
    if (persName) persName.addEventListener('blur', savePersonalization);
    if (persOccupation) persOccupation.addEventListener('blur', savePersonalization);
    if (persMoreInfo) persMoreInfo.addEventListener('blur', savePersonalization);
    if (persInstructions) persInstructions.addEventListener('blur', savePersonalization);

    if (setupEngineDropdown) setupEngineDropdown.onChange(val => {
        globalState.engine = val;
        populateModelSelector();
    });

    if (setupModelDropdown) setupModelDropdown.onChange(val => {
        globalState.model = val;
    });

    if (thinkingCheckbox) {
        thinkingCheckbox.addEventListener('change', () => {
            updateState({ thinkingMode: thinkingCheckbox.checked });
        });
    }

    if (setupProceedBtn) {
        setupProceedBtn.addEventListener('click', async () => {
            const engine = setupEngineDropdown.value;
            const model = setupModelDropdown.value;
            if (!model) return;

            setupProceedBtn.disabled = true;
            setupProceedBtn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Loading...';

            if (engine === 'ollama') {
                await warmModel(model);
            }

            await updateState({ sessionActive: true, engine, model });

            setupProceedBtn.disabled = false;
            setupProceedBtn.innerHTML = '<span>Proceed</span> <i class="ph ph-arrow-right"></i>';

            applyStateToUI();
        });
    }

    if (unloadModelBtn) {
        unloadModelBtn.addEventListener('click', () => {
            stopSessionConfirmModal.classList.remove('hidden');
        });
    }

    if (stopSessionCancelBtn) {
        stopSessionCancelBtn.addEventListener('click', () => {
            stopSessionConfirmModal.classList.add('hidden');
        });
    }

    if (stopSessionProceedBtn) {
        stopSessionProceedBtn.addEventListener('click', async () => {
            stopSessionConfirmModal.classList.add('hidden');
            try {
                const port = window.location.port || '4000';
                await fetch(`http://${window.location.hostname}:${port}/api/unload-model`, { method: 'POST' });
            } catch (e) {
                console.error('Error unloading:', e);
            }
            // Update local state immediately for fast feedback
            globalState.sessionActive = false;
            applyStateToUI();
        });
    }

    // Mobile sidebar
    if (toggleSidebarBtn) toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('hidden');
        sidebar.classList.add('flex', 'fixed', 'inset-y-0', 'left-0');
        sidebarOverlay.classList.remove('hidden');
    });
    [closeSidebarBtn, sidebarOverlay].forEach(el => {
        if (el) el.addEventListener('click', closeMobileSidebar);
    });
}

function closeMobileSidebar() {
    if (sidebar) {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('flex', 'fixed', 'inset-y-0', 'left-0');
    }
    if (sidebarOverlay) sidebarOverlay.classList.add('hidden');
}

function updateSendBtn() {
    if (sendBtn) sendBtn.disabled = promptInput.value.trim() === '' && pendingFiles.length === 0;
}

// ── Models ────────────────────────────────────────────────────────────────────
async function fetchModels() {
    try {
        const port = window.location.port || '4000';
        const res = await fetch(`http://${window.location.hostname}:${port}/api/models`);
        availableModels = await res.json();
        populateModelSelector();
    } catch (e) {
        console.error('Could not fetch models:', e);
    }
}

function populateModelSelector() {
    if (!setupModelDropdown) return;
    const models = availableModels[globalState.engine] || [];

    if (!models.length) {
        setupModelDropdown.setOptions([{ value: '', label: 'No models found' }]);
        return;
    }

    setupModelDropdown.setOptions(models.map(m => ({ value: m, label: m })));

    const saved = globalState.model;
    const target = saved && models.includes(saved) ? saved : models[0];
    setupModelDropdown.value = target;
    globalState.model = target;
}

async function warmModel(model) {
    try {
        const port = window.location.port || '4000';
        await fetch(`http://${window.location.hostname}:${port}/api/warm-model`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model })
        });
    } catch (e) {
        console.error('Warmup failed', e);
    }
}

// Add _revertTo to CustomDropdown prototype (set value silently without firing onChange)
CustomDropdown.prototype._revertTo = function (val) {
    const opt = this.menu.querySelector(`.dropdown-option[data-value="${val}"]`);
    if (opt) {
        this._value = val;
        this.trigger.querySelector('.dropdown-label').textContent = opt.textContent.trim();
        this.menu.querySelectorAll('.dropdown-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
    }
};

// ── File Upload ───────────────────────────────────────────────────────────────
async function handleFileUpload(e) {
    const files = e.target.files;
    if (!files.length) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) formData.append('files', files[i]);

    const loadingEl = document.createElement('div');
    loadingEl.className = 'text-xs px-3 py-1.5 rounded-lg text-white/40 flex items-center gap-2 glass-card animate-pulse';
    loadingEl.innerHTML = '<i class="ph ph-spinner"></i> Uploading…';
    filePreview.appendChild(loadingEl);

    try {
        const port = window.location.port || '4000';
        const res = await fetch(`http://${window.location.hostname}:${port}/api/upload`, {
            method: 'POST', body: formData
        });

        loadingEl.remove();

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
            showToast(`Upload failed: ${err.error}`, 'error');
            return;
        }

        const data = await res.json();

        data.forEach(file => {
            pendingFiles.push(file);

            const chip = document.createElement('div');
            if (file.type === 'image') {
                chip.className = 'relative group';
                chip.innerHTML = `
                    <img src="${file.content}" alt="${file.name}"
                         class="h-14 w-14 object-cover rounded-xl border border-white/10 shadow-md">
                    <button data-name="${file.name}"
                        class="remove-file absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black/70 border border-white/20 text-white/60 hover:text-red-400 flex items-center justify-center text-[9px] opacity-0 group-hover:opacity-100 transition-opacity">
                        <i class="ph ph-x"></i>
                    </button>`;
            } else {
                chip.className = 'glass-card text-xs px-3 py-1.5 rounded-lg text-white/60 flex items-center gap-2 group relative';
                chip.innerHTML = `
                    <i class="ph ph-file-text text-indigo-400"></i>
                    <span class="max-w-[120px] truncate">${file.name}</span>
                    <button data-name="${file.name}"
                        class="remove-file text-white/30 hover:text-red-400 transition ml-0.5">
                        <i class="ph ph-x text-[10px]"></i>
                    </button>`;
            }

            chip.querySelector('.remove-file').addEventListener('click', () => {
                pendingFiles = pendingFiles.filter(f => f.name !== file.name);
                chip.remove();
                updateSendBtn();
            });

            filePreview.appendChild(chip);
        });

        updateSendBtn();
    } catch (err) {
        loadingEl.remove();
        showToast(`Upload error: ${err.message}`, 'error');
    }

    fileUpload.value = '';
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
    const t = document.createElement('div');
    const c = type === 'error'
        ? 'bg-red-950/90 border-red-500/30 text-red-300'
        : 'bg-gray-900/90 border-white/10 text-white/80';
    t.className = `fixed bottom-8 right-8 z-50 px-4 py-2.5 rounded-xl border text-xs shadow-xl ${c} flex items-center gap-2 toast-animate`;
    t.innerHTML = `<i class="ph ph-warning-circle"></i> ${message}`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
}

// ── Chat management ───────────────────────────────────────────────────────────
/**
 * Sync the Temp Chat button appearance based on state.
 * - active: temp mode is on
 * - locked: chat already has messages, can't toggle
 */
function updateTempChatBtn() {
    if (!tempChatBtn) return;
    const current = globalState.chats.find(c => c.id === globalState.activeChatId);
    const hasMessages = current && current.messages.length > 0;
    tempChatBtn.classList.toggle('active', isTemporaryChat);
    tempChatBtn.classList.toggle('locked', hasMessages);
    tempChatBtn.title = hasMessages
        ? 'Temp Chat can only be toggled on a fresh chat'
        : isTemporaryChat
            ? 'Temporary Chat is ON — messages won\'t be saved. Click to disable.'
            : 'Toggle Temporary Chat — messages won\'t be saved';
}

/**
 * @param {boolean} silent - if true, skip "empty chat" guard (used on boot)
 */
function createNewChat(silent = false) {
    if (!silent) {
        const current = globalState.chats.find(c => c.id === globalState.activeChatId);
        if (current && current.messages.length === 0) {
            promptInput.focus();
            if (window.innerWidth < 768) closeMobileSidebar();
            return;
        }
    }

    const newChat = {
        id: Date.now().toString(),
        title: 'New Conversation',
        messages: [],
        isTemporary: isTemporaryChat,
        updatedAt: Date.now()
    };
    globalState.chats.unshift(newChat);
    globalState.activeChatId = newChat.id;
    updateState({ chats: globalState.chats, activeChatId: globalState.activeChatId });
    renderChatList();
    loadChat(globalState.activeChatId);

    if (window.innerWidth < 768) closeMobileSidebar();
}

function saveChats() {
    updateState({ chats: globalState.chats, activeChatId: globalState.activeChatId });
}

function renderChatList() {
    chatList.innerHTML = '';

    const filteredChats = globalState.chats.filter(chat =>
        !chat.isTemporary &&
        chat.title.toLowerCase().includes(chatSearchQuery) &&
        chat.messages.length > 0
    );

    filteredChats.forEach((chat, index) => {
        const btn = document.createElement('button');
        btn.className = 'chat-item group' + (chat.id === globalState.activeChatId ? ' active' : '');
        btn.draggable = true;

        btn.innerHTML = `
            <div class="flex items-center gap-2 min-w-0 flex-1 pointer-events-none">
                <i class="ph ph-chat-teardrop text-sm flex-shrink-0"></i>
                <span class="truncate chat-title-text">${escapeHtml(chat.title)}</span>
            </div>
            <div class="chat-actions relative flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="options-trigger flex-shrink-0 flex items-center justify-center w-6 h-6 text-white/40 hover:text-white transition" title="Options">
                    <i class="ph ph-dots-three-outline-vertical text-[18px]"></i>
                </button>
                <div class="chat-options-menu glass-dropdown hidden shadow-2xl overflow-hidden" style="left: auto; right: 0; top: calc(100% + 4px); min-width: 120px; z-index: 50; padding: 4px;">
                    <div class="dropdown-option rename-chat text-white/80 hover:text-white mb-0.5">
                        <i class="ph ph-pencil-simple text-sm"></i> Rename
                    </div>
                    <div class="dropdown-option delete-chat !text-red-500 hover:!text-red-400 hover:!bg-red-500/10">
                        <i class="ph ph-trash text-sm"></i> Delete
                    </div>
                </div>
            </div>`;

        const optionsTrigger = btn.querySelector('.options-trigger');
        const optionsMenu = btn.querySelector('.chat-options-menu');
        const actionsDiv = btn.querySelector('.chat-actions');

        optionsTrigger.addEventListener('click', e => {
            e.stopPropagation();
            const isHidden = optionsMenu.classList.contains('hidden');
            
            // Hide all other menus
            document.querySelectorAll('.chat-options-menu').forEach(menu => menu.classList.add('hidden'));
            document.querySelectorAll('.chat-actions').forEach(act => {
                act.style.opacity = ''; // Remove inline opacity
            });
            
            if (isHidden) {
                optionsMenu.classList.remove('hidden');
                actionsDiv.style.opacity = '1'; // Force actions to stay visible
            }
            
            // Keep the chat item from starting a drag when clicking options
            btn.draggable = false;
        });

        btn.querySelector('.delete-chat').addEventListener('click', e => {
            e.stopPropagation();
            optionsMenu.classList.add('hidden');
            actionsDiv.style.opacity = '';
            chatToDeleteId = chat.id;
            deleteChatConfirmModal.classList.remove('hidden');
        });

        btn.querySelector('.rename-chat').addEventListener('click', e => {
            e.stopPropagation();
            optionsMenu.classList.add('hidden');
            actionsDiv.style.opacity = '';
            
            const titleContainer = btn.querySelector('.chat-title-text');
            const currentTitle = chat.title;
            const input = document.createElement('input');
            input.type = 'text';
            input.value = currentTitle;
            input.className = 'w-full bg-black/20 text-white/90 text-[13px] px-1 py-0.5 rounded border border-white/20 focus:outline-none focus:border-indigo-400 pointer-events-auto';
            
            actionsDiv.style.display = 'none';

            const save = () => {
                const newTitle = input.value.trim();
                if (input.dataset.saved) return;
                input.dataset.saved = 'true';

                if (newTitle && newTitle !== currentTitle) {
                    chat.title = newTitle;
                    saveChats();
                }
                renderChatList();
            };

            input.addEventListener('blur', save);
            input.addEventListener('keydown', e => {
                e.stopPropagation();
                if (e.key === 'Enter') save();
                if (e.key === 'Escape') {
                    input.dataset.saved = 'true';
                    input.value = currentTitle;
                    save();
                }
            });
            input.addEventListener('click', e => e.stopPropagation());

            titleContainer.replaceWith(input);
            input.focus();
            input.select();
            btn.draggable = false;
        });

        btn.addEventListener('click', () => {
            globalState.activeChatId = chat.id;
            saveChats();
            renderChatList();
            loadChat(globalState.activeChatId);
            if (window.innerWidth < 768) closeMobileSidebar();
        });

        // Drag and drop events
        btn.addEventListener('dragstart', (e) => {
            draggedChatId = chat.id;
            btn.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        btn.addEventListener('dragend', () => {
            draggedChatId = null;
            btn.classList.remove('dragging');
            document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('drag-over'));
        });

        btn.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (draggedChatId !== chat.id) {
                btn.classList.add('drag-over');
            }
        });

        btn.addEventListener('dragleave', () => {
            btn.classList.remove('drag-over');
        });

        btn.addEventListener('drop', (e) => {
            e.preventDefault();
            btn.classList.remove('drag-over');

            if (draggedChatId && draggedChatId !== chat.id) {
                // Find source and target arrays
                const sourceIndex = globalState.chats.findIndex(c => c.id === draggedChatId);
                const targetIndex = globalState.chats.findIndex(c => c.id === chat.id);

                if (sourceIndex !== -1 && targetIndex !== -1) {
                    // Rearrange array
                    const [draggedChat] = globalState.chats.splice(sourceIndex, 1);
                    globalState.chats.splice(targetIndex, 0, draggedChat);
                    saveChats();
                    renderChatList();
                }
            }
        });

        // Chat actions hover state handled by CSS .group-hover

        chatList.appendChild(btn);
    });
}

function deleteChat(id) {
    globalState.chats = globalState.chats.filter(c => c.id !== id);
    if (globalState.chats.length === 0) {
        createNewChat(true);
    } else {
        if (globalState.activeChatId === id) {
            globalState.activeChatId = globalState.chats[0].id;
            loadChat(globalState.activeChatId);
        }
        saveChats();
        renderChatList();
    }
}

function loadChat(id) {
    const chat = globalState.chats.find(c => c.id === id);
    if (!chat) return;

    // Sync temp mode state from the chat object
    isTemporaryChat = !!chat.isTemporary;
    updateTempChatBtn();

    messagesContainer.innerHTML = '';
    emptyState.classList.toggle('hidden', chat.messages.length > 0);

    if (renderSettings.limitMessages && chat.messages.length > renderSettings.messageLimit) {
        // Start rendering from the last `messageLimit` messages
        const startIndex = chat.messages.length - renderSettings.messageLimit;
        renderOffset[id] = startIndex;
        prependLoadMoreButton(chat, id);
        renderMessageBatch(chat, startIndex, chat.messages.length);
    } else {
        renderOffset[id] = 0;
        renderMessageBatch(chat, 0, chat.messages.length);
    }

    if (isGenerating) {
        if (id === generatingChatId) {
            thinkingEl = null;
            aiMessageEl = null;
            
            if (thinkingBuffer.length > 0) {
                thinkingEl = renderThinkingBlock(true);
                updateThinkingBlock(thinkingEl, thinkingBuffer);
                if (aiMessageBuffer.trim().length > 0) {
                    collapseThinkingBlock(thinkingEl);
                }
            }
            if (aiMessageBuffer.trim().length > 0) {
                typingIndicator.classList.add('hidden');
                aiMessageEl = renderMessage('ai', '');
                renderAIText(aiMessageBuffer, aiMessageEl);
            } else if (thinkingBuffer.length === 0) {
                typingIndicator.classList.remove('hidden');
            }
        } else {
            typingIndicator.classList.add('hidden');
        }
    }

    if (chat.messages.length || (isGenerating && id === generatingChatId)) scrollToBottom();

    promptInput.value = '';
    promptInput.style.height = 'auto';
    pendingFiles = [];
    filePreview.innerHTML = '';
    sendBtn.disabled = true;
}

function renderMessageBatch(chat, startIdx, endIdx) {
    for (let idx = startIdx; idx < endIdx; idx++) {
        const msg = chat.messages[idx];
        if (msg.role === 'ai' && msg.thinkingProcess) {
            const wrap = renderThinkingBlock(false);
            updateThinkingBlock(wrap, msg.thinkingProcess);
        }
        renderMessage(msg.role, msg.content, idx);
    }
}

function prependLoadMoreButton(chat, chatId) {
    const existing = messagesContainer.querySelector('.load-more-btn-wrapper');
    if (existing) existing.remove();

    const startIndex = renderOffset[chatId] || 0;
    if (startIndex <= 0) return;

    const hiddenCount = startIndex;
    const wrapper = document.createElement('div');
    wrapper.className = 'load-more-btn-wrapper flex justify-center py-3';
    wrapper.innerHTML = `
        <button class="load-more-btn flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white/50 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white/80 transition-all">
            <i class="ph ph-arrow-up text-sm"></i>
            Load ${Math.min(renderSettings.messageLimit, hiddenCount)} more message${Math.min(renderSettings.messageLimit, hiddenCount) !== 1 ? 's' : ''}
            <span class="text-white/25">(${hiddenCount} hidden)</span>
        </button>`;

    wrapper.querySelector('.load-more-btn').addEventListener('click', () => {
        const currentStart = renderOffset[chatId] || 0;
        const newStart = Math.max(0, currentStart - renderSettings.messageLimit);
        renderOffset[chatId] = newStart;

        // Save scroll position before prepending so view doesn't jump
        const prevScrollHeight = chatMessages.scrollHeight;

        // Remove old load more button
        wrapper.remove();

        // Prepend new batch before the first existing message
        const fragment = document.createDocumentFragment();
        const tempContainer = document.createElement('div');
        for (let idx = newStart; idx < currentStart; idx++) {
            const msg = chat.messages[idx];
            if (msg.role === 'ai' && msg.thinkingProcess) {
                const thinkWrapper = document.createElement('div');
                thinkWrapper.className = 'w-full thinking-wrapper';
                thinkWrapper.innerHTML = `
                    <div class="flex items-start gap-2.5">
                        <div class="avatar-ai mt-0.5 opacity-60"><i class="ph-fill ph-brain"></i></div>
                        <div class="thinking-block flex-1 min-w-0 mt-0.5" style="min-height: 28px;">
                            <button class="thinking-toggle flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors w-full text-left" style="height: 28px;">
                                <i class="ph ph-caret-down text-[10px] thinking-caret transition-transform duration-200" style="transform: rotate(-90deg);"></i>
                                <span class="thinking-label">Thought process</span>
                            </button>
                            <div class="thinking-content">
                                <div style="min-height: 0;">
                                    <pre class="thinking-text text-white/35 text-xs leading-relaxed whitespace-pre-wrap font-mono" style="margin-top: 8px; margin-bottom: 8px;"></pre>
                                </div>
                            </div>
                        </div>
                    </div>`;
                thinkWrapper.querySelector('.thinking-text').textContent = msg.thinkingProcess;
                thinkWrapper.querySelector('.thinking-toggle').addEventListener('click', () => {
                    const content = thinkWrapper.querySelector('.thinking-content');
                    const caret = thinkWrapper.querySelector('.thinking-caret');
                    content.classList.toggle('thinking-open');
                    caret.style.transform = content.classList.contains('thinking-open') ? '' : 'rotate(-90deg)';
                });
                fragment.appendChild(thinkWrapper);
            }
            // Render message into a temp container, then move it to the fragment
            renderMessage(msg.role, msg.content, idx, tempContainer);
            if (tempContainer.lastElementChild) {
                fragment.appendChild(tempContainer.lastElementChild);
            }
        }

        // Insert fragment at the top of messagesContainer
        messagesContainer.insertBefore(fragment, messagesContainer.firstChild);

        // If there are still hidden messages, prepend a new Load More button
        if (newStart > 0) {
            prependLoadMoreButton(chat, chatId);
        }

        // Restore scroll position so user stays at same visual position
        const newScrollHeight = chatMessages.scrollHeight;
        chatMessages.scrollTop += newScrollHeight - prevScrollHeight;
    });

    messagesContainer.insertBefore(wrapper, messagesContainer.firstChild);
}

// ── Render AI specific text (Markdown + Math) ───────────────────────────────
function renderAIText(content, element) {
    if (!element) return;

    // 1. Parse Standard Markdown
    element.innerHTML = marked.parse(content);

    // 2. Inject copy button header into every code block
    element.querySelectorAll('pre').forEach(pre => {
        // Avoid double-injecting during streaming updates
        if (pre.querySelector('.code-block-header')) return;

        const codeEl = pre.querySelector('code');
        // Detect language from highlight.js class (e.g. "language-python")
        const langClass = codeEl?.className?.match(/language-(\S+)/)?.[1] || '';
        const langLabel = langClass || 'code';

        const header = document.createElement('div');
        header.className = 'code-block-header';
        header.innerHTML = `
            <span class="code-lang-label">${langLabel}</span>
            <button class="code-copy-btn" title="Copy code">
                <i class="ph ph-copy" style="font-size:12px;"></i>
                <span>Copy</span>
            </button>`;

        const copyBtn = header.querySelector('.code-copy-btn');
        copyBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const code = codeEl?.innerText ?? pre.innerText;
            try {
                await navigator.clipboard.writeText(code);
            } catch {
                // Fallback for older browsers
                const ta = document.createElement('textarea');
                ta.value = code;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
            }
            copyBtn.classList.add('copied');
            copyBtn.innerHTML = '<i class="ph ph-check" style="font-size:12px;"></i><span>Copied!</span>';
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.innerHTML = '<i class="ph ph-copy" style="font-size:12px;"></i><span>Copy</span>';
            }, 2000);
        });

        pre.insertBefore(header, pre.firstChild);
    });

    // 3. Render Math (KaTeX)
    try {
        renderMathInElement(element, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false },
                { left: '\\(', right: '\\)', display: false },
                { left: '\\[', right: '\\]', display: true }
            ],
            throwOnError: false
        });
    } catch (err) {
        console.error('[KaTeX Error]', err);
    }
}

// ── Render a message bubble ───────────────────────────────────────────────────
function renderMessage(role, content, index = null, targetContainer = null) {
    const container = targetContainer || messagesContainer;
    const wrapper = document.createElement('div');
    wrapper.className = 'w-full message-animate';

    const isUser = role === 'user';

    if (isUser) {
        wrapper.innerHTML = `
            <div class="flex justify-end items-start gap-2.5 group">
                <div class="flex flex-col items-end gap-1 max-w-[85%]">
                    <div class="user-bubble">
                        <div class="text-sm leading-relaxed whitespace-pre-wrap">${escapeHtml(content)}</div>
                    </div>
                    <div class="flex flex-row gap-2 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                        ${index !== null ? `
                        <button class="msg-action-btn edit-msg-btn" title="Edit message">
                            <i class="ph ph-pencil-simple"></i>
                        </button>` : ''}
                        <button class="msg-action-btn copy-msg-btn" title="Copy message">
                            <i class="ph ph-copy"></i>
                        </button>
                    </div>
                </div>
                <div class="avatar-user"><i class="ph-fill ph-user"></i></div>
            </div>`;

        if (index !== null) {
            wrapper.querySelector('.edit-msg-btn')?.addEventListener('click', () => editMessage(index, wrapper));
        }
        wrapper.querySelector('.copy-msg-btn').addEventListener('click', () => copyToClipboard(content));
    } else {
        wrapper.innerHTML = `
            <div class="flex items-start gap-2.5 group">
                <div class="avatar-ai mt-0.5"><i class="ph-fill ph-sparkle"></i></div>
                <div class="flex flex-col items-start gap-1 w-full overflow-hidden">
                    <div class="ai-bubble markdown-body content-inner w-full"></div>
                    <div class="flex flex-row gap-2 opacity-0 group-hover:opacity-100 transition-opacity pl-1">
                        <button class="msg-action-btn copy-msg-btn" title="Copy response">
                            <i class="ph ph-copy"></i>
                        </button>
                    </div>
                </div>
            </div>`;

        const aiBody = wrapper.querySelector('.content-inner');
        renderAIText(content, aiBody);

        wrapper.querySelector('.copy-msg-btn').addEventListener('click', () => copyToClipboard(content));
    }

    container.appendChild(wrapper);
    return wrapper.querySelector('.content-inner');
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!', 'info');
    } catch (err) {
        showToast('Failed to copy', 'error');
    }
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── Edit message (BUG FIX) ────────────────────────────────────────────────────
function editMessage(index, wrapper) {
    const chat = globalState.chats.find(c => c.id === globalState.activeChatId);
    if (!chat || isGenerating) return;

    const rawText = chat.messages[index].rawText || chat.messages[index].content;

    const bubble = wrapper.querySelector('.user-bubble');
    const originalTextDiv = bubble.querySelector('div');
    const actionsDiv = wrapper.querySelector('.flex-row.gap-2.opacity-0');

    // Hide original viewing UI
    originalTextDiv.style.display = 'none';
    actionsDiv.style.display = 'none';
    wrapper.classList.remove('group');

    // Widen bubble for editing
    const oldWidth = bubble.style.width;
    const oldMinWidth = bubble.style.minWidth;
    bubble.style.width = '100%';
    bubble.style.minWidth = '280px';

    const editContainer = document.createElement('div');
    editContainer.className = 'flex flex-col gap-2 w-full mt-1';

    const textarea = document.createElement('textarea');
    textarea.className = 'w-full bg-black/10 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-400 resize-none custom-scrollbar';
    textarea.value = rawText;

    const btnRow = document.createElement('div');
    btnRow.className = 'flex justify-end gap-2 mt-1';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors';
    cancelBtn.textContent = 'Cancel';

    const sendBtnUI = document.createElement('button');
    sendBtnUI.className = 'px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500 text-white hover:bg-indigo-400 transition-colors shadow-sm';
    sendBtnUI.textContent = 'Save & Submit';

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(sendBtnUI);
    editContainer.appendChild(textarea);
    editContainer.appendChild(btnRow);
    bubble.appendChild(editContainer);

    // Auto-resize textarea
    requestAnimationFrame(() => {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight + 2) + 'px';
        textarea.focus();
        textarea.selectionStart = textarea.value.length;
    });

    textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight + 2) + 'px';
    });

    // Also submit on Enter without Shift
    textarea.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendBtnUI.click();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            cancelBtn.click();
        }
    });

    const cleanup = () => {
        if (bubble.contains(editContainer)) {
            bubble.removeChild(editContainer);
        }
        originalTextDiv.style.display = '';
        actionsDiv.style.display = '';
        wrapper.classList.add('group');
        bubble.style.width = oldWidth;
        bubble.style.minWidth = oldMinWidth;
    };

    cancelBtn.addEventListener('click', cleanup);

    sendBtnUI.addEventListener('click', () => {
        const newText = textarea.value.trim();
        if (!newText) return;

        // Re-fetch chat dynamically in case globalState was updated via WebSocket
        const activeChat = globalState.chats.find(c => c.id === globalState.activeChatId);
        if (!activeChat) return;

        activeChat.messages = activeChat.messages.slice(0, index);
        saveChats();

        loadChat(globalState.activeChatId);

        promptInput.value = newText;
        promptInput.style.height = 'auto';
        promptInput.style.height = promptInput.scrollHeight + 'px';
        sendMessage();
    });
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ── Thinking block helpers ─────────────────────────────────────────────────────
function renderThinkingBlock(isStreaming = true) {
    const wrapper = document.createElement('div');
    wrapper.className = 'w-full message-animate thinking-wrapper';

    const caretTransform = isStreaming ? '' : 'style="transform: rotate(-90deg);"';
    const labelText = isStreaming ? 'Thinking…' : 'Thought process';
    const spinnerHtml = isStreaming ? '<span class="thinking-spinner ml-1"></span>' : '';
    const contentClass = isStreaming ? 'thinking-open' : '';

    wrapper.innerHTML = `
        <div class="flex items-start gap-2.5">
            <div class="avatar-ai mt-0.5 opacity-60"><i class="ph-fill ph-brain"></i></div>
            <div class="thinking-block flex-1 min-w-0 mt-0.5" style="min-height: 28px;">
                <button class="thinking-toggle flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors w-full text-left" style="height: 28px;">
                    <i class="ph ph-caret-down text-[10px] thinking-caret transition-transform duration-200" ${caretTransform}></i>
                    <span class="thinking-label">${labelText}</span>
                    ${spinnerHtml}
                </button>
                <div class="thinking-content ${contentClass}">
                    <div style="min-height: 0;">
                        <pre class="thinking-text text-white/35 text-xs leading-relaxed whitespace-pre-wrap font-mono" style="margin-top: 8px; margin-bottom: 8px;"></pre>
                    </div>
                </div>
            </div>
        </div>`;

    wrapper.querySelector('.thinking-toggle').addEventListener('click', () => {
        const content = wrapper.querySelector('.thinking-content');
        const caret = wrapper.querySelector('.thinking-caret');
        content.classList.toggle('thinking-open');
        caret.style.transform = content.classList.contains('thinking-open') ? '' : 'rotate(-90deg)';
    });

    messagesContainer.appendChild(wrapper);
    return wrapper;
}

function updateThinkingBlock(wrapper, text) {
    const pre = wrapper.querySelector('.thinking-text');
    if (pre) pre.textContent = text;
    scrollToBottom();
}

function collapseThinkingBlock(wrapper) {
    const content = wrapper.querySelector('.thinking-content');
    const caret = wrapper.querySelector('.thinking-caret');
    const label = wrapper.querySelector('.thinking-label');
    const spinner = wrapper.querySelector('.thinking-spinner');
    if (content) content.classList.remove('thinking-open');
    if (caret) caret.style.transform = 'rotate(-90deg)';
    if (label) label.textContent = 'Thought process';
    if (spinner) spinner.remove();
}

// ── WebSocket ─────────────────────────────────────────────────────────────────
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const port = window.location.port || '4000';
    const host = window.location.hostname || 'localhost';

    ws = new WebSocket(`${protocol}//${host}:${port}`);

    ws.onopen = () => console.log('[WS] connected');

    ws.onmessage = event => {
        const data = JSON.parse(event.data);

        if (data.type === 'state_update') {
            const prevSessionActive = globalState.sessionActive;

            // If we have a temporary chat active, the backend doesn't know about it.
            // Preserve our local chats/activeChatId so the temp chat isn't wiped.
            const preserveLocalChats = isTemporaryChat;
            const localChats = globalState.chats;
            const localActiveChatId = globalState.activeChatId;
            
            const prevActiveChat = globalState.chats.find(c => c.id === localActiveChatId);
            const prevUpdatedAt = prevActiveChat ? prevActiveChat.updatedAt : null;

            globalState = { ...globalState, ...data.state };

            if (preserveLocalChats) {
                globalState.chats = localChats;
                globalState.activeChatId = localActiveChatId;
            }

            if (!isGenerating) {
                renderChatList();
                if (prevSessionActive !== globalState.sessionActive) applyStateToUI();

                if (globalState.activeChatId && !globalState.chats.find(c => c.id === globalState.activeChatId)) {
                    // Chat got deleted globally
                    globalState.activeChatId = globalState.chats[0]?.id;
                    applyStateToUI();
                } else if (globalState.activeChatId) {
                    const newActiveChat = globalState.chats.find(c => c.id === globalState.activeChatId);
                    const newUpdatedAt = newActiveChat ? newActiveChat.updatedAt : null;
                    if (localActiveChatId !== globalState.activeChatId || prevUpdatedAt !== newUpdatedAt) {
                        loadChat(globalState.activeChatId);
                    }
                }
            }
        } else if (data.type === 'thinking') {
            thinkingBuffer += data.chunk;
            if (globalState.activeChatId === generatingChatId) {
                if (!thinkingEl) {
                    thinkingEl = renderThinkingBlock();
                }
                updateThinkingBlock(thinkingEl, thinkingBuffer);
                scrollToBottom();
            }
        } else if (data.type === 'stream') {
            // First content token — collapse the thinking block
            if (globalState.activeChatId === generatingChatId) {
                if (thinkingEl && !aiMessageEl) {
                    collapseThinkingBlock(thinkingEl);
                }
            }

            aiMessageBuffer += data.chunk;

            if (globalState.activeChatId === generatingChatId) {
                if (!aiMessageEl && aiMessageBuffer.trim().length > 0) {
                    typingIndicator.classList.add('hidden');
                    aiMessageEl = renderMessage('ai', '');
                }

                if (aiMessageEl) {
                    renderAIText(aiMessageBuffer, aiMessageEl);
                    scrollToBottom();
                }
            }
        } else if (data.type === 'done' || data.type === 'stopped') {
            finalizeGeneration();
        } else if (data.type === 'error') {
            console.error('[AI Error]', data.message);
            aiMessageBuffer += `\n\n**Error:** ${data.message}`;

            if (globalState.activeChatId === generatingChatId) {
                if (!aiMessageEl) {
                    typingIndicator.classList.add('hidden');
                    aiMessageEl = renderMessage('ai', '');
                }
                renderAIText(aiMessageBuffer, aiMessageEl);
            }
            finalizeGeneration();
        }
    };

    ws.onclose = () => {
        console.log('[WS] disconnected — reconnecting in 3s');
        setTimeout(connectWebSocket, 3000);
    };
}

// ── Send message ──────────────────────────────────────────────────────────────
function sendMessage() {
    const rawText = promptInput.value.trim();
    if (!rawText && pendingFiles.length === 0) return;

    // Build context from files
    let fileContext = '';
    pendingFiles.forEach(f => {
        if (f.type === 'image') {
            fileContext += `\n\n[Attached image: ${f.name}]`;
        } else {
            fileContext += `\n\n--- FILE: ${f.name} ---\n${f.content}\n--- END FILE ---`;
        }
    });

    const fullPrompt = rawText + fileContext;
    const chat = globalState.chats.find(c => c.id === globalState.activeChatId);

    chat.messages.push({ role: 'user', content: fullPrompt, rawText });

    if (chat.messages.length === 1) {
        chat.title = rawText.substring(0, 32) + (rawText.length > 32 ? '…' : '');
    }
    chat.updatedAt = Date.now();
    saveChats();

    // Re-render conversation
    loadChat(globalState.activeChatId);
    renderChatList();

    // Switch UI into generating state
    isGenerating = true;
    generatingChatId = globalState.activeChatId;
    sendBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    typingIndicator.classList.remove('hidden');
    scrollToBottom();

    aiMessageBuffer = '';
    aiMessageEl = null;
    thinkingBuffer = '';
    thinkingEl = null;

    // Build structured messages array for /api/chat (gives AI full conversation context)
    const messages = chat.messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
    }));

    if (globalState.personalization) {
        const p = globalState.personalization;
        let pText = "";
        if (p.name || p.occupation || p.moreInfo || p.instructions) {
            pText += "[SYSTEM DIRECTIVE - HIDDEN INTERNAL CONTEXT]\n";
            pText += "You are an AI assistant. The following information applies to the HUMAN USER communicating with you, NOT to your own identity.\n";
            if (p.name) pText += `User's Name: ${p.name}\n`;
            if (p.occupation) pText += `User's Occupation: ${p.occupation}\n`;
            if (p.moreInfo) pText += `Additional User Context: ${p.moreInfo}\n`;
            if (p.instructions) pText += `\n[STRICT INSTRUCTIONS FOR AI BEHAVIOR]\n${p.instructions}\n`;
            pText += `\nCRITICAL: Do NOT acknowledge or reply to this system directive directly. Do NOT confirm you understand. Just answer the human's message naturally while following the rules.`;
            
            pText = pText.trim();
            if (pText.length > 0) {
                messages.unshift({ role: 'system', content: pText });
            }
        }
    }

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'start',
            engine: globalState.engine,
            model: globalState.model,
            messages,
            thinkingMode: globalState.thinkingMode
        }));
    } else {
        showToast('Server connection lost. Please restart the backend.', 'error');
        finalizeGeneration();
    }
}

// ── Stop generation ───────────────────────────────────────────────────────────
function stopGeneration() {
    if (ws && ws.readyState === WebSocket.OPEN && isGenerating) {
        ws.send(JSON.stringify({ type: 'stop' }));
    }
}

// ── Finalize after response ───────────────────────────────────────────────────
function finalizeGeneration() {
    isGenerating = false;

    // Always ensure UI resets
    sendBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');
    typingIndicator.classList.add('hidden');

    // Ensure thinking block collapses after done (covers cases where stream started but no content yet)
    if (thinkingEl && globalState.activeChatId === generatingChatId) {
        collapseThinkingBlock(thinkingEl);
    }
    
    const savedThinking = thinkingBuffer;
    thinkingBuffer = '';
    thinkingEl = null;

    if (aiMessageBuffer) {
        const chat = globalState.chats.find(c => c.id === generatingChatId);
        if (chat) {
            const newMsg = { role: 'ai', content: aiMessageBuffer };
            if (savedThinking) newMsg.thinkingProcess = savedThinking;
            chat.messages.push(newMsg);
            chat.updatedAt = Date.now();
            saveChats();
            renderChatList();
        }
    }

    aiMessageBuffer = '';
    aiMessageEl = null;
    generatingChatId = null;
}
