// App.js
import { createSignal, onCleanup, onMount } from "solid-js";
import io from "socket.io-client";
import Peer from "peerjs";
import Logo from "./assets/logo.png";
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
      connRef = conn;
      setRemotePeerId(conn.peer);
      console.log("Peer " + remotePeerId() + " is connected");
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
      <header>
        <div class="w-100 bg-teal-600 h-16">
          <div class="flex gap-4 items-center h-full px-2">
            <img class="w-10 h-10" src={Logo} alt="" srcset="" />
            <h1 class="text-2xl text-white font-semibold">SwiftSend</h1>
          </div>
        </div>
      </header>
      <div class="p-5 flex gap-2">
        <p>You are</p>
        <p class="font-semibold">{peerId()}</p>
      </div>
      <div class="border-2 border-teal-700 rounded-md p-2 m-2 flex flex-col min-h-32">
        <h2 class="text-xl font-semibold">Available Clients</h2>
        <ul class="flex flex-col gap-2">
          {Object.values(clients()).map(
            (client) =>
              client.peerId &&
              client.peerId != peerId() && (
                <li key={client.id} class="flex flex-col md:flex-row gap-2 items-center">
                  <p>{client.peerId}</p>
                  {client.id !== peerId() && (
                    <button
                      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
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
      <div class="" hidden>
        <input
          type="text"
          placeholder="Enter remote peer ID"
          value={remotePeerId()}
          onInput={(e) => setRemotePeerId(e.target.value)}
        />
        <button onClick={connectToPeer}>Connect</button>
      </div>
      <div class="px-5 py-2 flex flex-col gap-2">
        <input
          type="file"
          onInput={(e) =>
            setFileToSend(e.target.files ? e.target.files[0] : null)
          }
        />
        <button
          class="w-28 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
          onClick={sendFile}
        >
          Send File
        </button>
      </div>
    </div>
  );
}

export default App;
