import React, { useState } from "react";
import { motion } from "motion/react";
import SideBar from "../SideBar/SideBar";
import styles from "./Layout.module.css";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);

  return (
    <div className={styles.App}>
      <SideBar isHidden={isSidebarHidden} setIsHidden={setIsSidebarHidden} />
      <motion.main
        className={styles.mainContent}
        animate={{
          marginLeft: isSidebarHidden ? 0 : 380,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      >
        {children}
      </motion.main>
    </div>
  );
};

export default Layout;
