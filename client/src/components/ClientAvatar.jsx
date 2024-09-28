import React, { useContext, useEffect, useState } from "react";
import { UserOutlined } from "@ant-design/icons";
import { Avatar, Space } from "antd";
import AvatarIcons from "../utils/avatarIcons.js";
import { Typography } from "antd";
import { PeerContext, RemotePeerContext } from "../utils/Contexts";

const { Title } = Typography;

function ClientAvatar(props) {
  const peer = useContext(PeerContext);
  const remotePeer = useContext(RemotePeerContext);
  console.log("peer", peer);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  useEffect(() => {
    // Function to get a random position
    const getRandomPosition = () => {
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      const headerHeight = 64; // taking 16px as 1 rem and multiply my header size of 4rem
      // Calculate random top and left positions
      const top = Math.floor(Math.random() * (windowHeight - 100) + headerHeight);
      const left = Math.floor(Math.random() * (windowWidth - 100));
      return { top, left };
    };
    // Set the position to a random spot
    setPosition(getRandomPosition());
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        width: "fit-content",
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <Space direction="vertical" size={16}>
        <Space
          wrap
          size={16}
          style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
        >
          <Avatar
            size={64}
            src={
              props.client.peerName
                ? AvatarIcons[props.client.peerName.split(" ")[1]]
                : ""
            }
            style={{ cursor: "pointer" }}
            onClick={() => {
              remotePeer.setRemotePeerId(props.client.peerId);
              remotePeer.setRemotePeerName(props.client.peerName);
              remotePeer.connectToPeer(props.client.id);
            }}
          />
          <Title level={5} style={{ margin: "0", textTransform: "capitalize" }}>
            {props.client.peerName}{" "}
          </Title>
        </Space>
      </Space>
    </div>
  );
}

export default ClientAvatar;
