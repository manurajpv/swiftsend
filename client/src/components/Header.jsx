import React from "react";
import  Logo  from '../assets/logo.svg'; // Assuming the logo is an SVG file
import { Typography, Layout, theme } from "antd";

const { Header } = Layout;
const { Title } = Typography;

function HeaderSection() {
  return (
    <Layout>
      <Header style={{ display: "flex", alignItems: "center", padding:"0", gap:"0.25rem"}}>
        <img style={{width: "4rem", height:"4rem", padding:"0.75rem"}} src={Logo}/>
        <Title level={3} style={{ color: 'white', margin: 0 }}>SwiftSend</Title>
      </Header>
    </Layout>
  );
}

export default HeaderSection;
