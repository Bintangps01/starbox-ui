const setupPage = document.getElementById('setupPage');
const appContainer = document.getElementById('appContainer');
const setupProceedBtn = document.getElementById('setupProceedBtn');
const activeModelLabel = document.getElementById('activeModelLabel');
const activeEngineIcon = document.getElementById('activeEngineIcon');
const unloadModelBtn = document.getElementById('unloadModelBtn');
const newChatBtn = document.getElementById('newChatBtn');
const chatList = document.getElementById('chatList');
const thinkingBtn = document.getElementById('thinkingBtn');
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
const miniSidebar = document.getElementById('miniSidebar');
const collapseSidebarBtn = document.getElementById('collapseSidebarBtn');
const expandSidebarBtn = document.getElementById('expandSidebarBtn');
const miniNewChatBtn = document.getElementById('miniNewChatBtn');
const miniSettingsBtn = document.getElementById('miniSettingsBtn');
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
const importChatBtn = document.getElementById('importChatBtn');
const importChatFileInput = document.getElementById('importChatFileInput');

const deleteFolderConfirmModal = document.getElementById('deleteFolderConfirmModal');
const deleteFolderCancelBtn = document.getElementById('deleteFolderCancelBtn');
const deleteFolderProceedBtn = document.getElementById('deleteFolderProceedBtn');
const deleteFolderChatsCheckbox = document.getElementById('deleteFolderChatsCheckbox');

const imageLightbox = document.getElementById('imageLightbox');
const lightboxImage = document.getElementById('lightboxImage');
const dragOverlay = document.getElementById('dragOverlay');

const persName = document.getElementById('persName');
const persOccupation = document.getElementById('persOccupation');
const persMoreInfo = document.getElementById('persMoreInfo');
const persInstructions = document.getElementById('persInstructions');

// Web Search DOM refs
const webSearchToggle = document.getElementById('webSearchToggle');
const webSearchKeyRow = document.getElementById('webSearchKeyRow');
const webSearchApiKey = document.getElementById('webSearchApiKey');
const webSearchKeyRevealBtn = document.getElementById('webSearchKeyRevealBtn');
const webSearchKeyRevealIcon = document.getElementById('webSearchKeyRevealIcon');
const webSearchKeySaveBtn = document.getElementById('webSearchKeySaveBtn');
const webSearchBtn = document.getElementById('webSearchBtn');

// Model Idle Timeout DOM refs
const modelIdleTimeoutToggle = document.getElementById('modelIdleTimeoutToggle');
const modelIdleTimeoutRow   = document.getElementById('modelIdleTimeoutRow');
const modelIdleTimeoutInput = document.getElementById('modelIdleTimeoutInput');
const modelIdleTimeoutMinus = document.getElementById('modelIdleTimeoutMinus');
const modelIdleTimeoutPlus  = document.getElementById('modelIdleTimeoutPlus');
const modelIdleRestartWarning = document.getElementById('modelIdleRestartWarning');

let chatSearchQuery = '';
let draggedChatId = null;
let chatToDeleteId = null;
let folderToDeleteId = null;
let isTemporaryChat = false; // When true, active chat is not persisted to backend
let isWebSearchActive = false; // Per-send toggle: web search ON for the next message only
let isUserScrolledUp = false;

// Initial state caching for restart warnings is now handled via appliedModelIdleTimeout vars in globalState
if (chatMessages) {
    chatMessages.addEventListener('scroll', () => {
        const distanceToBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight;
        isUserScrolledUp = distanceToBottom > 15;
    });
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.chat-actions') && !e.target.closest('.folder-actions')) {
        document.querySelectorAll('.chat-options-menu, .folder-options-menu').forEach(m => m.classList.add('hidden'));
        document.querySelectorAll('.chat-actions, .folder-actions').forEach(a => a.style.opacity = '');
        // Restore drag state if closed, skipping items actively being renamed
        document.querySelectorAll('.chat-item').forEach(btn => {
            if (!btn.querySelector('input')) btn.draggable = true;
        });
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
            div.title = label; // show full name on hover when truncated
            if (icon) {
                const iconEl = document.createElement('i');
                iconEl.className = icon;
                iconEl.style.flexShrink = '0';
                const textNode = document.createTextNode(' ' + label);
                div.appendChild(iconEl);
                div.appendChild(textNode);
            } else {
                div.textContent = label;
            }
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
    folders: [],
    chats: []
};
let availableModels = { ollama: [], claude: [] };
let isGenerating = false;
let generatingChatId = null;
let pendingFiles = [];   // [{ type, name, content }] — text or image
let ws = null;
let aiMessageBuffer = '';
let chatDOMCache = {};   // { [chatId]: DocumentFragment } — cached rendered messages
let aiMessageEl = null;  // DOM element to stream into
let thinkingBuffer = '';
let thinkingEl = null;  // DOM element for live thinking block
let thinkingStartTime = 0;
let thinkingDurationMs = 0;
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

        // Ensure folders array exists for backward compatibility
        if (!globalState.folders) globalState.folders = [];

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

    // Apply web search settings
    applyWebSearchSettingsToUI();

    // Apply model idle timeout setting
    if (modelIdleTimeoutToggle) {
        const enabled = globalState.modelIdleTimeoutEnabled !== false; // default true
        modelIdleTimeoutToggle.checked = enabled;
        if (modelIdleTimeoutRow) modelIdleTimeoutRow.classList.toggle('hidden', !enabled);
    }
    if (modelIdleTimeoutInput) {
        const saved = typeof globalState.modelIdleTimeout === 'number' ? globalState.modelIdleTimeout : 5;
        modelIdleTimeoutInput.value = Math.max(1, saved);
    }
    
    // Evaluate if the warning icon needs to show
    if (modelIdleRestartWarning) {
        if (!globalState.sessionActive) {
            modelIdleRestartWarning.classList.add('hidden');
        } else {
            const currentEnabled = modelIdleTimeoutToggle ? modelIdleTimeoutToggle.checked : true;
            const currentValue = modelIdleTimeoutInput ? (parseInt(modelIdleTimeoutInput.value, 10) || 5) : 5;
            
            const appliedEnabled = globalState.appliedModelIdleTimeoutEnabled !== null && globalState.appliedModelIdleTimeoutEnabled !== undefined ? globalState.appliedModelIdleTimeoutEnabled : globalState.modelIdleTimeoutEnabled;
            const appliedValue = globalState.appliedModelIdleTimeout !== null && globalState.appliedModelIdleTimeout !== undefined ? globalState.appliedModelIdleTimeout : globalState.modelIdleTimeout;

            if (currentEnabled !== appliedEnabled || (currentEnabled && currentValue !== appliedValue)) {
                modelIdleRestartWarning.classList.remove('hidden');
            } else {
                modelIdleRestartWarning.classList.add('hidden');
            }
        }
    }

    if (globalState.sessionActive && globalState.model) {
        if (setupPage) setupPage.classList.add('hidden');
        if (appContainer) appContainer.classList.remove('hidden');

        if (activeModelLabel) activeModelLabel.textContent = globalState.model;
        if (activeEngineIcon) activeEngineIcon.className = globalState.engine === 'ollama' ? 'ph ph-cpu text-xs text-indigo-400' : 'ph ph-terminal text-xs text-violet-400';
        if (thinkingBtn) thinkingBtn.classList.toggle('active', !!globalState.thinkingMode);

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
                shutdownServerBtn.classList.replace('hover:bg-red-500/20', 'cursor-not-allowed');
                showToast('Server has been shut down. You can close this window.', 'info');
            } catch (e) {
                shutdownServerBtn.innerHTML = '<i class="ph ph-check-circle text-lg"></i> Server Stopped';
                shutdownServerBtn.classList.replace('text-red-400', 'text-green-400');
                shutdownServerBtn.classList.replace('bg-red-500/10', 'bg-green-500/10');
                shutdownServerBtn.classList.replace('border-red-500/20', 'border-green-500/20');
                shutdownServerBtn.classList.replace('hover:bg-red-500/20', 'cursor-not-allowed');
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


    if (deleteFolderCancelBtn) {
        deleteFolderCancelBtn.addEventListener('click', () => {
            if (deleteFolderConfirmModal) deleteFolderConfirmModal.classList.add('hidden');
            folderToDeleteId = null;
        });
    }
    if (deleteFolderProceedBtn) {
        deleteFolderProceedBtn.addEventListener('click', () => {
            if (folderToDeleteId) {
                const deleteChats = deleteFolderChatsCheckbox ? deleteFolderChatsCheckbox.checked : false;
                deleteFolder(folderToDeleteId, deleteChats);
            }
            if (deleteFolderConfirmModal) deleteFolderConfirmModal.classList.add('hidden');
            folderToDeleteId = null;
        });
    }

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

    // Import Chat — clicking the button re-triggers the hidden file input
    if (importChatBtn) {
        importChatBtn.addEventListener('click', () => {
            if (importChatFileInput) importChatFileInput.click();
        });
    }
    if (importChatFileInput) {
        importChatFileInput.addEventListener('change', e => {
            const file = e.target.files?.[0];
            if (file) importChat(file);
            // Reset so the same file can be re-imported if needed
            importChatFileInput.value = '';
        });
    }

    if (settingsBtn) settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    const setupSettingsBtn = document.getElementById('setupSettingsBtn');
    if (setupSettingsBtn) setupSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
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
        chatDOMCache = {}; // invalidate all caches
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

    if (thinkingBtn) {
        thinkingBtn.addEventListener('click', () => {
            const newState = !globalState.thinkingMode;
            updateState({ thinkingMode: newState });
            thinkingBtn.classList.toggle('active', newState);
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

            await updateState({ 
                sessionActive: true, 
                engine, 
                model,
                appliedModelIdleTimeoutEnabled: globalState.modelIdleTimeoutEnabled,
                appliedModelIdleTimeout: globalState.modelIdleTimeout 
            });

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
            // Show loading state
            const originalContent = stopSessionProceedBtn.innerHTML;
            stopSessionProceedBtn.innerHTML = '<div class="flex items-center justify-center gap-2"><i class="ph ph-spinner animate-spin text-lg"></i> <span>Unloading...</span></div>';
            stopSessionProceedBtn.disabled = true;
            stopSessionCancelBtn.disabled = true;

            try {
                const port = window.location.port || '4000';
                await fetch(`http://${window.location.hostname}:${port}/api/unload-model`, { method: 'POST' });
            } catch (e) {
                console.error('Error unloading:', e);
            }
            
            // Restore button state and close modal
            stopSessionProceedBtn.innerHTML = originalContent;
            stopSessionProceedBtn.disabled = false;
            stopSessionCancelBtn.disabled = false;
            stopSessionConfirmModal.classList.add('hidden');

            // Update local state immediately for fast feedback
            globalState.sessionActive = false;
            applyStateToUI();
        });
    }

    // Desktop sidebar collapse / expand
    function collapseDesktopSidebar() {
        sidebar.classList.add('!w-16', 'opacity-0', 'overflow-hidden');
        setTimeout(() => {
            sidebar.classList.remove('md:flex');
            sidebar.classList.add('md:hidden');
            // Reset state for when it's next expanded
            sidebar.classList.remove('!w-16', 'opacity-0', 'overflow-hidden');
            
            if (miniSidebar) {
                miniSidebar.classList.remove('hidden');
                miniSidebar.classList.add('flex', 'opacity-0');
                
                // Force reflow
                void miniSidebar.offsetWidth;
                miniSidebar.classList.remove('opacity-0');
            }
        }, 300);
    }
    
    function expandDesktopSidebar() {
        if (miniSidebar) {
            miniSidebar.classList.add('opacity-0');
        }
        setTimeout(() => {
            if (miniSidebar) {
                miniSidebar.classList.add('hidden');
                miniSidebar.classList.remove('flex', 'opacity-0');
            }
            
            sidebar.classList.remove('md:hidden');
            sidebar.classList.add('md:flex', '!w-16', 'opacity-0', 'overflow-hidden');
            
            // Force reflow
            void sidebar.offsetWidth;
            
            sidebar.classList.remove('!w-16', 'opacity-0');
            setTimeout(() => {
                sidebar.classList.remove('overflow-hidden');
            }, 300);
        }, 150); // fast fade-out of mini sidebar
    }

    if (collapseSidebarBtn) collapseSidebarBtn.addEventListener('click', collapseDesktopSidebar);
    if (expandSidebarBtn)   expandSidebarBtn.addEventListener('click', expandDesktopSidebar);

    // Mini sidebar action buttons
    if (miniNewChatBtn) miniNewChatBtn.addEventListener('click', () => { if (newChatBtn) newChatBtn.click(); });
    if (miniSettingsBtn) miniSettingsBtn.addEventListener('click', () => { if (settingsBtn) settingsBtn.click(); });

    // Mobile sidebar toggle (hamburger — kept for mobile)
    if (toggleSidebarBtn) toggleSidebarBtn.addEventListener('click', () => {
        if (window.innerWidth < 768) {
            sidebar.classList.remove('hidden');
            sidebar.classList.add('flex', 'fixed', 'inset-y-0', 'left-0');
            sidebarOverlay.classList.remove('hidden');
            
            // Force reflow for animation
            void sidebar.offsetWidth;
            
            sidebar.classList.remove('-translate-x-full');
            sidebar.classList.add('translate-x-0');
            sidebarOverlay.classList.remove('opacity-0');
            sidebarOverlay.classList.add('opacity-100');
        } else {
            // Desktop fallback
            if (sidebar.classList.contains('md:flex')) {
                collapseDesktopSidebar();
            } else {
                expandDesktopSidebar();
            }
        }
    });
    [closeSidebarBtn, sidebarOverlay].forEach(el => {
        if (el) el.addEventListener('click', closeMobileSidebar);
    });

    // Lightbox
    if (imageLightbox) {
        imageLightbox.addEventListener('click', (e) => {
            if (e.target === imageLightbox) closeLightbox();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && imageLightbox && !imageLightbox.classList.contains('hidden')) {
            closeLightbox();
        }
    });

    // Drag and drop for files
    let dragCounter = 0;

    document.addEventListener('dragenter', (e) => {
        if (window.innerWidth < 768) return;
        e.preventDefault();
        if (!e.dataTransfer || !e.dataTransfer.types || !Array.from(e.dataTransfer.types).includes('Files')) return;
        if (!globalState.sessionActive) return;
        dragCounter++;
        if (dragCounter === 1 && dragOverlay) {
            dragOverlay.classList.remove('hidden');
            // Force reflow
            void dragOverlay.offsetWidth;
            dragOverlay.classList.remove('opacity-0');
        }
    });

    document.addEventListener('dragleave', (e) => {
        if (window.innerWidth < 768) return;
        e.preventDefault();
        if (!e.dataTransfer || !e.dataTransfer.types || !Array.from(e.dataTransfer.types).includes('Files')) return;
        if (!globalState.sessionActive) return;
        dragCounter--;
        if (dragCounter === 0 && dragOverlay) {
            dragOverlay.classList.add('opacity-0');
            setTimeout(() => {
                if (dragCounter === 0) dragOverlay.classList.add('hidden');
            }, 300);
        }
    });

    document.addEventListener('dragover', (e) => {
        if (window.innerWidth < 768) return;
        e.preventDefault();
    });

    document.addEventListener('drop', (e) => {
        if (window.innerWidth < 768) return;
        e.preventDefault();
        if (!e.dataTransfer || !e.dataTransfer.types || !Array.from(e.dataTransfer.types).includes('Files')) return;
        dragCounter = 0;
        if (dragOverlay) {
            dragOverlay.classList.add('opacity-0');
            setTimeout(() => dragOverlay.classList.add('hidden'), 300);
        }
        
        if (!globalState.sessionActive) return;

        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFilesForUpload(e.dataTransfer.files);
        }
    });

    // Paste files from clipboard
    document.addEventListener('paste', (e) => {
        if (!globalState.sessionActive) return;

        const items = e.clipboardData?.items;
        if (!items) return;

        const filesToUpload = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                const file = items[i].getAsFile();
                if (file) filesToUpload.push(file);
            }
        }

        if (filesToUpload.length > 0) {
            processFilesForUpload(filesToUpload);
        }
    });
    // ── Web Search settings ──
    if (webSearchToggle) {
        webSearchToggle.addEventListener('change', () => {
            const enabled = webSearchToggle.checked;
            if (webSearchKeyRow) webSearchKeyRow.classList.toggle('hidden', !enabled);
            updateWebSearchBtnVisibility();
            saveWebSearchSettings();
        });
    }

    if (webSearchKeyRevealBtn && webSearchApiKey) {
        webSearchKeyRevealBtn.addEventListener('click', () => {
            const isMasked = webSearchApiKey.classList.contains('masked-input');
            webSearchApiKey.classList.toggle('masked-input', !isMasked);
            if (webSearchKeyRevealIcon) {
                webSearchKeyRevealIcon.className = isMasked
                    ? 'ph ph-eye text-sm'        // now revealed — show plain-eye to re-mask
                    : 'ph ph-eye-slash text-sm'; // now masked   — show slashed-eye to reveal
            }
        });
    }

    if (webSearchKeySaveBtn && webSearchApiKey) {
        webSearchKeySaveBtn.addEventListener('click', saveWebSearchSettings);
        // Also save on Enter
        webSearchApiKey.addEventListener('keydown', e => {
            if (e.key === 'Enter') saveWebSearchSettings();
        });
    }

    if (webSearchBtn) {
        webSearchBtn.addEventListener('click', () => {
            isWebSearchActive = !isWebSearchActive;
            webSearchBtn.classList.toggle('active', isWebSearchActive);
        });
    }

    function checkIdleTimeoutChanged() {
        if (!modelIdleRestartWarning) return;
        
        // If session hasn't started yet, no restart is required
        if (!globalState.sessionActive) {
            modelIdleRestartWarning.classList.add('hidden');
            return;
        }

        const currentEnabled = modelIdleTimeoutToggle ? modelIdleTimeoutToggle.checked : true;
        const currentValue = modelIdleTimeoutInput ? (parseInt(modelIdleTimeoutInput.value, 10) || 5) : 5;
        
        const appliedEnabled = globalState.appliedModelIdleTimeoutEnabled !== null && globalState.appliedModelIdleTimeoutEnabled !== undefined ? globalState.appliedModelIdleTimeoutEnabled : globalState.modelIdleTimeoutEnabled;
        const appliedValue = globalState.appliedModelIdleTimeout !== null && globalState.appliedModelIdleTimeout !== undefined ? globalState.appliedModelIdleTimeout : globalState.modelIdleTimeout;

        // Show warning if enabled state changed, OR (if it's currently enabled) the minute value changed
        if (currentEnabled !== appliedEnabled || (currentEnabled && currentValue !== appliedValue)) {
            modelIdleRestartWarning.classList.remove('hidden');
        } else {
            modelIdleRestartWarning.classList.add('hidden');
        }
    }

    function saveIdleTimeout() {
        const val = Math.max(1, Math.min(120, parseInt(modelIdleTimeoutInput.value, 10) || 5));
        modelIdleTimeoutInput.value = val;
        updateState({ modelIdleTimeout: val });
        checkIdleTimeoutChanged();
    }

    if (modelIdleTimeoutToggle) {
        modelIdleTimeoutToggle.addEventListener('change', () => {
            const enabled = modelIdleTimeoutToggle.checked;
            if (modelIdleTimeoutRow) modelIdleTimeoutRow.classList.toggle('hidden', !enabled);
            updateState({ modelIdleTimeoutEnabled: enabled });
            checkIdleTimeoutChanged();
        });
    }

    if (modelIdleTimeoutMinus) {
        modelIdleTimeoutMinus.addEventListener('click', () => {
            if (!modelIdleTimeoutInput) return;
            const cur = parseInt(modelIdleTimeoutInput.value, 10) || 5;
            modelIdleTimeoutInput.value = Math.max(1, cur - 1);
            saveIdleTimeout();
        });
    }

    if (modelIdleTimeoutPlus) {
        modelIdleTimeoutPlus.addEventListener('click', () => {
            if (!modelIdleTimeoutInput) return;
            const cur = parseInt(modelIdleTimeoutInput.value, 10) || 5;
            modelIdleTimeoutInput.value = Math.min(120, cur + 1);
            saveIdleTimeout();
        });
    }

    if (modelIdleTimeoutInput) {
        modelIdleTimeoutInput.addEventListener('change', saveIdleTimeout);
    }
}

// ── Web Search helpers ────────────────────────────────────────────────────────
function applyWebSearchSettingsToUI() {
    // Support legacy searchSettings key in state.json as fallback
    const ws = globalState.webSearch || globalState.searchSettings || {};
    const enabled = !!ws.enabled;
    const key = ws.tavilyApiKey || '';

    if (webSearchToggle) webSearchToggle.checked = enabled;
    if (webSearchKeyRow) webSearchKeyRow.classList.toggle('hidden', !enabled);
    if (webSearchApiKey && key) webSearchApiKey.value = key;
    updateWebSearchBtnVisibility();
}

function updateWebSearchBtnVisibility() {
    // Show the per-send button only when web search is turned on in settings
    const enabled = webSearchToggle ? webSearchToggle.checked : false;
    if (webSearchBtn) {
        webSearchBtn.classList.toggle('hidden', !enabled);
        if (!enabled) {
            isWebSearchActive = false;
            webSearchBtn.classList.remove('active');
        }
    }
}

function saveWebSearchSettings() {
    const enabled = webSearchToggle ? webSearchToggle.checked : false;
    const key = webSearchApiKey ? webSearchApiKey.value.trim() : '';

    // Flash the Save button green to confirm
    if (webSearchKeySaveBtn) {
        const original = webSearchKeySaveBtn.textContent;
        webSearchKeySaveBtn.textContent = 'Saved!';
        webSearchKeySaveBtn.classList.replace('text-indigo-400', 'text-emerald-400');
        setTimeout(() => {
            webSearchKeySaveBtn.textContent = original;
            webSearchKeySaveBtn.classList.replace('text-emerald-400', 'text-indigo-400');
        }, 1500);
    }

    updateState({ webSearch: { enabled, tavilyApiKey: key } });
    updateWebSearchBtnVisibility();
}

function openLightbox(src) {
    if (!src || !imageLightbox) return;
    lightboxImage.src = src;
    imageLightbox.classList.remove('hidden');
    // Force reflow
    void imageLightbox.offsetWidth;
    imageLightbox.classList.remove('opacity-0');
    lightboxImage.classList.remove('scale-95');
    lightboxImage.classList.add('scale-100');
}
window.openLightbox = openLightbox;

function closeLightbox() {
    if (!imageLightbox) return;
    imageLightbox.classList.add('opacity-0');
    lightboxImage.classList.remove('scale-100');
    lightboxImage.classList.add('scale-95');
    setTimeout(() => {
        imageLightbox.classList.add('hidden');
        lightboxImage.src = '';
    }, 300);
}

function closeMobileSidebar() {
    if (window.innerWidth >= 768) return; // Prevent interference on desktop
    
    if (sidebarOverlay) {
        sidebarOverlay.classList.remove('opacity-100');
        sidebarOverlay.classList.add('opacity-0');
    }
    if (sidebar) {
        sidebar.classList.remove('translate-x-0');
        sidebar.classList.add('-translate-x-full');
        setTimeout(() => {
            if (window.innerWidth < 768) {
                sidebar.classList.add('hidden');
                sidebar.classList.remove('flex', 'fixed', 'inset-y-0', 'left-0');
                if (sidebarOverlay) sidebarOverlay.classList.add('hidden');
            }
        }, 300);
    }
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
async function processFilesForUpload(files) {
    if (!files || !files.length) return;

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
}

async function handleFileUpload(e) {
    await processFilesForUpload(e.target.files);
    e.target.value = '';
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

// Debounced version of saveChats — only fires once after rapid calls settle
let _saveChatsTimer = null;
function debouncedSaveChats(delay = 300) {
    clearTimeout(_saveChatsTimer);
    _saveChatsTimer = setTimeout(() => saveChats(), delay);
}

// ── Folder management ─────────────────────────────────────────────────────────
function saveFolders() {
    updateState({ folders: globalState.folders, foldersExpanded: globalState.foldersExpanded });
}

function createFolder() {
    const folder = { id: 'f_' + Date.now(), name: 'New Folder', isExpanded: true, createdAt: Date.now() };
    if (!globalState.folders) globalState.folders = [];
    globalState.folders.push(folder);
    
    // Do NOT call saveFolders() here yet!
    // The server echo will broadcast the state update and immediately re-render 
    // the chat list, destroying the rename input before the user finishes typing.
    // We will save it after the user hits Enter or clicks away.
    renderChatList();
    
    // Immediately enter rename mode on the new folder header
    setTimeout(() => {
        const headerEl = document.querySelector(`[data-folder-id="${folder.id}"] .folder-header`);
        if (headerEl) triggerFolderRename(folder, headerEl);
    }, 40);
}

function deleteFolder(id, deleteChatsInFolder) {
    if (!globalState.folders) return;
    globalState.folders = globalState.folders.filter(f => f.id !== id);
    if (deleteChatsInFolder) {
        globalState.chats = globalState.chats.filter(c => c.folderId !== id);
        chatDOMCache = {};
        if (!globalState.chats.find(c => c.id === globalState.activeChatId)) {
            const next = globalState.chats.find(c => !c.isTemporary);
            globalState.activeChatId = next ? next.id : null;
            if (next) { loadChat(next.id); } else { createNewChat(true); }
        }
    } else {
        // Evict chats from folder without deleting them
        globalState.chats.forEach(c => { if (c.folderId === id) c.folderId = null; });
    }
    updateState({ folders: globalState.folders, chats: globalState.chats, activeChatId: globalState.activeChatId });
    renderChatList();
}

function triggerFolderRename(folder, headerEl) {
    const nameEl = headerEl.querySelector('.folder-name-text');
    if (!nameEl) return;
    const current = folder.name;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = current;
    input.className = 'flex-1 min-w-0 bg-black/20 text-white/90 text-[13px] px-1 py-0.5 rounded border border-white/20 focus:outline-none focus:border-indigo-400 pointer-events-auto';

    const save = () => {
        if (input.dataset.saved) return;
        input.dataset.saved = 'true';
        const newName = input.value.trim() || current;
        // Always look up the live folder reference by ID to avoid stale closure
        const liveFolder = (globalState.folders || []).find(f => f.id === folder.id);
        if (liveFolder) liveFolder.name = newName;
        saveFolders();
        renderChatList();
    };

    // Defer blur listener so the programmatic focus() below doesn't fire it immediately
    input.addEventListener('keydown', e => {
        e.stopPropagation();
        if (e.key === 'Enter') { e.preventDefault(); save(); }
        if (e.key === 'Escape') { input.dataset.saved = 'true'; input.value = current; renderChatList(); }
    });
    input.addEventListener('click', e => e.stopPropagation());

    nameEl.replaceWith(input);
    input.focus();
    input.select();

    // Attach blur only after focus settles to avoid immediate false-trigger
    requestAnimationFrame(() => {
        input.addEventListener('blur', save);
    });
}

function moveChatToFolder(chatId, folderId) {
    const chat = globalState.chats.find(c => c.id === chatId);
    if (!chat) return;
    if (folderId !== null && chat.isPinned) chat.isPinned = false; // unpin when entering a folder
    chat.folderId = folderId;
    saveChats();
    renderChatList();
}

// Debounced loadChat — cancels pending renders and only loads the final destination
let _loadChatTimer = null;
function debouncedLoadChat(id, delay = 80) {
    clearTimeout(_loadChatTimer);
    _loadChatTimer = setTimeout(() => loadChat(id), delay);
}

function renderChatList() {
    chatList.innerHTML = '';
    const allChats = globalState.chats.filter(c => !c.isTemporary && c.messages.length > 0);
    const folders = globalState.folders || [];

    // ── Search mode: flat list ignoring folder structure ──────────────────────
    if (chatSearchQuery) {
        const matching = allChats.filter(c => c.title.toLowerCase().includes(chatSearchQuery));
        const pinned = matching.filter(c => c.isPinned);
        const unpinned = matching.filter(c => !c.isPinned);
        [...pinned, ...unpinned].forEach(chat => appendChatItem(chatList, chat));
        return;
    }

    if (globalState.foldersExpanded === undefined) globalState.foldersExpanded = true;
    if (globalState.chatsExpanded === undefined) globalState.chatsExpanded = true;

    // ── Folders section ───────────────────────────────────────────────────────
    const foldersLabel = document.createElement('div');
    foldersLabel.className = 'sidebar-section-label flex justify-between items-center cursor-pointer select-none group';
    
    const foldersLabelLeft = document.createElement('div');
    foldersLabelLeft.className = 'flex items-center gap-1.5 text-white/40 group-hover:text-white/60 transition-colors';
    
    const foldersChevron = document.createElement('i');
    foldersChevron.className = `ph ph-caret-right text-[10px] transition-transform duration-200 ${globalState.foldersExpanded ? 'rotate-90' : ''}`;
    foldersLabelLeft.appendChild(foldersChevron);

    const foldersLabelText = document.createElement('span');
    foldersLabelText.textContent = 'Folders';
    foldersLabelLeft.appendChild(foldersLabelText);
    foldersLabel.appendChild(foldersLabelLeft);
    
    const newFolderIconBtn = document.createElement('button');
    newFolderIconBtn.className = 'text-white/40 hover:text-white transition-colors cursor-pointer p-0.5 flex items-center justify-center rounded hover:bg-white/5 opacity-0 group-hover:opacity-100';
    newFolderIconBtn.title = 'Create New Folder';
    newFolderIconBtn.innerHTML = '<i class="ph ph-plus text-[13px]"></i>';
    newFolderIconBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (!globalState.foldersExpanded) {
            globalState.foldersExpanded = true;
            // State will be saved implicitly when the folder name is saved
        }
        createFolder();
    });
    foldersLabel.appendChild(newFolderIconBtn);
    
    foldersLabel.addEventListener('click', () => {
        globalState.foldersExpanded = !globalState.foldersExpanded;
        updateState({ foldersExpanded: globalState.foldersExpanded });
        renderChatList();
    });

    chatList.appendChild(foldersLabel);

    const foldersContainer = document.createElement('div');
    if (!globalState.foldersExpanded) foldersContainer.classList.add('hidden');
    chatList.appendChild(foldersContainer);

    if (folders.length > 0) {
        folders.forEach(folder => appendFolderItem(folder, allChats, foldersContainer));
    }

    // ── Loose chats section ───────────────────────────────────────────────────
    const loose = allChats.filter(c => !c.folderId);

    // Always render the Chats section header so it can act as a drop zone
    // even when there are no loose chats yet (or when it is collapsed).
    const chatsLabel = document.createElement('div');
    chatsLabel.className = 'sidebar-section-label flex justify-between items-center cursor-pointer select-none mt-2 group';

    const chatsLabelLeft = document.createElement('div');
    chatsLabelLeft.className = 'flex items-center gap-1.5 text-white/40 group-hover:text-white/60 transition-colors';

    const chatsChevron = document.createElement('i');
    chatsChevron.className = `ph ph-caret-right text-[10px] transition-transform duration-200 ${globalState.chatsExpanded ? 'rotate-90' : ''}`;
    chatsLabelLeft.appendChild(chatsChevron);

    const chatsLabelText = document.createElement('span');
    chatsLabelText.textContent = 'Chats';
    chatsLabelLeft.appendChild(chatsLabelText);
    chatsLabel.appendChild(chatsLabelLeft);

    chatsLabel.addEventListener('click', () => {
        globalState.chatsExpanded = !globalState.chatsExpanded;
        updateState({ chatsExpanded: globalState.chatsExpanded });
        renderChatList();
    });

    chatList.appendChild(chatsLabel);

    const chatsContainer = document.createElement('div');
    if (!globalState.chatsExpanded) chatsContainer.classList.add('hidden');
    chatList.appendChild(chatsContainer);

    if (loose.length > 0) {
        const pinned = loose.filter(c => c.isPinned);
        const unpinned = loose.filter(c => !c.isPinned);
        [...pinned, ...unpinned].forEach(chat => appendChatItem(chatsContainer, chat, null));
    }

    // ── Chats section label as a drag-drop target ─────────────────────────────
    // Allows dragging a folder-chat directly onto the "Chats" header to remove
    // it from its folder, even when the Chats section is collapsed.
    let chatsLabelHoverTimer = null;
    chatsLabel.addEventListener('dragover', e => {
        if (!draggedChatId) return;
        const dragged = globalState.chats.find(c => c.id === draggedChatId);
        // Only react when dragging a chat that IS inside a folder
        if (!dragged || !dragged.folderId) return;
        e.preventDefault(); e.stopPropagation();
        chatsLabel.classList.add('chats-section-drag-target');
        // Auto-expand the section after hovering for 600 ms (mirrors folder behaviour)
        if (!globalState.chatsExpanded && !chatsLabelHoverTimer) {
            chatsLabelHoverTimer = setTimeout(() => {
                globalState.chatsExpanded = true;
                chatsContainer.classList.remove('hidden');
                chatsChevron.classList.add('rotate-90');
                updateState({ chatsExpanded: true });
            }, 600);
        }
    });
    chatsLabel.addEventListener('dragleave', () => {
        chatsLabel.classList.remove('chats-section-drag-target');
        clearTimeout(chatsLabelHoverTimer); chatsLabelHoverTimer = null;
    });
    chatsLabel.addEventListener('drop', e => {
        e.preventDefault(); e.stopPropagation();
        chatsLabel.classList.remove('chats-section-drag-target');
        clearTimeout(chatsLabelHoverTimer); chatsLabelHoverTimer = null;
        if (!draggedChatId) return;
        const dragged = globalState.chats.find(c => c.id === draggedChatId);
        if (!dragged || !dragged.folderId) return;
        // Persist expanded state to the server so the WebSocket echo doesn't
        // revert it back to closed after the state broadcast.
        globalState.chatsExpanded = true;
        updateState({ chatsExpanded: true });
        moveChatToFolder(dragged.id, null); // clears folderId
    });
}

// ── Folder row ────────────────────────────────────────────────────────────────
function appendFolderItem(folder, allChats, container = chatList) {
    const folderChats = allChats.filter(c => c.folderId === folder.id);
    const wrapper = document.createElement('div');
    wrapper.className = 'folder-item';
    wrapper.dataset.folderId = folder.id;

    // Header
    const header = document.createElement('div');
    header.className = 'folder-header group';
    header.innerHTML = `
        <span class="folder-chevron text-white/30 flex-shrink-0 transition-transform duration-200 ${folder.isExpanded ? 'rotate-90' : ''} ${folderChats.length === 0 ? 'invisible' : ''}">
            <i class="ph ph-caret-right text-xs pointer-events-none"></i>
        </span>
        <i class="ph ph-folder${folder.isExpanded && folderChats.length > 0 ? '-open' : ''} text-indigo-400/70 text-sm flex-shrink-0 pointer-events-none"></i>
        <span class="folder-name-text flex-1 min-w-0 truncate">${escapeHtml(folder.name)}</span>
        <span class="folder-count text-[10px] text-white/25 flex-shrink-0 mr-1">${folderChats.length}</span>
        <div class="folder-actions relative flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button class="folder-options-trigger flex items-center justify-center w-6 h-6 text-white/40 hover:text-white transition" title="Options">
                <i class="ph ph-dots-three-outline-vertical text-[16px]"></i>
            </button>
            <div class="folder-options-menu glass-dropdown hidden shadow-2xl overflow-hidden" style="left:auto;right:0;top:calc(100% + 4px);min-width:130px;z-index:50;padding:4px;">
                <div class="dropdown-option rename-folder text-white/80 hover:text-white mb-0.5">
                    <i class="ph ph-pencil-simple text-sm"></i> Rename
                </div>
                <div class="dropdown-option delete-folder !text-red-500 hover:!text-red-400 hover:!bg-red-500/10">
                    <i class="ph ph-trash text-sm"></i> Delete
                </div>
            </div>
        </div>`;

    wrapper.appendChild(header);
    if (folderChats.length > 0) {
        const body = document.createElement('div');
        body.className = 'folder-body' + (folder.isExpanded ? '' : ' hidden');

        const pinnedIn = folderChats.filter(c => c.isPinned);
        const unpinnedIn = folderChats.filter(c => !c.isPinned);
        [...pinnedIn, ...unpinnedIn].forEach(chat => appendChatItem(body, chat, folder.id));
        wrapper.appendChild(body);
    }
    container.appendChild(wrapper);

    const chevron = header.querySelector('.folder-chevron');
    const folderIcon = header.querySelector('i[class*="ph-folder"]');
    header.addEventListener('click', e => {
        if (e.target.closest('.folder-actions')) return;
        if (folderChats.length === 0) return; // Do not expand/collapse empty folders
        folder.isExpanded = !folder.isExpanded;
        const bodyEl = wrapper.querySelector('.folder-body');
        if (bodyEl) bodyEl.classList.toggle('hidden', !folder.isExpanded);
        chevron.classList.toggle('rotate-90', folder.isExpanded);
        if (folderIcon) folderIcon.className = `ph ph-folder${folder.isExpanded ? '-open' : ''} text-indigo-400/70 text-sm flex-shrink-0 pointer-events-none`;
        saveFolders();
    });

    // Drag chat onto folder header → move into folder
    let hoverTimer = null;
    header.addEventListener('dragover', e => {
        if (!draggedChatId) return;
        e.preventDefault(); e.stopPropagation();
        header.classList.add('folder-drag-target');
        if (!folder.isExpanded && !hoverTimer && folderChats.length > 0) {
            hoverTimer = setTimeout(() => {
                folder.isExpanded = true;
                const bodyEl = wrapper.querySelector('.folder-body');
                if (bodyEl) bodyEl.classList.remove('hidden');
                chevron.classList.add('rotate-90');
                if (folderIcon) folderIcon.className = 'ph ph-folder-open text-indigo-400/70 text-sm flex-shrink-0 pointer-events-none';
                saveFolders();
            }, 600);
        }
    });
    header.addEventListener('dragleave', () => { header.classList.remove('folder-drag-target'); clearTimeout(hoverTimer); hoverTimer = null; });
    header.addEventListener('drop', e => {
        e.preventDefault(); e.stopPropagation();
        header.classList.remove('folder-drag-target');
        clearTimeout(hoverTimer); hoverTimer = null;
        if (draggedChatId) moveChatToFolder(draggedChatId, folder.id);
    });

    // Options menu
    const optionsTrigger = header.querySelector('.folder-options-trigger');
    const optionsMenu = header.querySelector('.folder-options-menu');
    const actionsDiv = header.querySelector('.folder-actions');

    optionsTrigger.addEventListener('click', e => {
        e.stopPropagation();
        const wasHidden = optionsMenu.classList.contains('hidden');
        document.querySelectorAll('.folder-options-menu, .chat-options-menu').forEach(m => m.classList.add('hidden'));
        document.querySelectorAll('.folder-actions, .chat-actions').forEach(a => a.style.opacity = '');
        if (wasHidden) { optionsMenu.classList.remove('hidden'); actionsDiv.style.opacity = '1'; }
    });

    header.querySelector('.rename-folder').addEventListener('click', e => {
        e.stopPropagation();
        optionsMenu.classList.add('hidden'); actionsDiv.style.opacity = '';
        triggerFolderRename(folder, header);
    });

    header.querySelector('.delete-folder').addEventListener('click', e => {
        e.stopPropagation();
        optionsMenu.classList.add('hidden'); actionsDiv.style.opacity = '';
        folderToDeleteId = folder.id;
        if (deleteFolderChatsCheckbox) deleteFolderChatsCheckbox.checked = false;
        if (deleteFolderConfirmModal) deleteFolderConfirmModal.classList.remove('hidden');
    });
}

// ── Chat row ──────────────────────────────────────────────────────────────────
function appendChatItem(container, chat, currentFolderId = null) {
    const btn = document.createElement('button');
    btn.className = 'chat-item group' + (chat.id === globalState.activeChatId ? ' active' : '') + (currentFolderId ? ' chat-item-indented' : '');
    btn.draggable = true;

    const isThisChatGenerating = isGenerating && chat.id === generatingChatId;
    let iconClass;
    if (isThisChatGenerating) {
        iconClass = 'ph ph-spinner animate-spin text-indigo-400 opacity-80';
    } else if (!currentFolderId && chat.isPinned) {
        iconClass = 'ph ph-push-pin text-indigo-400 opacity-80';
    } else {
        iconClass = 'ph ph-chat-teardrop text-indigo-400/70';
    }

    // Build folder-specific menu items
    const hasFolders = globalState.folders && globalState.folders.length > 0;
    let folderMenuHtml = '';
    if (currentFolderId) {
        folderMenuHtml = `<div class="dropdown-option remove-from-folder text-white/80 hover:text-white mb-0.5"><i class="ph ph-folder-minus text-sm"></i> Move to Chats</div>`;
    } else if (hasFolders) {
        folderMenuHtml = `
            <div class="dropdown-option move-to-folder text-white/80 hover:text-white mb-0.5 flex justify-between items-center w-full">
                <div class="flex items-center gap-2 pointer-events-none">
                    <i class="ph ph-folder-plus text-sm flex-shrink-0"></i> <span>Move</span>
                </div>
                <i class="ph ph-caret-right text-[10px] text-white/30 flex-shrink-0 pointer-events-none"></i>
            </div>`;
    }

    btn.innerHTML = `
        <div class="flex items-center gap-2 min-w-0 flex-1 pointer-events-none">
            <i class="${iconClass} text-sm flex-shrink-0"></i>
            <span class="truncate chat-title-text">${escapeHtml(chat.title)}</span>
        </div>
        <div class="chat-actions relative flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button class="options-trigger flex-shrink-0 flex items-center justify-center w-6 h-6 text-white/40 hover:text-white transition" title="Options">
                <i class="ph ph-dots-three-outline-vertical text-[18px]"></i>
            </button>
            <div class="chat-options-menu glass-dropdown hidden shadow-2xl overflow-visible" style="left:auto;right:0;top:calc(100% + 4px);min-width:145px;z-index:50;padding:4px;">
                ${!currentFolderId ? `<div class="dropdown-option pin-chat text-white/80 hover:text-white mb-0.5"><i class="ph ${chat.isPinned ? 'ph-push-pin-slash' : 'ph-push-pin'} text-sm"></i> ${chat.isPinned ? 'Unpin' : 'Pin'}</div>` : ''}
                <div class="dropdown-option rename-chat text-white/80 hover:text-white mb-0.5"><i class="ph ph-pencil-simple text-sm"></i> Rename</div>
                ${folderMenuHtml}
                <div class="dropdown-option export-chat text-white/80 hover:text-white mb-0.5"><i class="ph ph-export text-sm"></i> Export</div>
                <div class="dropdown-option delete-chat !text-red-500 hover:!text-red-400 hover:!bg-red-500/10"><i class="ph ph-trash text-sm"></i> Delete</div>
            </div>
        </div>`;

    const optionsTrigger = btn.querySelector('.options-trigger');
    const optionsMenu = btn.querySelector('.chat-options-menu');
    const actionsDiv = btn.querySelector('.chat-actions');

    optionsTrigger.addEventListener('click', e => {
        e.stopPropagation();
        const wasHidden = optionsMenu.classList.contains('hidden');
        document.querySelectorAll('.chat-options-menu, .folder-options-menu').forEach(m => m.classList.add('hidden'));
        document.querySelectorAll('.chat-actions, .folder-actions').forEach(a => a.style.opacity = '');
        document.querySelectorAll('.chat-item').forEach(b => { if (!b.querySelector('input')) b.draggable = true; });
        if (wasHidden) { optionsMenu.classList.remove('hidden'); actionsDiv.style.opacity = '1'; btn.draggable = false; }
    });

    btn.querySelector('.delete-chat').addEventListener('click', e => {
        e.stopPropagation();
        optionsMenu.classList.add('hidden'); actionsDiv.style.opacity = '';
        chatToDeleteId = chat.id;
        deleteChatConfirmModal.classList.remove('hidden');
    });

    btn.querySelector('.export-chat').addEventListener('click', e => {
        e.stopPropagation();
        optionsMenu.classList.add('hidden'); actionsDiv.style.opacity = '';
        exportChat(chat.id);
    });

    const pinBtn = btn.querySelector('.pin-chat');
    if (pinBtn) {
        pinBtn.addEventListener('click', e => {
            e.stopPropagation();
            optionsMenu.classList.add('hidden'); actionsDiv.style.opacity = '';
            chat.isPinned = !chat.isPinned;
            saveChats(); renderChatList();
        });
    }

    // Move to folder sub-menu
    const moveToFolderBtn = btn.querySelector('.move-to-folder');
    if (moveToFolderBtn) {
        let hoverTimeout;
        let activeSubmenu = null;

        const closeSubmenu = () => {
            if (activeSubmenu) {
                activeSubmenu.remove();
                activeSubmenu = null;
            }
        };

        const openSubmenu = () => {
            if (activeSubmenu) return;
            document.querySelectorAll('.folder-picker-submenu').forEach(m => m.remove());

            activeSubmenu = document.createElement('div');
            activeSubmenu.className = 'folder-picker-submenu glass-dropdown shadow-2xl flex flex-col cursor-default';
            activeSubmenu.style.cssText = 'position:fixed; z-index:200; min-width:160px; padding:4px;';
            
            const folders = globalState.folders || [];
            folders.forEach(f => {
                const opt = document.createElement('div');
                opt.className = 'dropdown-option text-white/80 hover:text-white mb-0.5';
                opt.innerHTML = `<i class="ph ph-folder text-indigo-400/70 text-sm pointer-events-none"></i> <span class="pointer-events-none truncate flex-1">${escapeHtml(f.name)}</span>`;
                opt.addEventListener('click', e => { 
                    e.stopPropagation(); 
                    closeSubmenu();
                    optionsMenu.classList.add('hidden'); 
                    actionsDiv.style.opacity = '';
                    moveChatToFolder(chat.id, f.id); 
                });
                activeSubmenu.appendChild(opt);
            });

            document.body.appendChild(activeSubmenu);

            const rect = moveToFolderBtn.getBoundingClientRect();
            activeSubmenu.style.top = rect.top + 'px';
            activeSubmenu.style.left = (rect.right + 2) + 'px';

            activeSubmenu.addEventListener('mouseenter', () => clearTimeout(hoverTimeout));
            activeSubmenu.addEventListener('mouseleave', () => {
                hoverTimeout = setTimeout(closeSubmenu, 150);
            });
        };

        moveToFolderBtn.addEventListener('mouseenter', () => {
            clearTimeout(hoverTimeout);
            openSubmenu();
        });
        
        moveToFolderBtn.addEventListener('mouseleave', () => {
            hoverTimeout = setTimeout(closeSubmenu, 150);
        });

        // Ensure submenu closes if the main options menu is closed externally
        const closeMain = e => { 
            if (!optionsMenu.contains(e.target) && !optionsTrigger.contains(e.target)) {
                closeSubmenu();
            }
        };
        document.addEventListener('click', closeMain, true);
    }

    const removeFromFolderBtn = btn.querySelector('.remove-from-folder');
    if (removeFromFolderBtn) {
        removeFromFolderBtn.addEventListener('click', e => {
            e.stopPropagation();
            optionsMenu.classList.add('hidden'); actionsDiv.style.opacity = '';
            moveChatToFolder(chat.id, null);
        });
    }

    btn.querySelector('.rename-chat').addEventListener('click', e => {
        e.stopPropagation();
        optionsMenu.classList.add('hidden'); actionsDiv.style.opacity = '';
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
            if (newTitle && newTitle !== currentTitle) { chat.title = newTitle; saveChats(); }
            renderChatList();
        };
        input.addEventListener('blur', save);
        input.addEventListener('keydown', e => {
            e.stopPropagation();
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') { input.dataset.saved = 'true'; input.value = currentTitle; save(); }
        });
        input.addEventListener('click', e => e.stopPropagation());
        titleContainer.replaceWith(input);
        input.focus(); input.select();
        btn.draggable = false;
    });

    btn.addEventListener('click', () => {
        if (globalState.activeChatId === chat.id) return;
        const prev = chatList.querySelector('.chat-item.active');
        if (prev) prev.classList.remove('active');
        btn.classList.add('active');
        globalState.activeChatId = chat.id;
        debouncedSaveChats();
        debouncedLoadChat(chat.id);
        if (window.innerWidth < 768) closeMobileSidebar();
    });

    // Drag to reorder
    btn.addEventListener('dragstart', e => { draggedChatId = chat.id; btn.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
    btn.addEventListener('dragend', () => { draggedChatId = null; btn.classList.remove('dragging'); document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('drag-over')); });

    btn.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedChatId !== chat.id) {
            btn.classList.add('drag-over');
        }
    });
    btn.addEventListener('dragleave', () => btn.classList.remove('drag-over'));
    btn.addEventListener('drop', e => {
        e.preventDefault();
        btn.classList.remove('drag-over');
        const dragged = globalState.chats.find(c => c.id === draggedChatId);
        if (dragged && draggedChatId !== chat.id) {
            const si = globalState.chats.findIndex(c => c.id === draggedChatId);
            const ti = globalState.chats.findIndex(c => c.id === chat.id);
            if (si !== -1 && ti !== -1) {
                // Move the dragged chat into the same group as the drop target
                dragged.folderId = currentFolderId || null;
                if (dragged.folderId !== null) dragged.isPinned = false; // unpin when entering a folder
                const [rem] = globalState.chats.splice(si, 1);
                globalState.chats.splice(ti, 0, rem);
                saveChats(); renderChatList();
            }
        }
    });

    container.appendChild(btn);
}





function deleteChat(id) {
    globalState.chats = globalState.chats.filter(c => c.id !== id);
    delete chatDOMCache[id]; // invalidate cache
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

    emptyState.classList.toggle('hidden', chat.messages.length > 0);

    // If this chat is currently generating, skip cache (need live DOM)
    const isActiveGeneration = isGenerating && id === generatingChatId;

    // Try to restore from DOM cache
    if (!isActiveGeneration && chatDOMCache[id] && chatDOMCache[id].msgCount === chat.messages.length) {
        messagesContainer.innerHTML = '';
        messagesContainer.appendChild(chatDOMCache[id].fragment.cloneNode(true));
        // Re-attach event listeners for action buttons
        rebindMessageActions(chat);
    } else {
        // Full render (and cache the result)
        messagesContainer.innerHTML = '';

        if (renderSettings.limitMessages && chat.messages.length > renderSettings.messageLimit) {
            const startIndex = chat.messages.length - renderSettings.messageLimit;
            renderOffset[id] = startIndex;
            prependLoadMoreButton(chat, id);
            renderMessageBatch(chat, startIndex, chat.messages.length);
        } else {
            renderOffset[id] = 0;
            renderMessageBatch(chat, 0, chat.messages.length);
        }

        // Cache the rendered DOM for future fast switches
        if (!isActiveGeneration && chat.messages.length > 0) {
            const frag = document.createDocumentFragment();
            Array.from(messagesContainer.childNodes).forEach(n => frag.appendChild(n.cloneNode(true)));
            chatDOMCache[id] = { fragment: frag, msgCount: chat.messages.length };
        }
    }

    if (isGenerating) {
        if (id === generatingChatId) {
            thinkingEl = null;
            aiMessageEl = null;
            
            if (thinkingBuffer.length > 0) {
                thinkingEl = renderThinkingBlock(true);
                updateThinkingBlock(thinkingEl, thinkingBuffer);
                if (aiMessageBuffer.trim().length > 0) {
                    if (thinkingDurationMs === 0 && thinkingStartTime > 0) {
                        thinkingDurationMs = Date.now() - thinkingStartTime;
                    }
                    collapseThinkingBlock(thinkingEl, thinkingDurationMs);
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

    if (chat.messages.length || isActiveGeneration) scrollToBottom(true);

    promptInput.value = '';
    promptInput.style.height = 'auto';
    pendingFiles = [];
    filePreview.innerHTML = '';
    sendBtn.disabled = true;
}

/** Re-attach click handlers on cached DOM (copy, edit, lightbox, thinking toggles) */
function rebindMessageActions(chat) {
    // Copy buttons
    messagesContainer.querySelectorAll('.copy-msg-btn').forEach((btn, i) => {
        btn.addEventListener('click', () => {
            // Find corresponding message content
            const msgEl = btn.closest('.w-full.message-animate');
            const userBubble = msgEl?.querySelector('.user-bubble .text-sm');
            const aiBubble = msgEl?.querySelector('.ai-bubble');
            const text = userBubble ? userBubble.textContent : (aiBubble ? aiBubble.textContent : '');
            copyToClipboard(text);
        });
    });

    // Edit buttons
    messagesContainer.querySelectorAll('.edit-msg-btn').forEach(btn => {
        const msgEl = btn.closest('.w-full.message-animate');
        if (msgEl) {
            const allMsgs = Array.from(messagesContainer.querySelectorAll('.w-full.message-animate'));
            const idx = allMsgs.indexOf(msgEl);
            // Adjust index for render offset
            const offset = renderOffset[chat.id] || 0;
            btn.addEventListener('click', () => editMessage(offset + idx, msgEl));
        }
    });

    // Lightbox images
    messagesContainer.querySelectorAll('.user-bubble img[onclick]').forEach(img => {
        img.removeAttribute('onclick');
        img.addEventListener('click', () => window.openLightbox && window.openLightbox(img.src));
    });

    // Code copy buttons
    messagesContainer.querySelectorAll('.code-copy-btn').forEach(copyBtn => {
        const pre = copyBtn.closest('pre');
        const codeEl = pre?.querySelector('code');
        copyBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const code = codeEl?.innerText ?? pre?.innerText ?? '';
            const ok = await copyRawText(code);
            if (ok) {
                copyBtn.classList.add('copied');
                copyBtn.innerHTML = '<i class="ph ph-check" style="font-size:12px;"></i><span>Copied!</span>';
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.innerHTML = '<i class="ph ph-copy" style="font-size:12px;"></i><span>Copy</span>';
                }, 2000);
            }
        });
    });

    // Thinking toggles
    messagesContainer.querySelectorAll('.thinking-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const block = toggle.closest('.thinking-block') || toggle.closest('.thinking-wrapper');
            if (!block) return;
            const content = block.querySelector('.thinking-content');
            const caret = block.querySelector('.thinking-caret');
            if (content) content.classList.toggle('thinking-open');
            if (caret) caret.style.transform = content?.classList.contains('thinking-open') ? '' : 'rotate(-90deg)';
        });
    });
}

function renderMessageBatch(chat, startIdx, endIdx) {
    for (let idx = startIdx; idx < endIdx; idx++) {
        const msg = chat.messages[idx];
        if (msg.role === 'ai' && msg.thinkingProcess) {
            const wrap = renderThinkingBlock(false, msg.thinkingDurationMs || 0);
            updateThinkingBlock(wrap, msg.thinkingProcess);
        }
        renderMessage(msg.role, msg.content, idx, null, msg.images, msg.timestamp);
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
                        <div class="avatar-ai mt-0.5 opacity-60"><div class="w-4 h-4 bg-current" style="-webkit-mask: url('logo.svg') center/contain no-repeat; mask: url('logo.svg') center/contain no-repeat;"></div></div>
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
            renderMessage(msg.role, msg.content, idx, tempContainer, msg.images, msg.timestamp);
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
            const ok = await copyRawText(code);
            if (ok) {
                copyBtn.classList.add('copied');
                copyBtn.innerHTML = '<i class="ph ph-check" style="font-size:12px;"></i><span>Copied!</span>';
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.innerHTML = '<i class="ph ph-copy" style="font-size:12px;"></i><span>Copy</span>';
                }, 2000);
            }
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
function formatMsgTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const h = d.getHours(), m = d.getMinutes();
    const hh = h % 12 || 12;
    const mm = String(m).padStart(2, '0');
    const ampm = h < 12 ? 'AM' : 'PM';
    if (isToday) return `Today ${hh}:${mm} ${ampm}`;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${hh}:${mm} ${ampm}`;
}

function renderMessage(role, content, index = null, targetContainer = null, images = [], timestamp = null) {
    const container = targetContainer || messagesContainer;
    const wrapper = document.createElement('div');
    wrapper.className = 'w-full message-animate';

    const isUser = role === 'user';

    if (isUser) {
        // Render image thumbnails if any were attached to this message
        const imagesHtml = Array.isArray(images) && images.length > 0
            ? `<div class="flex flex-wrap gap-2 mb-2">${images.map(src =>
                `<img src="${src}" alt="Attached image"
                     class="h-28 max-w-[200px] object-cover rounded-xl border border-white/10 shadow-md cursor-pointer hover:opacity-80 transition-opacity"
                     onclick="window.openLightbox && window.openLightbox(this.src)">`
              ).join('')}</div>`
            : '';

        wrapper.innerHTML = `
            <div class="flex justify-end items-start gap-2.5 group">
                <div class="flex flex-col items-end gap-1 max-w-[85%]">
                    <div class="relative">
                        ${timestamp ? `<div class="msg-timestamp opacity-0 group-hover:opacity-100 transition-opacity" style="position:absolute;bottom:100%;right:0;margin-bottom:4px;">${formatMsgTime(timestamp)}</div>` : ''}
                        <div class="user-bubble">
                            ${imagesHtml}
                            <div class="text-sm leading-relaxed whitespace-pre-wrap">${escapeHtml(content)}</div>
                        </div>
                    </div>
                    <div class="flex flex-row items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
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
                <div class="avatar-ai mt-0.5"><div class="w-4 h-4 bg-current" style="-webkit-mask: url('logo.svg') center/contain no-repeat; mask: url('logo.svg') center/contain no-repeat;"></div></div>
                <div class="flex flex-col items-start gap-1 w-full min-w-0">
                    <div class="relative w-full">
                        ${timestamp ? `<div class="msg-timestamp opacity-0 group-hover:opacity-100 transition-opacity" style="position:absolute;bottom:100%;left:0;margin-bottom:4px;">${formatMsgTime(timestamp)}</div>` : ''}
                        <div class="ai-bubble markdown-body content-inner w-full overflow-hidden"></div>
                    </div>
                    <div class="flex flex-row items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pl-1">
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

/**
 * Low-level copy helper — returns true on success, false on failure.
 * Used by code-block buttons that show their own "Copied!" visual feedback.
 */
async function copyRawText(text) {
    if (navigator.clipboard && window.isSecureContext) {
        try { await navigator.clipboard.writeText(text); return true; } catch { /* fall through */ }
    }
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, ta.value.length); // required on iOS
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
    } catch { return false; }
}

async function copyToClipboard(text) {
    // Primary: Clipboard API (requires HTTPS or localhost)
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            showToast('Copied to clipboard!', 'info');
            return;
        } catch { /* fall through to fallback */ }
    }

    // Fallback: textarea + execCommand (works on HTTP / mobile browsers)
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        // On iOS, setSelectionRange is required instead of select()
        ta.setSelectionRange(0, ta.value.length);
        const ok = document.execCommand('copy');
        ta.remove();
        if (ok) {
            showToast('Copied to clipboard!', 'info');
        } else {
            showToast('Failed to copy', 'error');
        }
    } catch {
        showToast('Failed to copy', 'error');
    }
}

// ── Chat Export ───────────────────────────────────────────────────────────────
function exportChat(chatId) {
    const chat = globalState.chats.find(c => c.id === chatId);
    if (!chat) return;

    const payload = {
        starbox_export: '1.0',
        exportedAt: new Date().toISOString(),
        chat
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Build a safe filename: starbox-<title>-<YYYY-MM-DD>.json
    const safeTitle = chat.title
        .replace(/[^a-z0-9]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 48)
        .toLowerCase() || 'chat';
    const date = new Date().toISOString().slice(0, 10);
    const filename = `starbox-${safeTitle}-${date}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Exported "${chat.title}"`, 'info');
}

// ── Chat Import ───────────────────────────────────────────────────────────────
function importChat(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const payload = JSON.parse(e.target.result);

            // Validate
            if (!payload.starbox_export || !payload.chat || !Array.isArray(payload.chat.messages)) {
                showToast('Invalid file — not a Starbox chat export.', 'error');
                return;
            }

            // Clone the chat with a fresh id to avoid collisions
            const importedChat = {
                ...payload.chat,
                id: Date.now().toString(),
                importedAt: new Date().toISOString(),
                updatedAt: Date.now(),
                isTemporary: false
            };

            // Prepend to chat list
            globalState.chats.unshift(importedChat);
            globalState.activeChatId = importedChat.id;
            delete chatDOMCache[importedChat.id];
            saveChats();
            renderChatList();
            loadChat(importedChat.id);

            showToast(`Imported "${importedChat.title}"`, 'info');
        } catch (err) {
            showToast('Failed to parse file — make sure it is a valid JSON export.', 'error');
        }
    };
    reader.readAsText(file);
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
    let currentImages = chat.messages[index].images ? [...chat.messages[index].images] : [];

    const bubble = wrapper.querySelector('.user-bubble');
    const actionsDiv = wrapper.querySelector('.flex-row.gap-2.opacity-0');

    // Hide original viewing UI
    const originalChildren = Array.from(bubble.children);
    originalChildren.forEach(child => child.style.display = 'none');
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

    const imagePreviewContainer = document.createElement('div');
    imagePreviewContainer.className = 'flex flex-wrap gap-2 mb-2';
    
    const renderEditImages = () => {
        imagePreviewContainer.innerHTML = '';
        currentImages.forEach((imgSrc, imgIdx) => {
            const chip = document.createElement('div');
            chip.className = 'relative group';
            chip.innerHTML = `
                <img src="${imgSrc}" alt="Attached image" class="h-14 w-14 object-cover rounded-xl border border-white/10 shadow-md">
                <button class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black/70 border border-white/20 text-white/60 hover:text-red-400 flex items-center justify-center text-[9px] opacity-0 group-hover:opacity-100 transition-opacity" title="Remove image">
                    <i class="ph ph-x"></i>
                </button>
            `;
            chip.querySelector('button').addEventListener('click', () => {
                currentImages.splice(imgIdx, 1);
                renderEditImages();
            });
            imagePreviewContainer.appendChild(chip);
        });
    };
    renderEditImages();

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
    if (currentImages.length > 0) {
        editContainer.appendChild(imagePreviewContainer);
    }
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
        originalChildren.forEach(child => child.style.display = '');
        actionsDiv.style.display = '';
        wrapper.classList.add('group');
        bubble.style.width = oldWidth;
        bubble.style.minWidth = oldMinWidth;
    };

    cancelBtn.addEventListener('click', cleanup);

    sendBtnUI.addEventListener('click', () => {
        const newText = textarea.value.trim();
        if (!newText && currentImages.length === 0) return;

        // Re-fetch chat dynamically in case globalState was updated via WebSocket
        const activeChat = globalState.chats.find(c => c.id === globalState.activeChatId);
        if (!activeChat) return;

        activeChat.messages = activeChat.messages.slice(0, index);
        delete chatDOMCache[globalState.activeChatId]; // invalidate cache
        saveChats();

        loadChat(globalState.activeChatId);

        // Populate pendingFiles with these images before calling sendMessage
        pendingFiles = currentImages.map((src, i) => ({ type: 'image', name: `edited_image_${i}.png`, content: src }));

        promptInput.value = newText;
        promptInput.style.height = 'auto';
        promptInput.style.height = promptInput.scrollHeight + 'px';
        sendMessage();
    });
}

function scrollToBottom(force = false) {
    if (force || !isUserScrolledUp) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
        if (force) isUserScrolledUp = false;
    }
}

// ── Thinking block helpers ─────────────────────────────────────────────────────
function renderThinkingBlock(isStreaming = true, durationMs = 0) {
    const wrapper = document.createElement('div');
    wrapper.className = 'w-full message-animate thinking-wrapper';

    const caretTransform = isStreaming ? '' : 'style="transform: rotate(-90deg);"';
    
    let durationStr = '';
    if (durationMs > 0) {
        const secs = (durationMs / 1000).toFixed(1);
        durationStr = ` <span class="text-white/30 text-[10px] lowercase font-mono font-normal">(${secs}s)</span>`;
    }
    
    const labelText = isStreaming ? 'Thinking…' : 'Thought process' + durationStr;
    const spinnerHtml = isStreaming ? '<span class="thinking-spinner ml-1"></span>' : '';
    const contentClass = isStreaming ? 'thinking-open' : '';

    wrapper.innerHTML = `
        <div class="flex items-start gap-2.5">
            <div class="avatar-ai mt-0.5 opacity-60"><div class="w-4 h-4 bg-current" style="-webkit-mask: url('logo.svg') center/contain no-repeat; mask: url('logo.svg') center/contain no-repeat;"></div></div>
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

function collapseThinkingBlock(wrapper, durationMs = 0) {
    const content = wrapper.querySelector('.thinking-content');
    const caret = wrapper.querySelector('.thinking-caret');
    const label = wrapper.querySelector('.thinking-label');
    const spinner = wrapper.querySelector('.thinking-spinner');
    if (content) content.classList.remove('thinking-open');
    if (caret) caret.style.transform = 'rotate(-90deg)';
    
    let durationStr = '';
    if (durationMs > 0) {
        const secs = (durationMs / 1000).toFixed(1);
        durationStr = ` <span class="text-white/30 text-[10px] lowercase font-mono font-normal">(${secs}s)</span>`;
    }
    
    if (label) label.innerHTML = 'Thought process' + durationStr;
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

            // Always keep our local activeChatId — the server echo may be stale
            // (e.g. user already switched to a different chat before the save round-tripped)
            const localActiveChatId = globalState.activeChatId;
            const preserveLocalChats = isTemporaryChat;
            const localChats = globalState.chats;

            const prevActiveChat = globalState.chats.find(c => c.id === localActiveChatId);
            const prevUpdatedAt = prevActiveChat ? prevActiveChat.updatedAt : null;

            // Merge server state but NEVER let the server overwrite our activeChatId
            globalState = { ...globalState, ...data.state, activeChatId: localActiveChatId };

            if (preserveLocalChats) {
                globalState.chats = localChats;
            }

            if (!isGenerating) {
                if (prevSessionActive !== globalState.sessionActive) {
                    applyStateToUI();
                    return;
                }

                if (globalState.activeChatId && !globalState.chats.find(c => c.id === globalState.activeChatId)) {
                    // Chat got deleted from another tab/device
                    globalState.activeChatId = globalState.chats[0]?.id;
                    applyStateToUI();
                } else if (globalState.activeChatId) {
                    // Only reload if the currently-viewed chat's data actually changed
                    const newActiveChat = globalState.chats.find(c => c.id === globalState.activeChatId);
                    const newUpdatedAt = newActiveChat ? newActiveChat.updatedAt : null;
                    if (prevUpdatedAt !== newUpdatedAt) {
                        loadChat(globalState.activeChatId);
                    }
                    // Always sync the sidebar highlight
                    renderChatList();
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
                    if (thinkingDurationMs === 0 && thinkingStartTime > 0) {
                        thinkingDurationMs = Date.now() - thinkingStartTime;
                    }
                    collapseThinkingBlock(thinkingEl, thinkingDurationMs);
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

// ── Perform Tavily web search ─────────────────────────────────────────────────
async function performWebSearch(query) {
    const port = window.location.port || '4000';
    const res = await fetch(`http://${window.location.hostname}:${port}/api/web-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Search failed (${res.status})`);
    }
    return await res.json(); // { results: [{title, url, content}] }
}

// ── Send message ──────────────────────────────────────────────────────────────
async function sendMessage() {
    const rawText = promptInput.value.trim();
    if (!rawText && pendingFiles.length === 0) return;

    // Separate images from text/file attachments
    let fileContext = '';
    const attachedImages = []; // full data URIs saved on the message for rendering
    pendingFiles.forEach(f => {
        if (f.type === 'image') {
            attachedImages.push(f.content); // e.g. "data:image/jpeg;base64,..."
        } else {
            fileContext += `\n\n--- FILE: ${f.name} ---\n${f.content}\n--- END FILE ---`;
        }
    });

    const fullPrompt = rawText + fileContext;
    const chat = globalState.chats.find(c => c.id === globalState.activeChatId);

    const userMsg = { role: 'user', content: fullPrompt, rawText, timestamp: Date.now() };
    if (attachedImages.length > 0) userMsg.images = attachedImages;
    chat.messages.push(userMsg);

    if (chat.messages.length === 1) {
        chat.title = rawText.substring(0, 32) + (rawText.length > 32 ? '…' : '');
    }
    chat.updatedAt = Date.now();
    delete chatDOMCache[globalState.activeChatId]; // invalidate cache
    saveChats();

    // Re-render conversation
    loadChat(globalState.activeChatId);

    // Switch UI into generating state
    isGenerating = true;
    generatingChatId = globalState.activeChatId;
    renderChatList();
    sendBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    typingIndicator.classList.remove('hidden');
    scrollToBottom(true);

    aiMessageBuffer = '';
    aiMessageEl = null;
    thinkingBuffer = '';
    thinkingEl = null;
    thinkingStartTime = Date.now();
    thinkingDurationMs = 0;

    // Build structured messages array for /api/chat (gives AI full conversation context)
    // For vision-capable models, strip the data-URI prefix — Ollama expects raw base64
    const messages = chat.messages.map(m => {
        const msg = {
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
        };
        if (Array.isArray(m.images) && m.images.length > 0) {
            msg.images = m.images.map(uri => uri.includes(',') ? uri.split(',')[1] : uri);
        }
        return msg;
    });

    // ── Web Search injection ──────────────────────────────────────────────────
    const searchWasActive = isWebSearchActive;
    if (searchWasActive) {

        // Show a searching indicator in the typing area
        typingIndicator.classList.remove('hidden');
        const searchingLabel = document.createElement('div');
        searchingLabel.id = 'searchingLabel';
        searchingLabel.className = 'max-w-3xl mx-auto px-4 text-xs text-sky-400/70 searching-indicator flex items-center gap-1.5 pl-11 pb-1';
        searchingLabel.innerHTML = '<i class="ph ph-globe-hemisphere-west"></i> Searching the web…';
        typingIndicator.parentNode.insertBefore(searchingLabel, typingIndicator);

        try {
            const { results } = await performWebSearch(rawText);
            searchingLabel.remove();

            if (results && results.length > 0) {
                let context = `[WEB SEARCH RESULTS for "${rawText}"]\n`;
                results.forEach((r, i) => {
                    context += `\n${i + 1}. **${r.title}**\n   URL: ${r.url}\n   ${r.content}\n`;
                });
                context += `\n[END WEB SEARCH RESULTS]\nUse the above search results to inform your answer where relevant. Cite sources using their URLs when helpful.`;

                // Prepend as a system context message (before any existing system message)
                messages.unshift({ role: 'system', content: context });
            }
        } catch (err) {
            searchingLabel.remove();
            showToast(`Web search failed: ${err.message}`, 'error');
            // Continue without search context — don't block the chat
        }
    }
    // ─────────────────────────────────────────────────────────────────────────

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
        fetch('/api/state').then(res => res.json())
        .then(data => {
            globalState = data;
            globalState.folders = globalState.folders || [];
            updateUIWithState();
        });
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
        if (thinkingDurationMs === 0 && thinkingStartTime > 0) {
            thinkingDurationMs = Date.now() - thinkingStartTime;
        }
        collapseThinkingBlock(thinkingEl, thinkingDurationMs);
    }
    
    const savedThinking = thinkingBuffer;
    const finalThinkingDuration = thinkingDurationMs;
    thinkingBuffer = '';
    thinkingEl = null;

    if (aiMessageBuffer) {
        const chat = globalState.chats.find(c => c.id === generatingChatId);
        if (chat) {
            const newMsg = { role: 'ai', content: aiMessageBuffer, timestamp: Date.now() };
            if (savedThinking) {
                newMsg.thinkingProcess = savedThinking;
                if (finalThinkingDuration > 0) newMsg.thinkingDurationMs = finalThinkingDuration;
            }
            chat.messages.push(newMsg);
            chat.updatedAt = Date.now();
            delete chatDOMCache[generatingChatId]; // invalidate cache
            saveChats();
            renderChatList();

            // Inject the timestamp directly into the live streamed bubble.
            // aiMessageEl (.content-inner) was created without a timestamp because
            // the response wasn't done yet — patch it in now while the ref is still valid.
            if (aiMessageEl) {
                const relativeWrapper = aiMessageEl.closest('.relative');
                if (relativeWrapper && !relativeWrapper.querySelector('.msg-timestamp')) {
                    const tsEl = document.createElement('div');
                    tsEl.className = 'msg-timestamp opacity-0 group-hover:opacity-100 transition-opacity';
                    tsEl.style.cssText = 'position:absolute;bottom:100%;left:0;margin-bottom:4px;';
                    tsEl.textContent = formatMsgTime(newMsg.timestamp);
                    relativeWrapper.insertBefore(tsEl, relativeWrapper.firstChild);
                }
            }
        }
    }

    aiMessageBuffer = '';
    aiMessageEl = null;
    generatingChatId = null;
    
    // Always update sidebar at the end to clear any loading states
    renderChatList();
}
