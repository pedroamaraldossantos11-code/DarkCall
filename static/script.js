/*
 * DARKCALL v2
 * ----------------------------------------------------------------
 * Real-time rooms via WebSocket + WebRTC signaling.
 *
 * Architecture:
 * - WebSocket  -> signaling, chat, presence
 * - WebRTC     -> peer-to-peer audio/video (signaling only via server)
 * - localStorage -> username, recent rooms (local prefs only)
 */

"use strict";

/* =========================================================
   CONFIG
========================================================= */

const WS_URL =
    (location.protocol === "https:" ? "wss://" : "ws://") +
    location.host + "/ws";

/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEYS = {
    username: "darkcall_username",
    recentRooms: "darkcall_recent_rooms",
    avatar: "darkcall_avatar",
};

function getUsername() {
    return localStorage.getItem(STORAGE_KEYS.username) || "";
}

function saveUsername(name) {
    const clean = name.trim().slice(0, 24);
    if (!clean) return false;
    localStorage.setItem(STORAGE_KEYS.username, clean);
    return true;
}

function getRecentRooms() {
    try {
        return JSON.parse(
            localStorage.getItem(STORAGE_KEYS.recentRooms) || "[]"
        );
    } catch {
        return [];
    }
}

function saveRecentRoom(code) {
    let rooms = getRecentRooms().filter(r => r !== code);
    rooms.unshift(code);
    rooms = rooms.slice(0, 8);
    localStorage.setItem(STORAGE_KEYS.recentRooms, JSON.stringify(rooms));
}

function clearRecentRooms() {
    localStorage.removeItem(STORAGE_KEYS.recentRooms);
    renderRecentRooms();
    renderSidebarRecentRooms();
}

function getAvatar() {
    return localStorage.getItem(STORAGE_KEYS.avatar) || "";
}

function saveAvatar(dataUrl) {
    localStorage.setItem(STORAGE_KEYS.avatar, dataUrl);
}

function removeAvatar() {
    localStorage.removeItem(STORAGE_KEYS.avatar);
}

/* =========================================================
   DOM
========================================================= */

const $ = id => document.getElementById(id);

const homeScreen = $("homeScreen");
const callScreen = $("callScreen");

const roomModal = $("roomModal");
const joinModal = $("joinModal");
const settingsModal = $("settingsModal");

const createRoomBtn = $("createRoomBtn");
const joinRoomBtn = $("joinRoomBtn");

const generatedCode = $("generatedCode");
const copyCodeBtn = $("copyCodeBtn");
const copyCodeText = $("copyCodeText");
const shareUrl = $("shareUrl");
const copyUrlBtn = $("copyUrlBtn");
const enterCreatedRoomBtn = $("enterCreatedRoomBtn");

const confirmJoinBtn = $("confirmJoinBtn");
const joinError = $("joinError");

const usernameInput = $("usernameInput");
const saveSettingsBtn = $("saveSettingsBtn");
const settingsAvatarPreview = $("settingsAvatarPreview");
const settingsAvatarInitials = $("settingsAvatarInitials");
const settingsAvatarImg = $("settingsAvatarImg");
const avatarFileInput = $("avatarFileInput");
const removeAvatarBtn = $("removeAvatarBtn");

const activeRoomCode = $("activeRoomCode");
const chatRoomCode = $("chatRoomCode");

const localVideo = $("localVideo");
const localAvatar = $("localAvatar");
const localCard = $("localCard");

const localName = $("localName");
const sidebarUsername = $("sidebarUsername");
const sidebarAvatar = $("sidebarAvatar");
const sidebarUserStatus = $("sidebarUserStatus");
const localAvatarText = $("localAvatarText");
const localAvatarImg = $("localAvatarImg");

const localMicStatus = $("localMicStatus");

const micBtn = $("micBtn");
const cameraBtn = $("cameraBtn");
const screenShareBtn = $("screenShareBtn");

const screenShareContainer = $("screenShareContainer");
const screenVideo = $("screenVideo");
const stopScreenShareTop = $("stopScreenShareTop");

const remoteScreenContainer = $("remoteScreenContainer");
const remoteScreenVideo = $("remoteScreenVideo");
const remoteScreenName = $("remoteScreenName");

const chatBtn = $("chatBtn");
const closeChatBtn = $("closeChatBtn");
const chatPanel = $("chatPanel");

const chatMessages = $("chatMessages");
const chatForm = $("chatForm");
const chatInput = $("chatInput");

const leaveBtn = $("leaveBtn");
const participantCount = $("participantCount");

const sidebar = $("sidebar");
const mobileMenuBtn = $("mobileMenuBtn");

const devicePrompt = $("devicePrompt");
const devBothBtn = $("devBothBtn");
const devMicBtn = $("devMicBtn");
const devNoneBtn = $("devNoneBtn");

const toastContainer = $("toastContainer");

const recentRooms = $("recentRooms");
const sidebarRecentRooms = $("sidebarRecentRooms");

const connectionStatus = $("connectionStatus");

/* =========================================================
   APPLICATION STATE
========================================================= */

const state = {
    currentRoom: null,
    username: getUsername() || "Voce",
    micEnabled: false,
    cameraEnabled: false,
    micStream: null,
    cameraStream: null,
    screenStream: null,
    chatOpen: false,
    ws: null,
    connected: false,
    peers: new Map(),
    localUid: null,
    localName: null,
    avatar: getAvatar(),
    remoteScreen: null,
};

/* =========================================================
   UTILS
========================================================= */

function generateRoomCode() {
    return String(Math.floor(1000 + Math.random() * 9000));
}

function getInitials(name) {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "?";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function escapeHTML(value) {
    const d = document.createElement("div");
    d.textContent = value;
    return d.innerHTML;
}

/* =========================================================
   TOAST
========================================================= */

function showToast(message, type = "normal") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${type === "success" ? "\u2713" : type === "error" ? "\u2717" : "\u25CF"}</span>
        <span>${escapeHTML(message)}</span>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("toast-out");
        setTimeout(() => toast.remove(), 200);
    }, 2500);
}

/* =========================================================
   MODALS
========================================================= */

function openModal(modal) {
    modal.classList.remove("hidden");
}

function closeModal(modal) {
    modal.classList.add("hidden");
}

document.querySelectorAll("[data-close-modal]").forEach(btn => {
    btn.addEventListener("click", () => {
        const m = document.getElementById(btn.dataset.closeModal);
        if (m) closeModal(m);
    });
});

document.querySelectorAll(".modal-overlay").forEach(ov => {
    ov.addEventListener("click", e => {
        if (e.target === ov) closeModal(ov);
    });
});

document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        document.querySelectorAll(".modal-overlay").forEach(closeModal);
    }
});

/* =========================================================
   WEBSOCKET
========================================================= */

function connectWS() {
    if (state.ws && state.ws.readyState <= 1) return;

    const ws = new WebSocket(WS_URL);
    state.ws = ws;

    ws.onopen = () => {
        state.connected = true;
        updateConnectionUI(true);

        if (pendingJoinCode) {
            const code = pendingJoinCode;
            pendingJoinCode = null;
            setTimeout(() => enterRoom(code), 300);
            return;
        }

        if (state.currentRoom) {
            // re-enter room after reconnect
            ws.send(JSON.stringify({ type: "ping" }));
        }
    };

    ws.onclose = () => {
        state.connected = false;
        updateConnectionUI(false);
        setTimeout(connectWS, 2000);
    };

    ws.onerror = () => {
        updateConnectionUI(false);
    };

    ws.onmessage = event => {
        let data;
        try {
            data = JSON.parse(event.data);
        } catch {
            return;
        }
        handleWSMessage(data);
    };
}

function wsSend(data) {
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
        state.ws.send(JSON.stringify(data));
    }
}

function updateConnectionUI(connected) {
    const el = connectionStatus;
    el.classList.remove("connected", "error");

    const text = el.querySelector(".conn-text");

    if (connected) {
        el.classList.add("connected");
        text.textContent = "Conectado ao servidor";
        createRoomBtn.disabled = false;
        joinRoomBtn.disabled = false;
    } else {
        el.classList.add("error");
        text.textContent = "Reconectando...";
        createRoomBtn.disabled = true;
        joinRoomBtn.disabled = true;
    }
}

/* =========================================================
   WS MESSAGE HANDLER
========================================================= */

function handleWSMessage(data) {
    switch (data.type) {

        case "joined":
            state.localUid = data.uid;
            break;

        case "participant_joined":
            participantCount.textContent = data.count;
            addRemoteParticipant(data.uid, data.name, data.avatar);
            break;

        case "participant_left":
            participantCount.textContent = data.count;
            removeRemoteParticipant(data.uid);
            break;

        case "room_users":
            participantCount.textContent = data.count || data.users?.length + 1 || 1;
            (data.users || []).forEach(u => {
                addRemoteParticipant(u.uid, u.name, u.avatar);
            });
            break;

        case "user_update":
            updateRemoteParticipantInfo(data.uid, data.name, data.avatar);
            break;

        case "chat_message":
            appendChatMessage(data.name, data.text);
            break;

        case "chat_history":
            if (data.messages) {
                data.messages.forEach(m => appendChatMessage(m.name, m.text));
                scrollChatToBottom();
            }
            break;

        case "offer":
        case "answer":
        case "ice-candidate":
            handleWebRTCSignaling(data);
            break;

        case "screen_share":
            if (data.sharing) {
                remoteScreenName.textContent = data.name || "Participante";
                remoteScreenContainer.classList.remove("hidden");
                state.remoteScreen = data.uid;
            } else {
                remoteScreenContainer.classList.add("hidden");
                remoteScreenVideo.srcObject = null;
                state.remoteScreen = null;
            }
            break;
    }
}

/* =========================================================
   REMOTE PARTICIPANTS
========================================================= */

const AVATAR_COLORS = [
    "linear-gradient(135deg, #247cff, #16b6ff)",
    "linear-gradient(135deg, #743dff, #bd3dff)",
    "linear-gradient(135deg, #ff526d, #ff8a5c)",
    "linear-gradient(135deg, #42d69c, #24b0ff)",
    "linear-gradient(135deg, #ffc824, #ff5c8a)",
];

function getAvatarColor(uid) {
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
        hash = uid.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function hideEmptySlots() {
    const slots = document.querySelectorAll(".empty-slot");
    const shown = [...slots].filter(s => !s.classList.contains("hidden"));
    const remoteCount = document.querySelectorAll(".remote-card").length;

    if (remoteCount >= shown.length) {
        shown.forEach(s => s.classList.add("hidden"));
    }
}

function showEmptySlots() {
    const slots = document.querySelectorAll(".empty-slot");
    const hidden = [...slots].filter(s => s.classList.contains("hidden"));
    const remoteCount = document.querySelectorAll(".remote-card").length;
    const wanted = Math.max(0, 3 - remoteCount);

    slots.forEach((slot, i) => {
        const show = i < wanted;
        slot.classList.toggle("hidden", !show);
    });
}

function addRemoteParticipant(uid, name = "Participante", avatar = "") {
    const grid = $("videoGrid");

    if (document.getElementById(`remote-${uid}`)) return;

    const card = document.createElement("article");
    card.className = "video-card remote-card";
    card.id = `remote-${uid}`;

    const color = getAvatarColor(uid);
    const avatarHtml = avatar
        ? `<img class="fake-avatar-img" src="${escapeHTML(avatar)}" alt="">`
        : `<div class="fake-avatar" style="background: ${color}">${name.slice(0, 1).toUpperCase() || "?"}</div>`;

    card.innerHTML = `
        <div class="fake-video">
            ${avatarHtml}
            <div class="video-joining">Conectando...</div>
        </div>
        <video id="remoteVideo-${uid}" autoplay playsinline style="display:none"></video>
        <div class="video-gradient"></div>
        <div class="video-user-info">
            <span class="remote-name">${escapeHTML(name)}</span>
            <span class="remote-mic">&#127908;</span>
        </div>
    `;

    grid.insertBefore(card, document.querySelector(".empty-slot"));
    hideEmptySlots();

    // Initiate WebRTC to new peer
    createPeerConnection(uid);
}

function updateRemoteParticipantInfo(uid, name, avatar) {
    const card = document.getElementById(`remote-${uid}`);
    if (!card) return;

    const nameEl = card.querySelector(".remote-name");
    if (nameEl) nameEl.textContent = name;

    if (avatar) {
        const fake = card.querySelector(".fake-video");
        if (fake) {
            const avatarEl = fake.querySelector(".fake-avatar, .fake-avatar-img");
            if (avatarEl && !avatarEl.classList.contains("fake-avatar-img")) {
                const img = document.createElement("img");
                img.className = "fake-avatar-img";
                img.src = avatar;
                avatarEl.replaceWith(img);
            }
        }
    }
}

function removeRemoteParticipant(uid) {
    const el = document.getElementById(`remote-${uid}`);
    if (el) el.remove();

    const pc = state.peers.get(uid);
    if (pc) {
        pc.close();
        state.peers.delete(uid);
    }

    showEmptySlots();
}

/* =========================================================
   WebRTC
========================================================= */

const RTC_CONFIG = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ],
};

function createPeerConnection(uid) {
    if (state.peers.has(uid)) {
        return state.peers.get(uid);
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pc.__makingOffer = false;
    pc.__ignoreOffer = false;
    pc.__polite = null; // decided lazily once we know our uid
    state.peers.set(uid, pc);

    // Add local tracks
    if (state.micStream) {
        state.micStream.getTracks().forEach(track => {
            pc.addTrack(track, state.micStream);
        });
    }

    if (state.cameraStream) {
        state.cameraStream.getTracks().forEach(track => {
            pc.addTrack(track, state.cameraStream);
        });
    }

    if (state.screenStream) {
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        if (sender && state.screenStream.getVideoTracks()[0]) {
            sender.replaceTrack(state.screenStream.getVideoTracks()[0]);
        }
    }

    pc._hasRemoteVideo = false;

    pc.ontrack = event => {
        if (event.track.kind !== "video" || !event.streams[0]) return;

        if (!pc._hasRemoteVideo) {
            // First video → goes to the video card
            pc._hasRemoteVideo = true;
            const video = document.getElementById(`remoteVideo-${uid}`);
            if (video) {
                video.srcObject = event.streams[0];
                video.style.display = "block";
                const fakeVideo = video.parentElement?.querySelector(".fake-video");
                if (fakeVideo) fakeVideo.style.display = "none";
            }
        } else {
            // Subsequent video → screen share, goes to remote screen overlay
            remoteScreenVideo.srcObject = event.streams[0];
            remoteScreenContainer.classList.remove("hidden");
            state.remoteScreen = uid;
        }
    };

    pc.onicecandidate = event => {
        if (event.candidate) {
            wsSend({
                type: "ice-candidate",
                target: uid,
                candidate: event.candidate,
            });
        }
    };

    pc.onnegotiationneeded = async () => {
        if (pc.__makingOffer) return;
        try {
            pc.__makingOffer = true;
            await pc.setLocalDescription();
            wsSend({ type: "offer", target: uid, sdp: pc.localDescription });
        } catch (err) {
            console.error("negotiationneeded error:", err);
        } finally {
            pc.__makingOffer = false;
        }
    };

    pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "failed" && !pc.__triedRestart) {
            pc.__triedRestart = true;
            setTimeout(() => {
                if (state.peers.has(uid)) pc.restartIce();
            }, 2500);
        }
    };

    pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
            removeRemoteParticipant(uid);
        }
    };

    return pc;
}

function isPolite(uid) {
    // lower uid is polite; higher uid is impolite (initiator)
    if (!state.localUid) return null;
    return String(state.localUid).toLowerCase() < String(uid).toLowerCase();
}

async function handleWebRTCSignaling(data) {
    const sender = data.sender || data.target;

    if (data.type === "offer") {
        const pc = getOrCreatePCForSignaling(sender);
        pc.__polite = pc.__polite ?? isPolite(sender);
        if (pc.__polite === null) return;

        const offerCollision =
            data.sdp.type === "offer" &&
            (pc.__makingOffer || pc.signalingState !== "stable");

        pc.__ignoreOffer = !pc.__polite && offerCollision;
        if (pc.__ignoreOffer) {
            return;
        }

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            await pc.setLocalDescription();
            wsSend({ type: "answer", target: sender, sdp: pc.localDescription });
        } catch (err) {
            console.error("offer handling error:", err);
        }

    } else if (data.type === "answer") {
        const pc = state.peers.get(sender);
        if (!pc) return;

        pc.__polite = pc.__polite ?? isPolite(sender);

        if (pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        }
        // else: rolling-back answer (from a collision); ignore

    } else if (data.type === "ice-candidate") {
        const pc = state.peers.get(sender);
        if (!pc || !data.candidate) {
            return;
        }
        try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
            if (!pc.__ignoreOffer) console.error("addIceCandidate error:", err);
        }
    }
}

function getOrCreatePCForSignaling(uid) {
    if (!state.peers.has(uid)) {
        return createPeerConnection(uid);
    }
    return state.peers.get(uid);
}

/* =========================================================
   HOME - RECENT ROOMS
========================================================= */

function renderRecentRooms() {
    const rooms = getRecentRooms();
    recentRooms.innerHTML = "";

    if (!rooms.length) {
        recentRooms.innerHTML = `<div class="empty-recent">Nenhuma sala utilizada recentemente.</div>`;
        return;
    }

    rooms.forEach(code => {
        const btn = document.createElement("button");
        btn.className = "recent-room";
        btn.textContent = `#${code}`;
        btn.addEventListener("click", () => enterRoom(code));
        recentRooms.appendChild(btn);
    });
}

function renderSidebarRecentRooms() {
    const rooms = getRecentRooms();
    sidebarRecentRooms.innerHTML = "";

    if (!rooms.length) {
        sidebarRecentRooms.innerHTML = `<div class="sidebar-room" style="cursor:default">Nenhuma sala</div>`;
        return;
    }

    rooms.forEach(code => {
        const btn = document.createElement("button");
        btn.className = "sidebar-room";
        btn.textContent = `# ${code}`;
        btn.addEventListener("click", () => {
            enterRoom(code);
            sidebar.classList.remove("open");
        });
        sidebarRecentRooms.appendChild(btn);
    });
}

/* =========================================================
   CREATE / JOIN ROOM
========================================================= */

function createRoom() {
    const code = generateRoomCode();
    generatedCode.textContent = code;
    copyCodeText.textContent = "";
    shareUrl.value = getShareableUrl(code);
    openModal(roomModal);
}

function getShareableUrl(code) {
    return `${location.origin}/join/${code}`;
}

createRoomBtn.addEventListener("click", createRoom);

joinRoomBtn.addEventListener("click", () => {
    openModal(joinModal);
    joinError.textContent = "";
    setTimeout(() => document.querySelector(".code-input")?.focus(), 100);
});

/* =========================================================
   COPY CODE
========================================================= */

async function copyRoomCode() {
    const code = generatedCode.textContent;
    try {
        await navigator.clipboard.writeText(code);
    } catch {
        const t = document.createElement("textarea");
        t.value = code;
        document.body.appendChild(t);
        t.select();
        document.execCommand("copy");
        t.remove();
    }
    copyCodeText.textContent = "Codigo copiado!";
    showToast("Codigo copiado!", "success");
}

copyCodeBtn.addEventListener("click", copyRoomCode);

copyUrlBtn.addEventListener("click", async () => {
    const url = shareUrl.value;
    try {
        await navigator.clipboard.writeText(url);
    } catch {
        const t = document.createElement("textarea");
        t.value = url;
        document.body.appendChild(t);
        t.select();
        document.execCommand("copy");
        t.remove();
    }
    copyCodeText.textContent = "Link copiado!";
    showToast("Link copiado!", "success");
});

/* =========================================================
   JOIN CODE INPUTS
========================================================= */

const codeInputs = Array.from(document.querySelectorAll(".code-input"));

codeInputs.forEach((input, i) => {
    input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "");
        if (input.value && i < codeInputs.length - 1) {
            codeInputs[i + 1].focus();
        }
    });

    input.addEventListener("keydown", e => {
        if (e.key === "Backspace" && !input.value && i > 0) {
            codeInputs[i - 1].focus();
        }
    });

    input.addEventListener("paste", e => {
        e.preventDefault();
        const p = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 4);
        p.split("").forEach((n, j) => {
            if (codeInputs[j]) codeInputs[j].value = n;
        });
        if (p.length === 4) codeInputs[3].focus();
    });
});

function getEnteredCode() {
    return codeInputs.map(i => i.value).join("");
}

function clearJoinInputs() {
    codeInputs.forEach(i => (i.value = ""));
}

confirmJoinBtn.addEventListener("click", () => {
    const code = getEnteredCode();
    if (!/^\d{4}$/.test(code)) {
        joinError.textContent = "Digite exatamente 4 numeros.";
        return;
    }
    enterRoom(code);
});

/* =========================================================
   ENTER / LEAVE ROOM
========================================================= */

function enterRoom(code) {
    if (!/^\d{4}$/.test(code)) {
        showToast("Codigo de sala invalido.", "error");
        return;
    }

    if (!state.connected) {
        showToast("Aguardando conexao com o servidor...", "error");
        return;
    }

    closeModal(roomModal);
    closeModal(joinModal);
    clearJoinInputs();

    state.currentRoom = code;

    saveRecentRoom(code);

    showCallScreen();

    // Show device prompt for camera/mic
    showDevicePrompt();

    // Join via WebSocket
    wsSend({
        type: "join_room",
        room: state.currentRoom,
        name: state.username,
        avatar: state.avatar || "",
    });

    showToast(`Voce entrou na sala #${code}`, "success");
}

enterCreatedRoomBtn.addEventListener("click", () => {
    enterRoom(generatedCode.textContent);
});

/* =========================================================
   CALL SCREEN
========================================================= */

function showCallScreen() {
    homeScreen.classList.add("hidden");
    callScreen.classList.remove("hidden");

    activeRoomCode.textContent = state.currentRoom;
    chatRoomCode.textContent = state.currentRoom;

    updateUserUI();
    renderRecentRooms();
    renderSidebarRecentRooms();

    participantCount.textContent = "1";

    showEmptySlots();
    resetMediaState();
}

function showHomeScreen() {
    stopCamera();
    stopMicrophone();
    stopScreenShare();

    // Close all peer connections
    state.peers.forEach(pc => pc.close());
    state.peers.clear();

    // Clear remote cards
    document.querySelectorAll(".remote-card").forEach(el => el.remove());

    // Show all empty slots again
    document.querySelectorAll(".empty-slot").forEach(el => {
        el.classList.remove("hidden");
    });

    // Leave room via WS
    if (state.currentRoom) {
        wsSend({ type: "leave_room", room: state.currentRoom });
    }

    callScreen.classList.add("hidden");
    homeScreen.classList.remove("hidden");
    sidebar.classList.remove("open");
    chatPanel.classList.add("hidden");
    devicePrompt.classList.add("hidden");
    remoteScreenContainer.classList.add("hidden");
    remoteScreenVideo.srcObject = null;
    state.remoteScreen = null;

    state.currentRoom = null;
    state.chatOpen = false;
    chatBtn.classList.remove("active");

    renderRecentRooms();
    renderSidebarRecentRooms();
}

function updateUserUI() {
    const name = state.username;
    const initials = getInitials(name);
    const avatar = getAvatar();

    localName.textContent = name;
    sidebarUsername.textContent = name;

    localAvatarText.textContent = initials;
    sidebarAvatar.textContent = initials;
    usernameInput.value = name;

    // Apply custom avatar if present
    if (avatar) {
        localAvatarImg.src = avatar;
        localAvatarImg.classList.remove("hidden");
        localAvatarText.classList.add("hidden");

        sidebarAvatar.innerHTML = "";
        const img = document.createElement("img");
        img.src = avatar;
        sidebarAvatar.appendChild(img);
        sidebarAvatar.classList.add("avatar-with-img");
    } else {
        localAvatarImg.classList.add("hidden");
        localAvatarImg.src = "";
        localAvatarText.classList.remove("hidden");

        sidebarAvatar.innerHTML = initials;
        sidebarAvatar.classList.remove("avatar-with-img");
    }

    // Settings preview
    const previewInitials = settingsAvatarInitials;
    const previewImg = settingsAvatarImg;

    if (avatar) {
        previewImg.src = avatar;
        previewImg.classList.remove("hidden");
        previewInitials.classList.add("hidden");
    } else {
        previewImg.src = "";
        previewImg.classList.add("hidden");
        previewInitials.textContent = initials;
        previewInitials.classList.remove("hidden");
    }
    removeAvatarBtn.classList.toggle("hidden", !avatar);
}

/* =========================================================
   SETTINGS
========================================================= */

function openSettings() {
    usernameInput.value = state.username;
    updateUserUI();
    openModal(settingsModal);
}

$("homeSettingsBtn").addEventListener("click", openSettings);
$("callSettingsBtn").addEventListener("click", openSettings);

avatarFileInput.addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        showToast("Arquivo invalido. Envie uma imagem.", "error");
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        showToast("Imagem muito grande. Maximo 2MB.", "error");
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        const dataUrl = reader.result;
        saveAvatar(dataUrl);
        state.avatar = dataUrl;
        updateUserUI();
        showToast("Foto de perfil atualizada!", "success");
    };
    reader.readAsDataURL(file);
});

removeAvatarBtn.addEventListener("click", () => {
    removeAvatar();
    state.avatar = "";
    updateUserUI();
    showToast("Foto de perfil removida.", "success");
});

saveSettingsBtn.addEventListener("click", () => {
    const name = usernameInput.value.trim();
    if (!name) {
        showToast("Digite um nome valido.", "error");
        return;
    }
    if (!saveUsername(name)) return;

    state.username = name;
    updateUserUI();
    closeModal(settingsModal);
    showToast("Nome atualizado!", "success");
});

/* =========================================================
   MEDIA TRACKS SYNC
========================================================= */

function syncTracksToPeers() {
    const videoTrack = state.cameraStream?.getVideoTracks()[0] || null;
    const audioTrack = state.micStream?.getAudioTracks()[0] || null;

    state.peers.forEach(pc => {
        const senders = pc.getSenders();
        const vs = senders.find(s => s.track?.kind === "video");
        const as = senders.find(s => s.track?.kind === "audio");

        if (vs) vs.replaceTrack(videoTrack);
        else if (videoTrack) {
            try { pc.addTrack(videoTrack, state.cameraStream); } catch (e) {}
        }

        if (as) as.replaceTrack(audioTrack);
        else if (audioTrack) {
            try { pc.addTrack(audioTrack, state.micStream); } catch (e) {}
        }
    });
}

/* =========================================================
   MICROPHONE
========================================================= */

async function toggleMicrophone() {
    if (state.micEnabled) {
        stopMicrophone();
        return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
        showToast("Seu navegador nao permite acesso ao microfone.", "error");
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true },
        });
        const track = stream.getAudioTracks()[0];
        if (!track) { showToast("Nenhum microfone encontrado.", "error"); return; }
        state.micStream = new MediaStream([track]);
        state.micEnabled = true;
        updateMicrophoneUI();
        syncTracksToPeers();
        showToast("Microfone ativado.", "success");
    } catch (err) {
        console.error(err);
        let msg = "Nao foi possivel acessar o microfone.";
        if (err.name === "NotAllowedError" || err.name === "SecurityError")
            msg = "Permissao negada: clique no icone no endereco do navegador e permita.";
        showToast(msg, "error");
    }
}

function stopMicrophone() {
    if (state.micStream) {
        state.micStream.getTracks().forEach(t => t.stop());
        state.micStream = null;
    }
    state.micEnabled = false;
    updateMicrophoneUI();
    syncTracksToPeers();
}

function updateMicrophoneUI() {
    micBtn.classList.toggle("active", state.micEnabled);
    micBtn.classList.toggle("muted", !state.micEnabled);
    localMicStatus.textContent = state.micEnabled ? "\uD83C\uDF99" : "\uD83D\uDD07";
}

micBtn.addEventListener("click", toggleMicrophone);
$("sidebarMicBtn").addEventListener("click", toggleMicrophone);

/* =========================================================
   CAMERA
========================================================= */

async function toggleCamera() {
    if (state.cameraEnabled) {
        stopCamera();
        return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
        showToast("Camera nao disponivel: abra em http://localhost:8765 (nao por file://).", "error");
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        const track = stream.getVideoTracks()[0];
        if (!track) { showToast("Nenhuma camera encontrada.", "error"); return; }
        state.cameraStream = new MediaStream([track]);
        state.cameraEnabled = true;
        localVideo.srcObject = state.cameraStream;
        localCard.classList.remove("camera-off");
        localAvatar.classList.add("hidden");
        cameraBtn.classList.add("active");
        syncTracksToPeers();
        showToast("Camera ativada.", "success");
    } catch (err) {
        console.error(err);
        let msg = "Nao foi possivel acessar a camera.";
        if (err.name === "NotAllowedError" || err.name === "SecurityError")
            msg = "Permissao negada: clique no icone da camera no endereco do navegador e permita.";
        else if (err.name === "NotFoundError")
            msg = "Nenhuma camera encontrada neste dispositivo.";
        else if (err.name === "NotReadableError")
            msg = "Camera em uso por outro programa. Feche e tente de novo.";
        showToast(msg, "error");
    }
}

function stopCamera() {
    if (state.cameraStream) {
        state.cameraStream.getTracks().forEach(t => t.stop());
        state.cameraStream = null;
    }
    localVideo.srcObject = null;
    state.cameraEnabled = false;
    localCard.classList.add("camera-off");
    localAvatar.classList.remove("hidden");
    cameraBtn.classList.remove("active");
    syncTracksToPeers();
}

cameraBtn.addEventListener("click", toggleCamera);

/* =========================================================
   DEVICE PROMPT (shown when entering a room)
========================================================= */

function showDevicePrompt() {
    if (!navigator.mediaDevices?.getUserMedia) {
        return;
    }
    devicePrompt.classList.remove("hidden");
}

function hideDevicePrompt() {
    devicePrompt.classList.add("hidden");
}

devBothBtn.addEventListener("click", async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: { echoCancellation: true, noiseSuppression: true },
        });

        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        if (videoTrack) {
            state.cameraStream = new MediaStream([videoTrack]);
            state.cameraEnabled = true;
            localVideo.srcObject = state.cameraStream;
            localCard.classList.remove("camera-off");
            localAvatar.classList.add("hidden");
            cameraBtn.classList.add("active");
        }

        if (audioTrack) {
            state.micStream = new MediaStream([audioTrack]);
            state.micEnabled = true;
            updateMicrophoneUI();
        }

        syncTracksToPeers();
        hideDevicePrompt();
        showToast("Camera e microfone ativados!", "success");
    } catch (err) {
        console.error(err);
        let msg = "Nao foi possivel acessar camera/microfone.";
        if (err.name === "NotAllowedError" || err.name === "SecurityError")
            msg = "Permissao negada: verifique as permissoes do navegador.";
        showToast(msg, "error");
    }
});

devMicBtn.addEventListener("click", async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true },
        });
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
            state.micStream = new MediaStream([audioTrack]);
            state.micEnabled = true;
            updateMicrophoneUI();
            syncTracksToPeers();
        }
        hideDevicePrompt();
        showToast("Microfone ativado!", "success");
    } catch (err) {
        console.error(err);
        let msg = "Nao foi possivel acessar o microfone.";
        if (err.name === "NotAllowedError" || err.name === "SecurityError")
            msg = "Permissao negada: verifique as permissoes do navegador.";
        showToast(msg, "error");
    }
});

devNoneBtn.addEventListener("click", () => {
    hideDevicePrompt();
});

/* =========================================================
   SCREEN SHARING
========================================================= */

async function toggleScreenShare() {
    if (state.screenStream) {
        stopScreenShare();
        return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
        showToast("Seu navegador nao suporta compartilhamento de tela.", "error");
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        state.screenStream = stream;
        screenVideo.srcObject = stream;
        screenShareContainer.classList.remove("hidden");
        screenShareBtn.classList.add("active");

        stream.getVideoTracks()[0]?.addEventListener("ended", () => stopScreenShare());

        const screenTrack = stream.getVideoTracks()[0];

        // Add screen track to all peers (fires ontrack for remote screen overlay)
        state.peers.forEach(pc => {
            try { pc.addTrack(screenTrack, stream); } catch (e) {}
        });

        wsSend({ type: "screen_share", sharing: true });
        showToast("Tela compartilhando.", "success");
    } catch (err) {
        if (err.name !== "AbortError") {
            console.error(err);
            showToast("Nao foi possivel compartilhar sua tela.", "error");
        }
    }
}

function stopScreenShare() {
    if (state.screenStream) {
        state.screenStream.getTracks().forEach(t => t.stop());
        state.screenStream = null;
    }

    // Restore camera track on all peers
    const camTrack = state.cameraStream?.getVideoTracks()[0] || null;
    state.peers.forEach(pc => {
        // Restore the replaced track
        const vs = pc.getSenders().find(s => s.track?.kind === "video");
        if (vs) {
            vs.replaceTrack(camTrack);
        }
        // Remove any extra screen tracks that were added
        pc.getSenders().forEach(s => {
            if (s.track && /screen|display|entire|window/i.test(s.track.label || "")) {
                try { pc.removeTrack(s); } catch (e) {}
            }
        });
    });

    screenVideo.srcObject = null;
    screenShareContainer.classList.add("hidden");
    screenShareBtn.classList.remove("active");

    wsSend({ type: "screen_share", sharing: false });
}

screenShareBtn.addEventListener("click", toggleScreenShare);
stopScreenShareTop.addEventListener("click", stopScreenShare);

/* =========================================================
   MEDIA RESET
========================================================= */

function resetMediaState() {
    stopCamera();
    stopMicrophone();
    stopScreenShare();
    updateMicrophoneUI();
}

/* =========================================================
   CHAT
========================================================= */

function appendChatMessage(name, text) {
    const el = document.createElement("div");
    el.className = "chat-message";
    el.innerHTML = `
        <div class="message-name">${escapeHTML(name)}</div>
        <div class="message-text">${escapeHTML(text)}</div>
    `;
    chatMessages.appendChild(el);
    scrollChatToBottom();
}

function addSystemChatMessage(text) {
    const el = document.createElement("div");
    el.className = "chat-system";
    el.textContent = text;
    chatMessages.appendChild(el);
    scrollChatToBottom();
}

function sendMessage(text) {
    const clean = text.trim();
    if (!clean || !state.currentRoom) return;

    wsSend({
        type: "chat_message",
        room: state.currentRoom,
        name: state.username,
        text: clean,
    });
}

function scrollChatToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

chatForm.addEventListener("submit", e => {
    e.preventDefault();
    sendMessage(chatInput.value);
    chatInput.value = "";
    chatInput.focus();
});

/* =========================================================
   CHAT TOGGLE
========================================================= */

function toggleChat() {
    state.chatOpen = !state.chatOpen;

    if (state.chatOpen) {
        chatPanel.classList.remove("hidden");
        chatBtn.classList.add("active");
        chatMessages.innerHTML = "";
        addSystemChatMessage("Chat conectado. Suas mensagens sao enviadas em tempo real.");
        setTimeout(() => chatInput.focus(), 100);
    } else {
        chatPanel.classList.add("hidden");
        chatBtn.classList.remove("active");
    }
}

chatBtn.addEventListener("click", toggleChat);
closeChatBtn.addEventListener("click", () => {
    state.chatOpen = false;
    chatPanel.classList.add("hidden");
    chatBtn.classList.remove("active");
});

/* =========================================================
   MOBILE MENU
========================================================= */

mobileMenuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
});

document.addEventListener("click", e => {
    if (
        window.innerWidth <= 850 &&
        sidebar.classList.contains("open") &&
        !sidebar.contains(e.target) &&
        !mobileMenuBtn.contains(e.target)
    ) {
        sidebar.classList.remove("open");
    }
});

/* =========================================================
   SIDEBAR ACTIONS
========================================================= */

$("sidebarHomeBtn").addEventListener("click", showHomeScreen);
$("sidebarCreateBtn").addEventListener("click", createRoom);
$("sidebarJoinBtn").addEventListener("click", () => openModal(joinModal));

/* =========================================================
   LEAVE
========================================================= */

leaveBtn.addEventListener("click", () => {
    if (window.confirm("Deseja realmente sair desta sala?")) {
        showHomeScreen();
        showToast("Voce saiu da sala.", "success");
    }
});

/* =========================================================
   CLEAR RECENTS
========================================================= */

$("clearRecentBtn").addEventListener("click", () => {
    clearRecentRooms();
    showToast("Salas recentes removidas.", "success");
});

/* =========================================================
   KEYBOARD SHORTCUTS
========================================================= */

document.addEventListener("keydown", e => {
    if (callScreen.classList.contains("hidden")) return;
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    if (e.code === "KeyM") toggleMicrophone();
    if (e.code === "KeyV") toggleCamera();
    if (e.code === "KeyC") toggleChat();
});

/* =========================================================
   BEFORE LEAVING PAGE
========================================================= */

window.addEventListener("beforeunload", () => {
    stopCamera();
    stopMicrophone();
    stopScreenShare();

    if (state.ws) {
        state.ws.close();
    }
});

/* =========================================================
   INITIALIZATION
========================================================= */

let pendingJoinCode = null;

function extractRoomFromUrl() {
    const match = window.location.pathname.match(/\/join\/(\d{4})/);
    return match ? match[1] : null;
}

function initialize() {
    state.username = getUsername() || "Voce";

    updateUserUI();
    renderRecentRooms();
    renderSidebarRecentRooms();

    chatPanel.classList.add("hidden");
    updateMicrophoneUI();
    localCard.classList.add("camera-off");

    // URL-based room join (e.g. /join/1234)
    pendingJoinCode = extractRoomFromUrl();

    // Connect to WebSocket server
    connectWS();
}

initialize();
