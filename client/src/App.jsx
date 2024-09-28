import React, { useState, useEffect, useRef } from "react";
import { ConfigProvider, theme } from "antd";
import { Typography } from "antd";
import io from "socket.io-client";
import Peer from "peerjs";
import toast, { Toaster } from "react-hot-toast"; // Use react-hot-toast for notifications
import FileProgressCard from "./components/FileprogressCard";
import ClientList from "./components/ClientList";
import HeaderSection from "./components/Header";
import HashLoader from "react-spinners/HashLoader";
import AvatarIcon from "./components/AvatarIcon";
const { Title } = Typography;
// Connect to the backend server
const socket = io(import.meta.env.REACT_APP_BACKEND_HOST);

function App() {
  const [clients, setClients] = useState({});
  const [peerId, setPeerId] = useState(null);
  const [peerName, setPeerName] = useState("");
  const [remotePeerId, setRemotePeerId] = useState("");
  const [remotePeerName, setRemotePeerName] = useState("");
  const [fileToSend, setFileToSend] = useState(null);
  const [progress, setProgress] = useState(0);
  const [fileName, setFilename] = useState("");

  const peerRef = useRef(null);
  const connRef = useRef(null);
  const receivedChunks = useRef([]);
  const totalFileSize = useRef(0);
  const receivedBytes = useRef(0);

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

  useEffect(() => {
    // Initialize PeerJS
    peerRef.current = new Peer();

    peerRef.current.on("open", (id) => {
      setPeerId(id);
      const name = generatePeerName();
      setPeerName(name);
      socket.emit("registerPeer", { id, name });
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
  }, []);

  const handleData = (data) => {
    if (data.fileSize) {
      totalFileSize.current = data.fileSize;
    }
    if (data.fileName) {
      setFilename(data.fileName || "File");
    }

    if (data.fileChunk) {
      receivedChunks.current.push(data.fileChunk);
      receivedBytes.current += data.fileChunk.byteLength;

      setProgress((receivedBytes.current / totalFileSize.current) * 100);

      connRef.current.send({ ack: true });
    } else if (data.fileComplete) {
      const blob = new Blob(receivedChunks.current);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.fileName;
      a.click();

      receivedChunks.current = [];
      receivedBytes.current = 0;
      setProgress(0);
      setFilename("");
      toast.success("Received file: " + data.fileName);
    }
  };

  const connectToPeer = (clientId) => {
    if (peerRef.current && remotePeerId) {
      const conn = peerRef.current.connect(remotePeerId);
      connRef.current = conn;

      conn.on("open", () => {
        toast.success("Connected to the Client " + remotePeerName);
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
    if (connRef.current && fileToSend) {
      const file = fileToSend;
      setFilename(file.name);
      const chunkSize = 256 * 1024;
      const totalChunks = Math.ceil(file.size / chunkSize);
      let currentChunk = 0;

      const reader = new FileReader();

      const readNextChunk = () => {
        const start = currentChunk * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const blob = file.slice(start, end);
        reader.readAsArrayBuffer(blob);
      };

      reader.onload = (e) => {
        if (e.target.readyState === FileReader.DONE) {
          connRef.current.send({ fileChunk: e.target.result });
        }
      };

      connRef.current.send({
        fileSize: file.size,
        fileName: file.name,
      });

      readNextChunk();

      connRef.current.on("data", (data) => {
        if (data.ack) {
          currentChunk++;
          setProgress((currentChunk / totalChunks) * 100);
          if (currentChunk < totalChunks) {
            readNextChunk();
          } else {
            connRef.current.send({
              fileComplete: true,
              fileName: file.name,
            });
            toast.success("File sent successfully!");
          }
        }
      });
    }
  };

  useEffect(() => {
    socket.on("clients", setClients);
    socket.on("connectionRequest", ({ from, name }) => {
      setRemotePeerName(name);
      connectToPeer(from);
      setRemotePeerId(from);
    });
  }, []);

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
      <HeaderSection style={{zindex:"100"}} />
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
        // <>
        //   <div className="p-5 flex gap-2">
        //     <p>You are</p>
        //     <p className="font-semibold">{peerName}</p>
        //   </div>

        //   <ClientList
        //     clientList={clients}
        //     setRemotePeerId={setRemotePeerId}
        //     setRemotePeerName={setRemotePeerName}
        //     connectToPeer={connectToPeer}
        //     peerId={peerId}
        //     remotePeerName={remotePeerName}
        //   />

        //   <div hidden>
        //     <input
        //       type="text"
        //       placeholder="Enter remote peer ID"
        //       value={remotePeerId}
        //       onChange={(e) => setRemotePeerId(e.target.value)}
        //     />
        //     <button onClick={connectToPeer}>Connect</button>
        //   </div>

        //   <div className="px-5 py-2 flex flex-col gap-2">
        //     <input
        //       type="file"
        //       onChange={(e) =>
        //         setFileToSend(e.target.files ? e.target.files[0] : null)
        //       }
        //     />
        //     <button
        //       className="w-28 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
        //       onClick={sendFile}
        //     >
        //       Send File
        //     </button>
        //   </div>

        //   {fileName && (
        //     <FileProgressCard filename={fileName} progress={progress} />
        //   )}
        // </>
        <>
          <AvatarIcon peerName={peerName} />
        </>
      )}

      <Toaster />
    </ConfigProvider>
  );
}

export default App;
