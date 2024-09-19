// App.js
import { createSignal, createEffect, onCleanup, onMount } from "solid-js";
import io from "socket.io-client";
import Peer from "peerjs";
import Logo from "./assets/logo.svg";
import toast, { Toaster } from "solid-toast";
import FileProgressCard from "./components/FileprogressCard";
import ClientList from "./components/ClientList";

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
  const [fileName, setFilename] = createSignal("");
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
                width: `${progress()}%`,
              }}
            ></div>
          </div>
        </div>
      );
    });
    if (progress === 0) toast.dismiss();
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
      receivedChunks = [];
      receivedBytes = 0;
      totalFileSize = 0;
      setRemotePeerId(conn.peer);
      console.log("Peer " + remotePeerId() + " is connected");
      // toast.success("Connected to the Client " + remotePeerId());
      conn.on("data", (data) => {
        if (data.fileSize) {
          totalFileSize = data.fileSize;
        }
        if (data.fileName) {
          setFilename(data.fileName || "File");
        }

        if (data.fileChunk) {
          // Accumulate the file chunks
          receivedChunks.push(data.fileChunk);
          receivedBytes += data.fileChunk.byteLength;

          // Update receive progress
          setProgress((receivedBytes / totalFileSize) * 100);

          // Send acknowledgment to sender after processing each chunk
          conn.send({ ack: true });
        } else if (data.fileComplete) {
          // Once file is fully received
          const blob = new Blob(receivedChunks);
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = data.fileName;
          a.click();

          // Reset state for future transfers
          receivedChunks = [];
          receivedBytes = 0;
          setProgress(0);
          setFilename("");
          toast.success("Received file: " + data.fileName);
        }
      });
    });

    onCleanup(() => {
      if (peerRef) {
        peerRef.destroy();
      }
    });
  });

  const connectToPeer = (clientId) => {
    if (peerRef && remotePeerId()) {
      const conn = peerRef.connect(remotePeerId());
      connRef = conn;
      // listen for connection
      conn.on("open", () => {
        console.log("Connected to peer: ", remotePeerId());
        toast.success("Connected to the Client " + remotePeerName());
        socket.emit("connectPeer", {
          clientId,
          from: peerId(),
          name: peerName(),
        });
      });
      // Listen for disconnection event and show an alert
      conn.on("close", () => {
        console.log("Connection to peer was disconnected.");
        toast.error("The client was disconnected");
      });
    }
  };

  const sendFile = () => {
    console.log(connRef,fileToSend())
    if (connRef && fileToSend()) {
      const file = fileToSend();
      setFilename(file.name);
      const chunkSize = 16 * 1024; // 16KB per chunk
      const totalChunks = Math.ceil(file.size / chunkSize);
      let currentChunk = 0;

      const reader = new FileReader();

      const readNextChunk = () => {
        const start = currentChunk * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const blob = file.slice(start, end);
        reader.readAsArrayBuffer(blob);
      };

      // Wait for acknowledgment before sending the next chunk
      const handleAck = () => {
        currentChunk++;
        setProgress((currentChunk / totalChunks) * 100);
        if (currentChunk < totalChunks) {
          readNextChunk();
        } else {
          // File transfer complete
          connRef.send({
            fileComplete: true,
            fileName: file.name,
          });
          console.log("File sent successfully!");
        }
      };

      // Handle FileReader result and send chunks
      reader.onload = (e) => {
        if (e.target.readyState === FileReader.DONE) {
          // Send the chunk and wait for acknowledgment
          connRef.send({
            fileChunk: e.target.result,
          });
        }
      };

      // Send file size info and start the process
      connRef.send({
        fileSize: file.size,
      });

      // Start reading the first chunk
      readNextChunk();

      // Listen for acknowledgment from the receiving peer
      connRef.on("data", (data) => {
        if (data.ack) {
          handleAck();
        }
      });
    }
  };

  // Listen for the list of connected clients
  socket.on("clients", (clients) => {
    setClients(clients);
  });
  socket.on("connectionRequest", ({ from, name }) => {
    setRemotePeerId(from);
    setRemotePeerName(name);
    connectToPeer(from);
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
      <ClientList
        clientList={clients()}
        setRemotePeerId={setRemotePeerId}
        setRemotePeerName={setRemotePeerName}
        connectToPeer={connectToPeer}
        peerId={peerId()}
        remotePeerName={remotePeerName()}
      />
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
      {fileName() && (
        <FileProgressCard filename={fileName()} progress={progress()} />
      )}

      <Toaster />
    </div>
  );
}

export default App;
