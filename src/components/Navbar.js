import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { isAdminRole } from "../utils/auth";
 
const links = [
  { to: "/",            label: "Home",       icon: "🏠" },
  { to: "/assessment",  label: "Assessment", icon: "📝" },
  { to: "/dashboard",   label: "Dashboard",  icon: "📊" },
  { to: "/appointment", label: "Book",       icon: "📅" },
  { to: "/blog",        label: "Blog",       icon: "📚" },
  { to: "/profile",     label: "Profile",    icon: "👤" },
];

const adminLinks = [
  { to: "/admin/users", label: "Users", icon: "🛠️" },
  { to: "/admin/booked-slots", label: "Booked Slots", icon: "📋" },
];

const mobileBottomLinks = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/assessment", label: "Assess", icon: "📝" },
  { to: "/dashboard", label: "Dash", icon: "📊" },
  { to: "/appointment", label: "Book", icon: "📅" },
  { to: "/profile", label: "Profile", icon: "👤" },
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
          <span>🌿</span> Wellify
        </NavLink>

        <button
          type="button"
          className="nav-menu-btn"
          aria-label="Toggle navigation menu"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? "✕" : "☰"}
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
              <span className="nav-link-icon" aria-hidden="true">{l.icon}</span>
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
            <span className="mobile-bottom-icon" aria-hidden="true">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </div>
    </>
  );
}
 
export default Navbar;
 