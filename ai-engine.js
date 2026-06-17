/* ========== AI 对话引擎（全站统一） ========== */
(function() {
    'use strict';

    // ===== 配置（由 ai-config.js 提供，本地或 GitHub Actions 自动注入） =====
    var API_URL, API_KEY, MODEL, SYSTEM_PROMPT;
    var STORAGE_KEY_MSGS = 'etta_ai_chat_messages';
    var CONFIGURED = false;

    if (typeof __AI_CHAT_CONFIG__ !== 'undefined') {
        API_URL = __AI_CHAT_CONFIG__.apiUrl;
        API_KEY = __AI_CHAT_CONFIG__.apiKey;
        MODEL = __AI_CHAT_CONFIG__.model;
        CONFIGURED = true;
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

    // ===== 时间格式化（访问者本地时区） =====
    function formatTime(timestamp) {
        var d = new Date(timestamp);
        var now = new Date();
        var diffMs = now - d;
        var diffMin = Math.floor(diffMs / 60000);
        var h = d.getHours().toString().padStart(2, '0');
        var m = d.getMinutes().toString().padStart(2, '0');

        // 1分钟内
        if (diffMin < 1) return '刚刚';
        // 1小时内
        if (diffMin < 60) return diffMin + '\u5206\u949f\u524d';
        // 今天
        if (d.toDateString() === now.toDateString()) return h + ':' + m;
        // 昨天
        var yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) return '\u6628\u5929 ' + h + ':' + m;
        // 更早
        return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + h + ':' + m;
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
            appendMessageBubble(msg.role, msg.content, msg.timestamp);
        });
        scrollToBottom();
    }

    function appendMessageBubble(role, content, timestamp) {
        var div = document.createElement('div');
        div.className = 'ai-message ai-message-' + (role === 'user' ? 'user' : 'assistant');
        div.textContent = content;

        if (timestamp) {
            var timeEl = document.createElement('time');
            timeEl.className = 'ai-message-time';
            timeEl.textContent = formatTime(timestamp);
            timeEl.dateTime = new Date(timestamp).toISOString();
            div.appendChild(timeEl);
        }

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

        if (CONFIGURED) {
            chatInput.focus();
            scrollToBottom();
        }
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

    // ===== 未配置时的提示 =====
    function showNotConfigured() {
        chatMessages.innerHTML = '';
        var infoDiv = document.createElement('div');
        infoDiv.className = 'ai-not-configured';
        infoDiv.innerHTML =
            '<div class="ai-nc-icon">&#9888;</div>' +
            '<div class="ai-nc-title">AI 功能暂未激活</div>' +
            '<p class="ai-nc-desc">请在项目仓库的 Settings &rarr; Secrets and variables &rarr; Actions 中设置 <code>DEEPSEEK_API_KEY</code>，然后重新部署即可自动激活。</p>' +
            '<p class="ai-nc-local">如果你在本地开发，请创建 <code>ai-config.js</code> 文件并填入 API Key。</p>';
        chatMessages.appendChild(infoDiv);
    }

    // ===== API 调用 =====
    function buildApiMessages() {
        var systemMsg = SYSTEM_PROMPT;
        if (Array.isArray(systemMsg)) systemMsg = systemMsg.join('\n');
        return [{ role: 'system', content: systemMsg }].concat(messages);
    }

    async function sendMessage(userContent) {
        if (isStreaming) return;
        if (!CONFIGURED) return;
        if (!userContent || !userContent.trim()) return;

        var trimmed = userContent.trim();
        var now = Date.now();

        messages.push({ role: 'user', content: trimmed, timestamp: now });
        if (welcomeEl) welcomeEl.style.display = 'none';
        appendMessageBubble('user', trimmed, now);
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
                var responseTime = Date.now();
                messages.push({ role: 'assistant', content: fullContent, timestamp: responseTime });
                // 给流式气泡补上时间戳
                var timeEl = document.createElement('time');
                timeEl.className = 'ai-message-time';
                timeEl.textContent = formatTime(responseTime);
                timeEl.dateTime = new Date(responseTime).toISOString();
                streamingBubble.appendChild(timeEl);
                scrollToBottom();
                saveMessages();
            } else {
                streamingBubble.remove();
                messages.push({ role: 'assistant', content: '\uff08\u56de\u590d\u5185\u5bb9\u4e3a\u7a7a\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\uff09', timestamp: Date.now() });
                appendMessageBubble('assistant', '\uff08\u56de\u590d\u5185\u5bb9\u4e3a\u7a7a\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\uff09', Date.now());
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
    floatingBall.addEventListener('click', function() {
        if (isPanelOpen) {
            closePanel();
        } else {
            openPanel();
            if (!CONFIGURED) showNotConfigured();
        }
    });
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
        sendBtn.disabled = !CONFIGURED || isStreaming || !chatInput.value.trim();
    }
    chatInput.addEventListener('input', updateSendButton);

    // ===== 启动 =====
    loadMessages();
    updateSendButton();
})();
