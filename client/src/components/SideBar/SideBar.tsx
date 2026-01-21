import { Link } from "react-router-dom";
import { motion, AnimatePresence, Transition } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faTasks,
  faCalendar,
  faChartBar,
  faCog,
  faChevronLeft,
  faChevronRight,
  faUserCircle,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./SideBar.module.css";

interface SideBarProps {
  isHidden: boolean;
  setIsHidden: (value: boolean) => void;
}

const SideBar: React.FC<SideBarProps> = ({ isHidden, setIsHidden }) => {
  const toggleSidebar = () => {
    setIsHidden(!isHidden);
  };

  // サイドバーのアニメーション設定
  const sidebarVariants = {
    visible: {
      x: 0,
    },
    hidden: {
      x: "-100%",
    },
  };
  const sidebarAnimation: Transition = {
    type: "spring",
    stiffness: 300,
    damping: 30,
  };

  const toggleBtnTransition: Transition = {
    duration: 0.2,
  };

  return (
    <>
      {/* サイドバーが非表示の時に表示するトグルボタン */}
      <AnimatePresence mode="wait">
        {isHidden && (
          <motion.button
            key="toggle-button"
            className={styles.toggleBtn}
            onClick={toggleSidebar}
            aria-label="サイドバーを表示"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={toggleBtnTransition}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </motion.button>
        )}
      </AnimatePresence>

      <motion.aside
        className={styles.sidebar}
        variants={sidebarVariants}
        initial="visible"
        animate={isHidden ? "hidden" : "visible"}
        transition={sidebarAnimation}
      >
        <div className={styles.logo}>
          <img src="/logo.png" alt="Logo" />
          <motion.button
            className={styles.sidebarHideBtn}
            onClick={toggleSidebar}
            aria-label="サイドバーを隠す"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </motion.button>
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
      </motion.aside>
    </>
  );
};

export default SideBar;
