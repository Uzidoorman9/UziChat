// WebSocket connection to the Render server
const ws = new WebSocket("wss://your-render-service.onrender.com");

const chat = document.getElementById("chat");
const input = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const typingDiv = document.getElementById("typing");
const userList = document.getElementById("userList");
const header = document.getElementById("header");
const channelElems = document.querySelectorAll(".channel");

let username = prompt("Enter your name") || "Guest" + Math.floor(Math.random() * 1000);
const colors = ["#57F287", "#FEE75C", "#EB459E", "#ED4245", "#5865F2", "#00B0F4"];
let userColor = colors[Math.floor(Math.random() * colors.length)];

let currentChannel = "general";
const history = { general: [], random: [] };
const activeUsers = {};
const typingUsers = {};

function renderChat(channel) {
  chat.innerHTML = "";
  history[channel].forEach(msg => addMsg(msg.user, msg.text, msg.color, msg.channel, false));
}

function addMsg(user, text, color, chan, save = true) {
  if (chan !== currentChannel) {
    if (save) history[chan].push({ user, text, color, channel: chan });
    return;
  }
  const div = document.createElement("div");
  div.className = "msg";
  div.innerHTML = `<span class="username" style="color:${color}">${user}</span><span class="text">${text}</span>`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  if (save) history[chan].push({ user, text, color, channel: chan });
}

function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  const msg = { type: "chat", user: username, text, color: userColor, channel: currentChannel };
  ws.send(JSON.stringify(msg));
  addMsg(msg.user, msg.text, msg.color, msg.channel);
  input.value = "";
  ws.send(JSON.stringify({ type: "typingStop", user: username }));
}

sendBtn.onclick = sendMessage;
input.addEventListener("keypress", e => { if (e.key === "Enter") sendMessage(); });
input.addEventListener("input", () => {
  if (input.value.trim() !== "") ws.send(JSON.stringify({ type: "typing", user: username }));
  else ws.send(JSON.stringify({ type: "typingStop", user: username }));
});

setInterval(() => { ws.send(JSON.stringify({ type: "presence", user: username, color: userColor, time: Date.now() })); }, 3000);
setInterval(() => {
  const cutoff = Date.now() - 20000;
  Object.keys(activeUsers).forEach(u => { if (activeUsers[u].last < cutoff) delete activeUsers[u]; });
  updateUsers();
}, 5000);

function updateUsers() {
  userList.textContent = Object.keys(activeUsers).join(", ");
}
function updateTyping() {
  const names = Object.keys(typingUsers).filter(u => u !== username);
  typingDiv.textContent = names.length === 0 ? "" : names.length === 1 ? `${names[0]} is typing...` : `${names.join(", ")} are typing...`;
}

ws.onmessage = e => {
  const msg = JSON.parse(e.data);
  if (msg.type === "chat") addMsg(msg.user, msg.text, msg.color, msg.channel);
  else if (msg.type === "presence") { activeUsers[msg.user] = { color: msg.color, last: msg.time }; updateUsers(); }
  else if (msg.type === "typing") { typingUsers[msg.user] = Date.now(); updateTyping(); }
  else if (msg.type === "typingStop") { delete typingUsers[msg.user]; updateTyping(); }
};

channelElems.forEach(el => {
  el.onclick = () => {
    channelElems.forEach(c => c.classList.remove("active"));
    el.classList.add("active");
    currentChannel = el.dataset.channel;
    header.textContent = `# ${currentChannel}`;
    renderChat(currentChannel);
  };
});

renderChat(currentChannel);
