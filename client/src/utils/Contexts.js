import { createContext } from "react";

export const ClientContext = createContext("");

export const PeerContext = createContext({ peerId: "", ip: "" });

export const RemotePeerContext = createContext({
  remotePeerName: "",
  setRemotePeerId: () => {},
  setRemotePeerName: () => {},
  sendFile: () => {},
  setFileToSend: () => {},
});

export const FileProgressContext = createContext({
  progress: Number,
});
