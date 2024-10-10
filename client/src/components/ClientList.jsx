import ClientAvatar from "./ClientAvatar";
import { useContext } from "react";
import {
  ClientContext,
  PeerContext,
  RemotePeerContext,
} from "../utils/Contexts";

function ClientList() {
  const clients = useContext(ClientContext);
  const peer = useContext(PeerContext);
  const remotePeer = useContext(RemotePeerContext);
  return (
    <div>
      {console.log(clients, peer, remotePeer)}
      {Object.values(clients).map(
        (client) =>
          "peerId" in client &&
          client.peerId != peer.peerId && (
            <div key={client.id}>
              {client.id !== peer.peerId &&
                peer.ip === client.ip_addr &&
                (remotePeer.remotePeerName !== client.peerName ? (
                  <>
                    <ClientAvatar client={client} />
                  </>
                ) : (
                  <>
                    <ClientAvatar client={client} />
                    <span>Connected</span>
                  </>
                ))}
            </div>
          )
      )}
    </div>
  );
}

export default ClientList;
