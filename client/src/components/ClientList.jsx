function ClientList(props) {
  return (
    <div className="border-2 border-teal-700 rounded-md p-2 m-2 flex flex-col min-h-32">
      <h2 className="text-xl font-semibold">Available Clients</h2>
      <ul className="flex flex-col gap-2">
        {console.log(props.clientList)}
        {Object.values(props.clientList).map(
          (client) =>
            "peerId" in client &&
            client.peerId != props.peerId && (
              <li
                key={client.id}
                className="flex flex-col md:flex-row gap-2 items-center"
              >
                <p>{client.peerName}</p>
                {console.log("remote ", client.remotePeerName)}
                {client.id !== props.peerId &&
                  (props.remotePeerName !== client.peerName ? (
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
                      onClick={() => {
                        props.setRemotePeerId(client.peerId);
                        props.setRemotePeerName(client.peerName);
                        props.connectToPeer(client.id);
                      }}
                    >
                      Connect
                    </button>
                  ) : (
                    <span
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2
px-4 rounded-full"
                    >
                      Connected
                    </span>
                  ))}
              </li>
            )
        )}
      </ul>
    </div>
  );
}

export default ClientList;
