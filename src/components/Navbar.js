import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { isAdminRole } from "../utils/auth";
import {
  FiHome,
  FiClipboard,
  FiBarChart2,
  FiCalendar,
  FiBookOpen,
  FiUser,
  FiTool,
  FiFileText,
  FiFeather,
  FiMenu,
  FiX,
} from "react-icons/fi";
 
const links = [
  { to: "/", label: "Home", icon: FiHome },
  { to: "/assessment", label: "Assessment", icon: FiClipboard },
  { to: "/dashboard", label: "Dashboard", icon: FiBarChart2 },
  { to: "/appointment", label: "Book", icon: FiCalendar },
  { to: "/blog", label: "Blog", icon: FiBookOpen },
  { to: "/profile", label: "Profile", icon: FiUser },
];

const adminLinks = [
  { to: "/admin/users", label: "Users", icon: FiTool },
  { to: "/admin/booked-slots", label: "Booked Slots", icon: FiFileText },
];

const mobileBottomLinks = [
  { to: "/", label: "Home", icon: FiHome },
  { to: "/assessment", label: "Assess", icon: FiClipboard },
  { to: "/dashboard", label: "Dash", icon: FiBarChart2 },
  { to: "/appointment", label: "Book", icon: FiCalendar },
  { to: "/profile", label: "Profile", icon: FiUser },
];
 
function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = isAdminRole(user?.role);
  const navLinks = isAdmin ? [...links, ...adminLinks] : links;
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <nav className="navbar">
        <NavLink to="/" className="nav-logo">
          <span className="nav-logo-icon" aria-hidden="true"><FiFeather /></span> Wellify
        </NavLink>

        <button
          type="button"
          className="nav-menu-btn"
          aria-label="Toggle navigation menu"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
        </button>
 
        <div className={`nav-links${mobileOpen ? " mobile-open" : ""}`}>
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
              onClick={() => setMobileOpen(false)}
            >
              <span className="nav-link-icon" aria-hidden="true">
                <l.icon />
              </span>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="nav-actions">
          <NavLink to="/assessment" className="btn-primary nav-assess" onClick={() => setMobileOpen(false)}>
            Start Assessment
          </NavLink>

          <div className="nav-user">
            <span className="nav-user-name">{user?.name || "User"}</span>
            <button type="button" className="btn-outline nav-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="mobile-bottom-nav">
        {mobileBottomLinks.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            className={({ isActive }) => "mobile-bottom-link" + (isActive ? " active" : "")}
          >
            <span className="mobile-bottom-icon" aria-hidden="true">
              <l.icon />
            </span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </div>
    </>
  );
}
 
export default Navbar;
 