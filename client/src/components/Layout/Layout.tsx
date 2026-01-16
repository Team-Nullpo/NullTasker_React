import React from "react";
import SideBar from "../SideBar/SideBar";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="App">
      <SideBar />
      {children}
    </div>
  );
};

export default Layout;
