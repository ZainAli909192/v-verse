fetch("../header.html")
    .then(res => res.text())
    .then(html => {
        document.querySelector("#header").innerHTML = html;
        initHeaderEvents();
                initNotificationEvents(); // ← attach notification events
        initMessageEvents();     // ← attach message events
    });

function initHeaderEvents() {
    const profileItem = document.querySelector('[data-profile-toggle]');
    const profileDropdown = document.querySelector('.profile-dropdown');

    if (!profileItem || !profileDropdown) {
        console.warn("Profile dropdown elements not found");
        return;
    }

    profileItem.addEventListener('click', function (e) {
        e.stopPropagation();
        profileDropdown.classList.toggle('active');
    });

    document.addEventListener('click', function () {
        profileDropdown.classList.remove('active');
    });
}

function initNotificationEvents() {

    const notificationsBtn = document.querySelector('.nav-item .fa-bell')?.closest('.nav-item');
    const notificationsContainer = document.querySelector('.notifications-container');

    if (!notificationsBtn || !notificationsContainer) {
        console.warn("Notifications UI not found!");
        return;
    }

    const backBtnNotification = notificationsContainer.querySelector('.back-btn-notification');
    const closeBtn = notificationsContainer.querySelector('.close-btn');
    const notifications = notificationsContainer.querySelectorAll('.notification');

    // Toggle notifications
    notificationsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationsContainer.classList.toggle('active');

        if (notificationsContainer.classList.contains('active')) {
            notificationsContainer.style.display = 'flex';
            notificationsContainer.style.bottom = '0';

            document.querySelector('.notification-badge').textContent = '0';
        } else {
            notificationsContainer.style.bottom = '-600px';
            setTimeout(() => notificationsContainer.style.display = 'none', 300);
        }
    });

    // Close notifications
    closeBtn.addEventListener('click', () => {
        notificationsContainer.classList.remove('active');
        notificationsContainer.style.bottom = '-600px';
        setTimeout(() => notificationsContainer.style.display = 'none', 300);
    });

    // Show notification detail
    notifications.forEach(n => {
        n.addEventListener('click', () => {
            notificationsContainer.querySelector('.notifications-list').style.display = 'none';
            notificationsContainer.querySelector('.notification-detail').style.display = 'flex';
            notificationsContainer.querySelector('.detail-content').textContent =
                n.querySelector('.notification-text').textContent;
        });
    });

    // Back button
    backBtnNotification.addEventListener('click', () => {
        notificationsContainer.querySelector('.notifications-list').style.display = 'block';
        notificationsContainer.querySelector('.notification-detail').style.display = 'none';
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!notificationsContainer.contains(e.target) && !notificationsBtn.contains(e.target)) {
            notificationsContainer.classList.remove('active');
            notificationsContainer.style.bottom = '-600px';
            setTimeout(() => notificationsContainer.style.display = 'none', 300);
        }
    });
}
function initMessageEvents() {
    console.log("Messages UI initializing…");

    const messagesBtn = document.querySelector('.mesgs');
    const messagesContainer = document.querySelector('.messages-container');
    
    if (!messagesBtn || !messagesContainer) {
        console.warn("Messages UI not found. Skipping initialization.");
        return;
    }

    // Buttons
    const minimizeBtn = messagesContainer.querySelector('.minimize-btn');
    const maximizeBtn = messagesContainer.querySelector('.maximize-btn');
    const closeBtn = messagesContainer.querySelector('.close-btn');
    const backBtn = messagesContainer.querySelector('.fa-arrow-left')?.closest('.icon-btn');

    // Sections
    const conversationList = messagesContainer.querySelector('.conversation-list');
    const messageView = messagesContainer.querySelector('.message-view');
    const messageHistory = messagesContainer.querySelector('.message-history');
    const messageInput = messagesContainer.querySelector('.message-input input');
    const sendBtn = messagesContainer.querySelector('.send-btn');

    // State
    let isOpen = false;
    let isMinimized = false;
    let currentConversationId = null;
    let pollInterval = null;
    const pollDelay = 3000;

    // Initialize UI
    updateButtonVisibility();
    if (backBtn) backBtn.style.display = "none";
    messageView.classList.remove('active');
    conversationList.style.display = "block";

    // -------------------------
    // OPEN / CLOSE WINDOW
    // -------------------------
    messagesBtn.addEventListener('click', () => {
        if (!isOpen) openMessaging();
        else if (isMinimized) toggleMinimize();
        else closeMessaging();
    });

    function openMessaging() {
        messagesContainer.classList.add('active');
        messagesContainer.style.display = "flex";
        isOpen = true;
        isMinimized = false;
        updateButtonVisibility();
        loadConversations();
    }

    function closeMessaging() {
        messagesContainer.classList.remove('active');
        messagesContainer.style.display = "none";
        isOpen = false;
        isMinimized = false;
        updateButtonVisibility();
        stopPolling();
    }

    minimizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMinimize();
    });

    maximizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMinimize();
    });

    closeBtn.addEventListener('click', closeMessaging);

    function toggleMinimize() {
        messagesContainer.classList.toggle('minimized');
        isMinimized = !isMinimized;
        updateButtonVisibility();

        if (!isMinimized && currentConversationId) startPolling();
        else stopPolling();
    }

    function updateButtonVisibility() {
        minimizeBtn.style.display = isMinimized ? "none" : "block";
        maximizeBtn.style.display = isMinimized ? "block" : "none";
    }

    // -------------------------
    // CONVERSATION LIST
    // -------------------------
    async function loadConversations() {
        try {
            const response = await fetch('../backend/index/mesgs.php?action=get_conversations');

            const data = await response.json();
            if (data.status === "success") {
                renderConversations(data.conversations);
            }
        } catch (err) {
            console.error("Error loading conversations:", err);
        }
    }

    function renderConversations(conversations) {
        conversationList.innerHTML = '';

        if (conversations.length === 0) {
            conversationList.innerHTML = '<div class="no-conversations">No conversations yet</div>';
            return;
        }

        conversations.forEach(conv => {
            const el = document.createElement('div');
            el.classList.add('conversation');
            el.dataset.conversationId = conv.id;
            el.dataset.userId = conv.other_user_id;

            const timeAgo = formatTimeAgo(conv.last_message_time);

            el.innerHTML = `
                <div class="avatar">
                    <img src="../${conv.profile_image || 'default-avatar.jpg'}">
                </div>
                <div class="conversation-details">
                    <div class="conversation-header">
                        <span class="name">${conv.name}</span>
                        <span class="time">${timeAgo}</span>
                    </div>
                    <p class="last-message">${conv.last_message || 'No messages yet'}</p>
                </div>`;

            el.addEventListener('click', () => {
                openConversation(
                    conv.id,
                    conv.other_user_id,
                    conv.name,
                    conv.profile_image
                );
            });

            conversationList.appendChild(el);
        });
    }

    // -------------------------
    // OPEN A CONVERSATION
    // -------------------------
    function openConversation(conversationId, userId, name, img) {
        currentConversationId = conversationId;

        const recipient = document.querySelector('.recipient-info');
        recipient.innerHTML = `
            <div class="avatar"><img src="${img || 'default-avatar.jpg'}"></div>
            <div><h4>${name}</h4>
            <p>Veterinary Specialist</p></div>
        `;

        messageView.classList.add('active');
        conversationList.style.display = "none";
        backBtn.style.display = 'block';

        loadMessages(conversationId);
        startPolling();
    }

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            messageView.classList.remove('active');
            conversationList.style.display = "block";
            backBtn.style.display = "none";
            stopPolling();
        });
    }

    // -------------------------
    // LOAD MESSAGES
    // -------------------------
    async function loadMessages(conversationId) {
        try {
            const res = await fetch(
                `../backend/index/mesgs.php?action=get_messages&conversation_id=${conversationId}`
            );

            const data = await res.json();
            if (data.status === 'success') {
                renderMessages(data.messages);
            }
        } catch (err) {
            console.error("Error loading messages:", err);
        }
    }

    function renderMessages(messages) {
        messageHistory.innerHTML = '';

        messages.forEach(msg => {
            const el = document.createElement('div');
            el.className = `message ${msg.is_sent ? 'sent' : 'received'}`;

            el.innerHTML = `
                <p>${msg.content}</p>
                <span class="time">${formatTime(msg.created_at)}</span>
            `;

            messageHistory.appendChild(el);
        });

        messageHistory.scrollTop = messageHistory.scrollHeight;
    }

    // -------------------------
    // SEND MESSAGE
    // -------------------------
    async function sendMessage() {
        const txt = messageInput.value.trim();
        if (!txt) return;

        if (!currentConversationId) return alert("Open a conversation first.");

        const form = new FormData();
        form.append("conversation_id", currentConversationId);
        form.append("content", txt);

        try {
            const res = await fetch('../backend/index/mesgs.php?action=send_message', {
                method: 'POST',
                body: form
            });

            const data = await res.json();
            if (data.status === "success") {
                messageInput.value = "";
                loadMessages(currentConversationId);
            }
        } catch (err) {
            console.error("Send error:", err);
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === "Enter") sendMessage();
    });

    // -------------------------
    // POLLING FOR NEW MESSAGES
    // -------------------------
    function startPolling() {
        stopPolling();
        pollInterval = setInterval(() => {
            if (currentConversationId) loadMessages(currentConversationId);
        }, pollDelay);
    }

    function stopPolling() {
        if (pollInterval) clearInterval(pollInterval);
        pollInterval = null;
    }

    // -------------------------
    // UTILITIES
    // -------------------------
    function formatTime(ts) {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    function formatTimeAgo(ts) {
        if (!ts) return "";
        const now = new Date();
        const d = new Date(ts);
        const diff = (now - d) / 1000;

        if (diff < 60) return "Just now";
        if (diff < 3600) return Math.floor(diff / 60) + "m ago";
        if (diff < 86400) return Math.floor(diff / 3600) + "h ago";

        const days = Math.floor(diff / 86400);
        return days === 1 ? "Yesterday" : days + "d ago";
    }

    // -------------------------
    // UNREAD COUNT
    // -------------------------
    async function updateUnreadCount() {
        try {
            const res = await fetch('../backend/index/mesgs.php?action=get_unread_count');
            const data = await res.json();

            if (data.status === 'success') {
                const badge = document.querySelector('.message-badge');
                badge.textContent = data.unread_count;
            }
        } catch (e) {
            console.error("Unread count error:", e);
        }
    }

    setInterval(updateUnreadCount, 3000);
    updateUnreadCount();
}
