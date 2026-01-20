import React from "react";
import SideBar from "../SideBar/SideBar";
import styles from "./Layout.module.css";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className={styles.App}>
      <SideBar />
      {children}
    </div>
  );
};

export default Layout;
