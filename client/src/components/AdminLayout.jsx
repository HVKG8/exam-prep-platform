import { useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import "./AdminLayout.css";
import Logo from "./Logo";

const adminLinks = [
  { to: "/admin", label: "Overview", icon: "📊", end: true },
  { to: "/admin/users", label: "Users", icon: "👥" },
  { to: "/admin/materials", label: "Materials", icon: "📘" },
  { to: "/admin/ai-usage", label: "AI Usage", icon: "🤖" },
];

function AdminLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <button
          className="admin-menu-btn"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
        <span className="admin-topbar-title">🛡️ Admin Panel</span>
      </div>

      {open && <div className="admin-overlay" onClick={() => setOpen(false)} />}

      <aside className={`admin-sidebar ${open ? "open" : ""}`}>
        <div className="admin-brand">
          <Logo size={44} />
          <div>
            <p className="admin-brand-name">ExamPrep AI</p>
            <span className="admin-brand-badge">ADMIN</span>
          </div>
        </div>

        <p className="admin-nav-label">MANAGE</p>
        <nav className="admin-nav">
          {adminLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="admin-nav-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <Link to="/dashboard" className="admin-back-link">
          ← Back to app
        </Link>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;