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

const SideBar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="logo">
        <img src="../assets/logo.png" alt="Logo" />
        <button id="hideSidebar" className="sidebar-hide-btn">
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
      </div>
      <nav className="menu">
        <Link to="/" className="menu-item">
          <FontAwesomeIcon icon={faHome} />
          <span>Home</span>
        </Link>
        <Link to="/tasks" className="menu-item">
          <FontAwesomeIcon icon={faTasks} />
          <span>Tasks</span>
        </Link>
        <Link to="/calendar" className="menu-item">
          <FontAwesomeIcon icon={faCalendar} />
          <span>Calendar</span>
        </Link>
        <Link to="/gantt" className="menu-item">
          <FontAwesomeIcon icon={faChartBar} />
          <span>Gantt</span>
        </Link>
        <Link to="/settings" className="menu-item">
          <FontAwesomeIcon icon={faCog} />
          <span>Settings</span>
        </Link>
      </nav>
      <div className="bottom-section">
        <select id="projectSelect">
          <option value="default">デフォルトプロジェクト</option>
        </select>
        <div className="user-icon" id="userIcon">
          <FontAwesomeIcon icon={faUserCircle} />
        </div>
      </div>
    </aside>
  );
};

export default SideBar;
