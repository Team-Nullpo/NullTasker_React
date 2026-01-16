import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faTasks,
  faCalendar,
  faChartBar,
  faCog,
  faChevronLeft,
  faUserCircle,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./SideBar.module.css";

const SideBar: React.FC = () => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <img src="../assets/logo.png" alt="Logo" />
        <button id="hideSidebar" className={styles.sidebarHideBtn}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
      </div>
      <nav className={styles.menu}>
        <Link to="/" className={styles.menuItem}>
          <FontAwesomeIcon icon={faHome} />
          <span>Home</span>
        </Link>
        <Link to="/tasks" className={styles.menuItem}>
          <FontAwesomeIcon icon={faTasks} />
          <span>Tasks</span>
        </Link>
        <Link to="/calendar" className={styles.menuItem}>
          <FontAwesomeIcon icon={faCalendar} />
          <span>Calendar</span>
        </Link>
        <Link to="/gantt" className={styles.menuItem}>
          <FontAwesomeIcon icon={faChartBar} />
          <span>Gantt</span>
        </Link>
        <Link to="/settings" className={styles.menuItem}>
          <FontAwesomeIcon icon={faCog} />
          <span>Settings</span>
        </Link>
      </nav>
      <div className={styles.bottomSection}>
        <select id="projectSelect">
          <option value="default">デフォルトプロジェクト</option>
        </select>
        <div className={styles.userIcon}>
          <FontAwesomeIcon icon={faUserCircle} />
        </div>
      </div>
    </aside>
  );
};

export default SideBar;
