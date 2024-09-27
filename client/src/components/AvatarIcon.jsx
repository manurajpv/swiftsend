import React from "react";
import { UserOutlined } from "@ant-design/icons";
import { Avatar, Space } from "antd";
import AvatarIcons from "../utils/avatarIcons.js";
import { Typography } from "antd";

const { Title } = Typography;

function AvatarIcon(props) {
  return (
    <div style={{ position: "absolute", bottom: "1rem", display:"flex", justifyContent:"center", width:"100%"}}>
      <Space
        direction="vertical"
        size={16}
        
      >
        <Space
          wrap
          size={16}
          style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
        >
          <Avatar
            size={64}
            src={
              props.peerName ? AvatarIcons[props.peerName.split(" ")[1]] : ""
            }
          />
          <Title level={5} style={{ margin: "0", textTransform: "capitalize" }}>
            {props.peerName}{" "}
          </Title>
        </Space>
      </Space>
    </div>
  );
}

export default AvatarIcon;
