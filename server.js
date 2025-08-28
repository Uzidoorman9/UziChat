const express = require("express");
const WebSocket = require("ws");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const wss = new WebSocket.Server({ server });

wss.on("connection", ws => {
  ws.on("message", message => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) client.send(message.toString());
    });
  });
});
