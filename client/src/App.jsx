// App.js
import { createSignal, createEffect, onCleanup, onMount } from "solid-js";
import io from "socket.io-client";
import Peer from "peerjs";
import Logo from "./assets/logo.svg";
import toast, { Toaster } from "solid-toast";

// Connect to the backend server
const socket = io(import.meta.env.VITE_BACKEND_HOST);

function App() {
  const [clients, setClients] = createSignal({});
  const [peerId, setPeerId] = createSignal(null);
  const [peerName, setPeerName] = createSignal("");
  const [remotePeerId, setRemotePeerId] = createSignal("");
  const [remotePeerName, setRemotePeerName] = createSignal("");
  const [fileToSend, setFileToSend] = createSignal(null);
  const [progress, setProgress] = createSignal(0);
  const [receiveProgress, setReceiveProgress] = createSignal(0);
  let peerRef = null;
  let connRef = null;
  let receivedChunks = [];
  let totalFileSize = 0;
  let receivedBytes = 0;
  // Arrays for past continuous verbs and animal names
  const verbs = [
    "Jumping",
    "Running",
    "Dancing",
    "Singing",
    "Crawling",
    "Flying",
    "Hopping",
    "Swimming",
    "Walking",
    "Rolling",
    "Climbing",
    "Slithering",
  ];
  const animals = [
    "Elephant",
    "Tiger",
    "Rabbit",
    "Dolphin",
    "Giraffe",
    "Penguin",
    "Kangaroo",
    "Lion",
    "Eagle",
    "Frog",
    "Snake",
    "Turtle",
  ];

  // Function to generate a random peer name
  const generatePeerName = () => {
    const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
    return `${randomVerb} ${randomAnimal}`;
  };
  const showToastWithProgress = (type = "send", fileName = "file") => {
    toast.custom((t) => {
      const startTime = Date.now();
      createEffect(() => {
        if (t.paused) return;
        const interval = setInterval(() => {
          const diff = Date.now() - startTime - t.pauseDuration;
        });

        onCleanup(() => clearInterval(interval));
      });

      return (
        <div
          class={`${
            t.visible ? "animate-enter" : "animate-leave"
          } bg-cyan-600 p-3 rounded-md shadow-md min-w-[350px]`}
        >
          <div class="flex flex-1 flex-col">
            <div class="font-medium text-white">Progress:</div>
            <div class="text-sm text-cyan-50">
              Filename:{" "}
              <strong>{type === "send" ? fileToSend().name : fileName}</strong>
            </div>
          </div>
          <div class="relative pt-4">
            <div class="w-full h-1 rounded-full bg-cyan-900"></div>
            <div
              class="h-1 top-4 absolute rounded-full bg-cyan-50"
              style={{
                width: `${type === "send" ? progress() : receiveProgress}%`,
              }}
            ></div>
          </div>
        </div>
      );
    });
    if (progress === 0 && receiveProgress === 0) toast.dismiss();
  };
  onMount(() => {
    // Initialize PeerJS
    peerRef = new Peer();

    peerRef.on("open", (id) => {
      setPeerId(id);
      console.log("Peer ID: ", id);
      const name = generatePeerName();
      setPeerName(name);
      socket.emit("registerPeer", { id, name });
    });

    // Listen for incoming connections
    peerRef.on("connection", (conn) => {
      connRef = conn;
      setRemotePeerId(conn.peer);
      console.log("Peer " + remotePeerId() + " is connected");
      toast.success("Connected to the Client " + remotePeerId());
      receivedChunks = []; // Clear the chunks for a new transfer
      receivedBytes = 0; // Reset the received bytes counter
      totalFileSize = 0; // Reset total file size for new transfer

      conn.on("data", (data) => {
        if (data.fileSize) {
          // Set total file size when the first chunk is received
          totalFileSize = data.fileSize;
        }
        if (data.fileChunk) {
          // Accumulate the file chunks
          receivedChunks.push(data.fileChunk);
          receivedBytes += data.fileChunk.byteLength;

          // Update receive progress
          setReceiveProgress((receivedBytes / totalFileSize) * 100);

          // If transfer is complete
        } else if (data.fileComplete) {
          const blob = new Blob(receivedChunks);
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = data.fileName; // Use the original file name
          a.click();

          // Reset the chunks for future transfers
          receivedChunks = [];
          receivedBytes = 0;
          setReceiveProgress(0); // Reset progress bar after download
          toast.success("Recieved file: " + data.fileName);
        }
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
        toast.success("Connected to the Client " + remotePeerName());
      });
      // Listen for disconnection event and show an alert
      conn.on("close", () => {
        console.log("Connection to peer was disconnected.");
        toast.error("The client was disconnected");
      });
    }
  };

  const sendFile = () => {
    if (connRef && fileToSend()) {
      const file = fileToSend();
      showToastWithProgress();
      const chunkSize = 16 * 1024; // 16KB per chunk
      const totalChunks = Math.ceil(file.size / chunkSize);
      let currentChunk = 0;

      const reader = new FileReader();

      reader.onload = (e) => {
        if (e.target.readyState === FileReader.DONE) {
          // Send each chunk as `fileChunk`
          connRef.send({
            fileChunk: e.target.result,
          });

          // Update progress
          currentChunk++;
          setProgress((currentChunk / totalChunks) * 100);

          if (currentChunk < totalChunks) {
            // Continue reading the next chunk
            readNextChunk();
          } else {
            // Once all chunks are sent, notify the receiver that the file transfer is complete
            connRef.send({
              fileComplete: true,
              fileName: file.name,
            });
            console.log("File sent successfully!");
          }
        }
      };
      // Send total file size with the first chunk
      connRef.send({
        fileSize: file.size,
      });
      const readNextChunk = () => {
        const start = currentChunk * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const blob = file.slice(start, end);
        reader.readAsArrayBuffer(blob);
      };

      // Start reading the first chunk
      readNextChunk();
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
        <p class="font-semibold">{peerName()}</p>
      </div>
      <div class="border-2 border-teal-700 rounded-md p-2 m-2 flex flex-col min-h-32">
        <h2 class="text-xl font-semibold">Available Clients</h2>
        <ul class="flex flex-col gap-2">
          {console.log(clients())}
          {Object.values(clients()).map(
            (client) =>
              client.peerId &&
              client.peerId != peerId() && (
                <li
                  key={client.id}
                  class="flex flex-col md:flex-row gap-2 items-center"
                >
                  <p>{client.peerName}</p>
                  {client.id !== peerId() && (
                    <button
                      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
                      onClick={() => {
                        setRemotePeerId(client.peerId);
                        setRemotePeerName(client.peerName);
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
      <div style={{ marginTop: "20px" }}>
        <p>Progress: {Math.round(progress())}%</p>
        <div style={{ width: "100%", backgroundColor: "#ddd" }}>
          <div
            style={{
              width: `${progress()}%`,
              height: "20px",
              backgroundColor: "#4caf50",
            }}
          />
        </div>
      </div>
      <div style={{ marginTop: "20px" }}>
        <p>Receiving Progress: {Math.round(receiveProgress())}%</p>
        <div style={{ width: "100%", backgroundColor: "#ddd" }}>
          <div
            style={{
              width: `${receiveProgress()}%`,
              height: "20px",
              backgroundColor: "#f44336",
            }}
          />
        </div>
      </div>
      <Toaster />
    </div>
  );
}

export default App;
