/* ========== AI 对话引擎（全站统一） ========== */
(function() {
    'use strict';

    // ===== 配置加载 =====
    var API_URL, API_KEY, MODEL, SYSTEM_PROMPT;
    var STORAGE_KEY_CONFIG = 'etta_ai_config';
    var STORAGE_KEY_MSGS = 'etta_ai_chat_messages';

    // 1) 优先读取外部文件定义的全局变量（本地开发环境）
    if (typeof __AI_CHAT_CONFIG__ !== 'undefined') {
        API_URL = __AI_CHAT_CONFIG__.apiUrl;
        API_KEY = __AI_CHAT_CONFIG__.apiKey;
        MODEL = __AI_CHAT_CONFIG__.model;
    }

    // 2) 回退：从 localStorage 加载（部署环境，用户已通过设置面板保存）
    if (!API_URL || !API_KEY || !MODEL) {
        try {
            var saved = localStorage.getItem(STORAGE_KEY_CONFIG);
            if (saved) {
                var c = JSON.parse(saved);
                API_URL = API_URL || c.apiUrl;
                API_KEY = API_KEY || c.apiKey;
                MODEL = MODEL || c.model;
            }
        } catch (e) { /* ignore */ }
    }

    if (typeof __AI_SYSTEM_PROMPT__ !== 'undefined') {
        SYSTEM_PROMPT = __AI_SYSTEM_PROMPT__;
    }

    // ===== DOM 引用 =====
    var floatingBall = document.getElementById('aiFloatingBall');
    var chatPanel = document.getElementById('aiChatPanel');
    var chatMessages = document.getElementById('aiChatMessages');
    var chatInput = document.getElementById('aiChatInput');
    var sendBtn = document.getElementById('aiSendBtn');
    var closeBtn = document.getElementById('aiCloseBtn');
    var clearBtn = document.getElementById('aiClearBtn');
    var clearConfirm = document.getElementById('aiClearConfirm');
    var clearConfirmBtn = document.getElementById('aiClearConfirmBtn');
    var clearCancelBtn = document.getElementById('aiClearCancelBtn');
    var welcomeEl = document.getElementById('aiWelcome');

    if (!floatingBall || !chatPanel) return;

    // ===== 如果完全没配，替换为 API Key 设置面板 =====
    if (!API_URL || !API_KEY || !MODEL) {
        floatingBall.addEventListener('click', function() {
            if (chatPanel.classList.contains('open')) {
                chatPanel.classList.remove('open');
                floatingBall.classList.remove('active');
            } else {
                showSetupPanel();
            }
        });
        return;
    }

    // ===== 状态 =====
    var messages = [];
    var isStreaming = false;
    var isPanelOpen = false;
    var clearStep = 0;

    // ===== localStorage 持久化 =====
    function loadMessages() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY_MSGS);
            if (raw) {
                var parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    messages = parsed;
                    renderAllMessages();
                    if (welcomeEl) welcomeEl.style.display = 'none';
                }
            }
        } catch (e) { /* ignore */ }
    }

    function saveMessages() {
        try {
            localStorage.setItem(STORAGE_KEY_MSGS, JSON.stringify(messages));
        } catch (e) { /* ignore */ }
    }

    // ===== UI 渲染 =====
    function renderAllMessages() {
        chatMessages.innerHTML = '';
        if (messages.length === 0 && welcomeEl) {
            chatMessages.appendChild(welcomeEl);
            welcomeEl.style.display = '';
            return;
        }
        if (welcomeEl) welcomeEl.style.display = 'none';
        messages.forEach(function(msg) {
            appendMessageBubble(msg.role, msg.content);
        });
        scrollToBottom();
    }

    function appendMessageBubble(role, content) {
        var div = document.createElement('div');
        div.className = 'ai-message ai-message-' + (role === 'user' ? 'user' : 'assistant');
        div.textContent = content;
        chatMessages.appendChild(div);
        return div;
    }

    function appendStreamingBubble() {
        var div = document.createElement('div');
        div.className = 'ai-message ai-message-assistant';
        div.id = 'aiStreamingMsg';
        div.textContent = '';
        chatMessages.appendChild(div);
        return div;
    }

    function showTypingIndicator() {
        var div = document.createElement('div');
        div.className = 'ai-typing-indicator';
        div.id = 'aiTypingIndicator';
        div.innerHTML = '<span class="ai-typing-dot"></span><span class="ai-typing-dot"></span><span class="ai-typing-dot"></span>';
        chatMessages.appendChild(div);
        scrollToBottom();
    }

    function hideTypingIndicator() {
        var el = document.getElementById('aiTypingIndicator');
        if (el) el.remove();
    }

    function showError(msg) {
        var div = document.createElement('div');
        div.className = 'ai-message ai-message-error';
        div.textContent = msg;
        chatMessages.appendChild(div);
        scrollToBottom();
        setTimeout(function() { div.remove(); }, 6000);
    }

    function scrollToBottom() {
        requestAnimationFrame(function() {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }

    // ===== 面板控制 =====
    function openPanel() {
        isPanelOpen = true;
        chatPanel.classList.add('open');
        floatingBall.classList.add('active');
        chatInput.focus();
        scrollToBottom();
    }

    function closePanel() {
        isPanelOpen = false;
        chatPanel.classList.remove('open');
        floatingBall.classList.remove('active');
        clearStep = 0;
        if (clearConfirm) clearConfirm.style.display = 'none';
    }

    function togglePanel() {
        if (isPanelOpen) { closePanel(); }
        else { openPanel(); }
    }

    // ===== API 调用 =====
    function buildApiMessages() {
        var systemMsg = SYSTEM_PROMPT;
        // 确保 system prompt 是字符串
        if (Array.isArray(systemMsg)) systemMsg = systemMsg.join('\n');
        return [{ role: 'system', content: systemMsg }].concat(messages);
    }

    async function sendMessage(userContent) {
        if (isStreaming) return;
        if (!userContent || !userContent.trim()) return;

        var trimmed = userContent.trim();

        messages.push({ role: 'user', content: trimmed });
        if (welcomeEl) welcomeEl.style.display = 'none';
        appendMessageBubble('user', trimmed);
        saveMessages();
        scrollToBottom();

        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendBtn.disabled = true;

        showTypingIndicator();
        isStreaming = true;

        try {
            var resp = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + API_KEY
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages: buildApiMessages(),
                    stream: true,
                    temperature: 0.8,
                    max_tokens: 2048
                })
            });

            if (!resp.ok) {
                var errText = '';
                try { errText = await resp.text(); } catch (e) {}
                throw new Error('API \u8bf7\u6c42\u5931\u8d25 (HTTP ' + resp.status + ')' + (errText ? ': ' + errText.slice(0, 120) : ''));
            }

            hideTypingIndicator();

            var reader = resp.body.getReader();
            var decoder = new TextDecoder();
            var streamingBubble = appendStreamingBubble();
            var fullContent = '';
            var leftover = '';

            while (true) {
                var readResult = await reader.read();
                if (readResult.done) break;

                var chunk = decoder.decode(readResult.value, { stream: true });
                var lines = (leftover + chunk).split('\n');
                leftover = '';

                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i].trim();
                    if (!line || !line.startsWith('data: ')) {
                        if (i === lines.length - 1 && !chunk.endsWith('\n')) {
                            leftover = line;
                        }
                        continue;
                    }

                    var dataStr = line.slice(6);
                    if (dataStr === '[DONE]') break;

                    try {
                        var json = JSON.parse(dataStr);
                        var delta = json.choices && json.choices[0] && json.choices[0].delta;
                        if (delta && delta.content) {
                            fullContent += delta.content;
                            streamingBubble.textContent = fullContent;
                            scrollToBottom();
                        }
                    } catch (e) { /* skip malformed lines */ }
                }
            }

            if (fullContent) {
                messages.push({ role: 'assistant', content: fullContent });
                saveMessages();
            } else {
                streamingBubble.remove();
                messages.push({ role: 'assistant', content: '\uff08\u56de\u590d\u5185\u5bb9\u4e3a\u7a7a\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\uff09' });
                appendMessageBubble('assistant', '\uff08\u56de\u590d\u5185\u5bb9\u4e3a\u7a7a\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\uff09');
                saveMessages();
            }

        } catch (err) {
            hideTypingIndicator();
            console.error('AI Chat Error:', err);
            var errMsg = '\u62b1\u6b49\uff0c\u5bf9\u8bdd\u6682\u65f6\u4e2d\u65ad\u4e86\u3002';
            if (err.message && err.message.indexOf('402') > -1) {
                errMsg = 'API \u989d\u5ea6\u53ef\u80fd\u5df2\u7528\u5c3d\uff0c\u8bf7\u8054\u7cfb Laser \u68c0\u67e5\u8d26\u6237\u72b6\u6001\u3002';
            } else if (err.message && err.message.indexOf('401') > -1) {
                errMsg = 'API \u5bc6\u94a5\u9a8c\u8bc1\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u914d\u7f6e\u3002';
            } else if (err.message) {
                errMsg = err.message;
            }
            showError(errMsg);
        } finally {
            isStreaming = false;
            sendBtn.disabled = false;
        }
    }

    // ===== 清除对话 =====
    function showClearConfirmFn() {
        if (clearStep === 0 && clearConfirm) {
            clearStep = 1;
            clearConfirm.style.display = 'flex';
        }
    }

    function hideClearConfirmFn() {
        clearStep = 0;
        if (clearConfirm) clearConfirm.style.display = 'none';
    }

    function clearConversation() {
        messages = [];
        localStorage.removeItem(STORAGE_KEY_MSGS);
        hideClearConfirmFn();
        chatMessages.innerHTML = '';
        if (welcomeEl) {
            chatMessages.appendChild(welcomeEl);
            welcomeEl.style.display = '';
        }
    }

    // ===== 事件绑定 =====
    floatingBall.addEventListener('click', togglePanel);
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    if (clearBtn) clearBtn.addEventListener('click', showClearConfirmFn);
    if (clearConfirmBtn) clearConfirmBtn.addEventListener('click', clearConversation);
    if (clearCancelBtn) clearCancelBtn.addEventListener('click', hideClearConfirmFn);

    document.addEventListener('click', function(e) {
        if (!isPanelOpen) return;
        if (!chatPanel.contains(e.target) && !floatingBall.contains(e.target)) {
            closePanel();
        }
    });

    if (sendBtn) sendBtn.addEventListener('click', function() {
        sendMessage(chatInput.value);
    });

    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(chatInput.value);
        }
    });

    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 80) + 'px';
    });

    chatMessages.addEventListener('click', function(e) {
        var suggestion = e.target.closest('.ai-chat-suggestion');
        if (suggestion) {
            var q = suggestion.getAttribute('data-q');
            if (q) sendMessage(q);
        }
    });

    function updateSendButton() {
        sendBtn.disabled = isStreaming || !chatInput.value.trim();
    }
    chatInput.addEventListener('input', updateSendButton);

    // ===== 启动 =====
    loadMessages();
    updateSendButton();

    // ===== API Key 设置面板（未配置时显示） =====
    function showSetupPanel() {
        chatPanel.classList.add('open');
        floatingBall.classList.add('active');

        chatMessages.innerHTML = '';
        var setupDiv = document.createElement('div');
        setupDiv.className = 'ai-setup-panel';
        setupDiv.innerHTML = '<div class="ai-setup-title">\u914d\u7f6e AI \u5bf9\u8bdd</div>' +
            '<p class="ai-setup-desc">\u8bf7\u8f93\u5165 DeepSeek API \u4fe1\u606f\u4ee5\u542f\u7528 Etta \u667a\u80fd\u52a9\u624b\u3002<br>\u8be5\u914d\u7f6e\u4ec5\u4fdd\u5b58\u5728\u4f60\u7684\u6d4f\u89c8\u5668\u4e2d\uff0c\u4e0d\u4f1a\u4e0a\u4f20\u3002</p>' +
            '<input class="ai-setup-input" id="aiSetupApiUrl" placeholder="API URL (https://api.deepseek.com/v1/chat/completions)" value="https://api.deepseek.com/v1/chat/completions">' +
            '<input class="ai-setup-input" id="aiSetupApiKey" placeholder="API Key (sk-...)" type="password">' +
            '<input class="ai-setup-input" id="aiSetupModel" placeholder="Model (deepseek-chat)" value="deepseek-chat">' +
            '<button class="ai-setup-btn" id="aiSetupSaveBtn">\u4fdd\u5b58\u5e76\u542f\u7528</button>' +
            '<button class="ai-setup-cancel" id="aiSetupCancelBtn">\u53d6\u6d88</button>';
        chatMessages.appendChild(setupDiv);

        document.getElementById('aiSetupSaveBtn').addEventListener('click', function() {
            var url = document.getElementById('aiSetupApiUrl').value.trim();
            var key = document.getElementById('aiSetupApiKey').value.trim();
            var model = document.getElementById('aiSetupModel').value.trim();

            if (!url || !key || !model) {
                alert('\u8bf7\u586b\u5199\u6240\u6709\u5fc5\u9700\u4fe1\u606f');
                return;
            }

            var config = { apiUrl: url, apiKey: key, model: model };
            localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));

            // 刷新页面加载完整 AI 引擎
            location.reload();
        });

        document.getElementById('aiSetupCancelBtn').addEventListener('click', function() {
            chatPanel.classList.remove('open');
            floatingBall.classList.remove('active');
        });
    }
})();
