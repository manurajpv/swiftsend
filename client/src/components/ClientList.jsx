import ClientAvatar from "./ClientAvatar";
import { useContext, useState, useEffect } from "react";
import {
  ClientContext,
  PeerContext,
  RemotePeerContext,
} from "../utils/Contexts";
import ProgressCircle from "./ProgressCircle";

function ClientList() {
  const clients = useContext(ClientContext);
  const peer = useContext(PeerContext);
  const remotePeer = useContext(RemotePeerContext);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  useEffect(() => {
    // Function to get a random position
    const getRandomPosition = () => {
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      const headerHeight = 64; // taking 16px as 1 rem and multiply my header size of 4rem
      // Calculate random top and left positions
      const top = Math.floor(
        Math.random() * (windowHeight - (headerHeight) - 100 - 100) + headerHeight
      );
      const left = Math.floor(Math.random() * (windowWidth - 100));
      return { top, left };
    };
    // Set the position to a random spot
    setPosition(getRandomPosition());
  }, []);
  return (
    <div>
      {Object.values(clients).map(
        (client) =>
          "peerId" in client &&
          client.peerId != peer.peerId && (
            <div key={client.id}>
              {client.id !== peer.peerId &&
                peer.ip === client.ip_addr &&
                (remotePeer.remotePeerName !== client.peerName ? (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        width: "fit-content",
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                      }}
                    >
                      <ProgressCircle>
                        <ClientAvatar client={client} />
                      </ProgressCircle>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        width: "fit-content",
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                      }}
                    >
                      <ProgressCircle>
                        <ClientAvatar client={client} />
                      </ProgressCircle>
                    </div>
                  </>
                ))}
            </div>
          )
      )}
    </div>
  );
}

export default ClientList;
