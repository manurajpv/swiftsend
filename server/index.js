// index.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { PeerServer } = require("peer");

const app = express();
app.use(cors());
const server = http.createServer(app);

//socket server for Websocket connection
const io = new Server(server, {
  cors: {
    origin: "*",
  },
  path: "/socket.io",
});

// PeerJS Server for WebRTC connections
const peerServer = PeerServer({ port: 9000, path: "/" });

let clients = {};

// Store client-to-peer mappings
let clientPeerMapping = {};

io.on("connection", (socket) => {
  console.log("Client connected: ", socket.id);
  // Add the connected client to the list
  clients[socket.id] = { id: socket.id };

  // Broadcast the updated client list to all clients
  socket.on("registerPeer", (data) => {
    console.log(data);
    if (clients[socket.id]) {
      clients[socket.id]["peerId"] = data.id;
      clients[socket.id]["peerName"] = data.name;
      clients[socket.id]["ip_addr"] = data.ip;
      console.log("peer connected ", data.id);
      io.emit("clients", clients);
    }
  });
  io.emit("clients", clients);
  socket.on("connectPeer", ({ clientId, from, name }) => {
    if (clients[clientId]) {
      io.to(clientId).emit("connectionRequest", { from, name });
    }
  });
  socket.on("disconnect", () => {
    console.log("Client disconnected: ", socket.id);
    delete clients[socket.id];
    io.emit("clients", clients);
  });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
