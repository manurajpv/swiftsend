// App.js
import { createSignal, onCleanup, onMount } from "solid-js";
import io from "socket.io-client";
import Peer from "peerjs";

// Connect to the backend server
const socket = io("http://localhost:8000");

function App() {
  const [clients, setClients] = createSignal({});
  const [peerId, setPeerId] = createSignal(null);
  const [remotePeerId, setRemotePeerId] = createSignal("");
  const [fileToSend, setFileToSend] = createSignal(null);
  let peerRef = null;
  let connRef = null;

  onMount(() => {
    // Initialize PeerJS
    peerRef = new Peer();

    peerRef.on("open", (id) => {
      setPeerId(id);
      console.log("Peer ID: ", id);
      socket.emit("peerId", id);
    });

    // Listen for incoming connections
    peerRef.on("connection", (conn) => {
      conn.on("data", (data) => {
        const receivedData = data.file;
        const blob = new Blob([receivedData]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.fileName;
        a.click();
      });
    });

    onCleanup(() => {
      if (peerRef) {
        peerRef.destroy();
      }
    });
  });

  const connectToPeer = () => {
    if (peerRef && remotePeerId()) {
      const conn = peerRef.connect(remotePeerId());
      connRef = conn;
      // listen for connection
      conn.on("open", () => {
        console.log("Connected to peer: ", remotePeerId());
      });
      // Listen for disconnection event and show an alert
      conn.on("close", () => {
        alert("Connection to peer was disconnected.");
      });
    }
  };

  const sendFile = () => {
    if (connRef && fileToSend()) {
      connRef.send({
        file: fileToSend(),
        fileName: fileToSend().name,
      });
    }
  };
  // Listen for the list of connected clients
  socket.on("clients", (clients) => {
    setClients(clients);
  });
  return (
    <div>
      <h1>File Sharing App (SolidJS)</h1>
      <p>Your Peer ID: {peerId()}</p>
      <input
        type="text"
        placeholder="Enter remote peer ID"
        value={remotePeerId()}
        onInput={(e) => setRemotePeerId(e.target.value)}
      />
      <button onClick={connectToPeer}>Connect</button>

      <input
        type="file"
        onInput={(e) =>
          setFileToSend(e.target.files ? e.target.files[0] : null)
        }
      />
      <button onClick={sendFile}>Send File</button>
      <h2>Connected Clients:</h2>
      <ul>
        {Object.values(clients()).map(
          (client) =>
            (client.peerId && client.peerId != peerId()) && (
              <li key={client.id}>
                {client.peerId}
                {client.id !== peerId() && (
                  <button
                    onClick={() => {
                      setRemotePeerId(client.peerId);
                      connectToPeer();
                    }}
                  >
                    Connect
                  </button>
                )}
              </li>
            )
        )}
      </ul>
    </div>
  );
}

export default App;
