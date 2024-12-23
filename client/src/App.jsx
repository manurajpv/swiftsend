import { useState, useEffect, useRef } from "react";
import { ConfigProvider, theme, Button } from "antd";
import { Typography } from "antd";
import io from "socket.io-client";
import Peer from "peerjs";
import toast, { Toaster } from "react-hot-toast"; // Use react-hot-toast for notifications
import ClientList from "./components/ClientList";
import HeaderSection from "./components/Header";
import HashLoader from "react-spinners/HashLoader";
import AvatarIcon from "./components/AvatarIcon";
import {
  ClientContext,
  PeerContext,
  RemotePeerContext,
  FileProgressContext,
} from "./utils/Contexts";
import FileTransferWorker from './utils/fileTransferWorker?worker'; // You'll need to create this file

const { Title } = Typography;
// Connect to the backend server
const socket = io(import.meta.env.VITE_BACKEND_HOST);

function App() {
  const [clients, setClients] = useState({});
  const [peerId, setPeerId] = useState(null);
  const [peerName, setPeerName] = useState("");
  const [remotePeerId, setRemotePeerId] = useState("");
  const [remotePeerName, setRemotePeerName] = useState("");
  const [fileToSend, setFileToSend] = useState(null);
  const [progress, setProgress] = useState(0);
  const [fileName, setFilename] = useState("");
  const [peerRef, setPeerRef] = useState(useRef(null));
  const [connRef, setconnRef] = useState(useRef(null));
  const [ip, setIP] = useState("");

  const receivedChunks = useRef([]);
  const totalFileSize = useRef(0);
  const receivedBytes = useRef(0);

  const [pendingFile, setPendingFile] = useState(null);
  const [pendingFileInfo, setPendingFileInfo] = useState(null);

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
    "bear",
    "elephant",
    "fox",
    "frog",
    "hen",
    "hippo",
    "lion",
    "owl",
    "panda",
    "rabbit",
  ];

  const generatePeerName = () => {
    const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
    return `${randomVerb} ${randomAnimal}`;
  };
  const fetchIP = async () => {
    //fetch browser IP address
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    console.log(data);
    setIP(data.ip);
  };
  const getPeerNameByPeerId = (peerId) => {
    for (let key in clients) {
      if (clients[key].peerId === peerId) {
        return clients[key].peerName;
      }
    }
    return "";
  };
  useEffect(() => {
    setRemotePeerName(getPeerNameByPeerId(remotePeerId));
    connectToPeer(remotePeerId, getPeerNameByPeerId(remotePeerId));
  }, [remotePeerId]);
  useEffect(() => {
    if (!ip) fetchIP();

    // Initialize PeerJS
    peerRef.current = new Peer();

    peerRef.current.on("open", async (id) => {
      console.log(id);
      setPeerId(id);
      const name = generatePeerName();
      setPeerName(name);
      socket.emit("registerPeer", { id, name, ip });
    });

    peerRef.current.on("connection", (conn) => {
      connRef.current = conn;
      receivedChunks.current = [];
      receivedBytes.current = 0;
      totalFileSize.current = 0;
      setRemotePeerId(conn.peer);

      conn.on("data", handleData);
    });

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, [ip]);

  const handleData = (data) => {
    if (data.fileRequest) {
      // Show confirmation dialog when receiving file request
      setPendingFileInfo(data);
      toast(
        (t) => (
          <div>
            <p>{`${data.senderName} wants to send ${data.fileName} (${(
              data.fileSize /
              (1024 * 1024)
            ).toFixed(2)} MB)`}</p>
            <div>
              <Button
                variant="solid"
                color="primary"
                onClick={() => {
                  connRef.current.send({ fileAccepted: true });
                  setPendingFile(data);
                  toast.dismiss(t.id);
                  toast.success("File transfer accepted");
                }}
                style={{
                  marginRight: "8px",
                  padding: "5px 10px",
                  cursor: "pointer",
                }}
              >
                Accept
              </Button>
              <Button
                variant="solid"
                color="danger"
                onClick={() => {
                  connRef.current.send({ fileAccepted: false });
                  setPendingFileInfo(null);
                  setPendingFile(null);
                  toast.dismiss(t.id);
                  toast.error("File transfer declined");
                }}
                style={{ padding: "5px 10px", cursor: "pointer" }}
              >
                Decline
              </Button>
            </div>
          </div>
        ),
        {
          duration: 30000,
          position: "top-center",
          style: {
            padding: "16px",
            borderRadius: "8px",
          },
        }
      );
      return;
    }

    if (data.fileAccepted === false) {
      toast.dismiss();
      toast.error("File transfer was declined");
      setFileToSend(null);
      setProgress(0);
      return;
    }

    if (data.fileAccepted === true) {
      toast.dismiss();
      toast.success("File transfer accepted");
      startFileTransfer();
      return;
    }

    if (data.fileSize) {
      totalFileSize.current = data.fileSize;
    }
    if (data.fileName) {
      setFilename(data.fileName || "File");
    }

    if (data.fileChunk) {
      // Store chunks in order
      receivedChunks.current[data.chunkIndex] = data.fileChunk;
      receivedBytes.current += data.fileChunk.byteLength;
      setProgress(Math.ceil((receivedBytes.current / totalFileSize.current) * 100));
      connRef.current.send({ ack: true });
    } else if (data.fileComplete) {
      // Filter out any undefined chunks and combine
      const blob = new Blob(receivedChunks.current.filter(chunk => chunk !== undefined));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.fileName;
      a.click();

      receivedChunks.current = [];
      receivedBytes.current = 0;
      setFilename('');
      toast.success('Received file: ' + data.fileName);
    }
  };

  const connectToPeer = (clientId, clientName = "") => {
    console.log("peerRef: ", peerRef.current);
    console.log("remotePeerId: ", remotePeerId);
    if (peerRef.current && remotePeerId) {
      const conn = peerRef.current.connect(remotePeerId);
      connRef.current = conn;

      conn.on("open", () => {
        toast.success(
          "Connected to the Client " +
            (clientName ? clientName : remotePeerName)
        );
        socket.emit("connectPeer", {
          clientId,
          from: peerId,
          name: peerName,
        });
      });

      conn.on("close", () => {
        setFilename("");
        setProgress(0);
        toast.error("The client was disconnected");
      });

      conn.on("data", handleData);
    }
  };

  const sendFile = () => {
    if (!connRef.current || !fileToSend) return;

    // Clear any existing listeners
    connRef.current.removeAllListeners("data");
    connRef.current.on("data", handleData);

    // Send request to receiver
    connRef.current.send({
      fileRequest: true,
      fileName: fileToSend.name,
      fileSize: fileToSend.size,
      senderName: peerName,
    });

    toast.loading("Waiting for receiver to accept...", {
      duration: 30000,
    });
  };

  const startFileTransfer = () => {
    if (!connRef.current || !fileToSend) return;

    toast.dismiss();
    const file = fileToSend;
    setFilename(file.name);
    
    const CHUNK_SIZE = 256 * 1024;
    const CONCURRENT_CHUNKS = 5; // Number of parallel transfers
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let completedChunks = 0;
    let activeWorkers = 0;
    const pendingChunks = Array.from({ length: totalChunks }, (_, i) => i);
    const workers = [];

    // Send initial file metadata
    connRef.current.send({
      fileSize: file.size,
      fileName: file.name,
    });

    const processNextChunk = () => {
      while (activeWorkers < CONCURRENT_CHUNKS && pendingChunks.length > 0) {
        const chunkIndex = pendingChunks.shift();
        if (chunkIndex === undefined) break;

        const worker = new FileTransferWorker();
        workers.push(worker);
        activeWorkers++;

        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        
        worker.postMessage({
          file: file.slice(start, end),
          chunkIndex,
          totalChunks
        });

        worker.onmessage = (e) => {
          const { chunkData, chunkIndex } = e.data;
          
          // Send the processed chunk
          connRef.current.send({ 
            fileChunk: chunkData,
            chunkIndex,
            totalChunks
          });
        };
      }
    };

    connRef.current.on('data', (data) => {
      if (data.ack) {
        completedChunks++;
        activeWorkers--;
        setProgress(Math.floor((completedChunks / totalChunks) * 100));

        if (completedChunks === totalChunks) {
          // Cleanup workers
          workers.forEach(worker => worker.terminate());
          
          connRef.current.send({
            fileComplete: true,
            fileName: file.name,
          });
          toast.success('File sent successfully!');
        } else {
          processNextChunk();
        }
      }
    });

    // Start initial batch of workers
    processNextChunk();
  };

  useEffect(() => {
    socket.on("clients", setClients);
    socket.on("connectionRequest", ({ from, name }) => {
      setRemotePeerName(name);
      connectToPeer(from);
      setRemotePeerId(from);
    });
  }, [remotePeerId, remotePeerName]);

  // Add cleanup when component unmounts
  useEffect(() => {
    return () => {
      setPendingFile(null);
      setPendingFileInfo(null);
      setProgress(0);
      setFileToSend(null);
    };
  }, []);

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
      <HeaderSection style={{ zindex: "100" }} />
      {!peerName ? (
        <div
          style={{
            height: "90vh",
            width: "100vw",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <HashLoader />
          <Title level={4}>Loading</Title>
        </div>
      ) : (
        <>
          <FileProgressContext.Provider value={{ progress }}>
            <AvatarIcon peerName={peerName} />
            <ClientContext.Provider value={clients}>
              <PeerContext.Provider value={{ peerId, ip }}>
                <RemotePeerContext.Provider
                  value={{
                    remotePeerName,
                    setRemotePeerId,
                    setRemotePeerName,
                    connectToPeer,
                    sendFile,
                    setFileToSend,
                  }}
                >
                  <ClientList />
                </RemotePeerContext.Provider>
              </PeerContext.Provider>
            </ClientContext.Provider>
          </FileProgressContext.Provider>
        </>
      )}

      <Toaster />
    </ConfigProvider>
  );
}

export default App;
