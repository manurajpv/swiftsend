import React, { useContext, useEffect, useState } from "react";
import { UploadOutlined, SendOutlined } from "@ant-design/icons";
import { Avatar, Space, Popover, Upload, Button } from "antd";
import AvatarIcons from "../utils/avatarIcons.js";
import { Typography } from "antd";
import { RemotePeerContext } from "../utils/Contexts";

const { Title } = Typography;

function ClientAvatar(props) {
  const remotePeer = useContext(RemotePeerContext);
  const [clickedPeer, setClickedPeer] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const handleUpload = () => {
    console.log(fileList);
    setUploading(true);
    remotePeer.sendFile();
  };
  const handleChange = (info) => {
    console.log(info);
    if (info.fileList.length > 0) {
      setFileList([info.fileList[0].originFileObj]);
      remotePeer.setFileToSend(info.fileList[0].originFileObj);
    } else {
      setFileList([]);
      remotePeer.setFileToSend(null);
    }
  };
  const uploadProps = {
    onRemove: (file) => {
      this.setState((state) => {
        const index = state.fileList.indexOf(file);
        const newFileList = state.fileList.slice();
        newFileList.splice(index, 1);
        return {
          fileList: newFileList,
        };
      });
    },
    beforeUpload: (file) => {
      setFileList([file]);
      console.log(fileList);
      this.setState((state) => ({
        fileList: [...state.fileList, file],
      }));
      return false;
    },
    fileList,
  };
  const content = (
    <div>
      <Upload onChange={handleChange} showUploadList={false}>
        <Button icon={<UploadOutlined />}> Select File</Button>
      </Upload>
      <Button
        type="primary"
        onClick={handleUpload}
        disabled={fileList.length === 0}
        loading={uploading}
        style={{ marginTop: 16 }}
      >
        {uploading ? "Uploading" : "Send File"}
      </Button>
    </div>
  );
  useEffect(() => {
    // Attempt to connect to peer only when clickedPeer is set
    if (clickedPeer && !remotePeer.remotePeerName) {
      remotePeer.setRemotePeerId(clickedPeer.peerId);
      remotePeer.setRemotePeerName(clickedPeer.peerName);
    }
  }, [clickedPeer, remotePeer]);

  return (
    <div style={{}}>
      <Space direction="vertical" size={16}>
        <Space
          wrap
          size={16}
          style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
        >
          <Popover
            content={content}
            title="Select File to Send"
            trigger="click"
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
                setClickedPeer(props.client);
              }}
            />
          </Popover>
          <Title level={5} style={{ margin: "0", textTransform: "capitalize" }}>
            {props.client.peerName}{" "}
          </Title>
        </Space>
      </Space>
    </div>
  );
}

export default ClientAvatar;
