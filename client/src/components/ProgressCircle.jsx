import React from "react";
import { useContext } from "react";
import { Flex, Progress } from "antd";
import { FileProgressContext, RemotePeerContext } from "../utils/Contexts";
const ProgressCircle = ({ children }) => {
  const progressContext = useContext(FileProgressContext);
  const remotePeer = useContext(RemotePeerContext);
  console.log(progressContext.progress);
  return (
    <div>
      <Flex vertical gap="small" style={{ width: 180 }} align="center">
        {children}
        {remotePeer.remotePeerName && (
          <Progress percent={progressContext.progress} size="small" />
        )}
      </Flex>
    </div>
  );
};

export default ProgressCircle;
