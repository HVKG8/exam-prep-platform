import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Sidebar.css";

function Sidebar({ selectedConversationId, onSelectConversation, onNewChat, refreshTrigger }) {
  const [conversations, setConversations] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const location = useLocation();
  const navigate = useNavigate();

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [refreshTrigger]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  const handleConfirmDelete = async (e, id) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(conversations.filter((c) => c._id !== id));
      if (selectedConversationId === id) {
        onSelectConversation(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDeleteConfirmId(null);
      setOpenMenuId(null);
    }
  };

  const startRename = (e, id, currentTitle) => {
    e.stopPropagation();
    setRenamingId(id);
    setRenameValue(currentTitle);
    setOpenMenuId(null);
  };

  const submitRename = async (id) => {
    const trimmed = renameValue.trim();
    setRenamingId(null);
    if (!trimmed) return;

    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:5000/api/conversations/${id}`,
        { title: trimmed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConversations(
        conversations.map((c) => (c._id === id ? { ...c, title: trimmed } : c))
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleRenameKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    } else if (e.key === "Escape") {
      setRenamingId(null);
    }
  };

  const handleNewChat = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/conversations",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConversations([res.data, ...conversations]);
      if (onSelectConversation) onSelectConversation(res.data._id);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navLinks = [
    { to: "/dashboard", label: "Home", icon: "🏠" },
    { to: "/materials", label: "Material", icon: "📘" },
    { to: "/solver", label: "AI Tutor", icon: "🤖" },
    { to: "/history", label: "History", icon: "🕓" },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        🎓 ExamPrep <span>AI</span>
      </div>

      <nav className="sidebar-nav">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`sidebar-nav-link ${location.pathname === link.to ? "active" : ""}`}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>

      <button className="sidebar-theme-toggle" onClick={toggleTheme}>
        {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
      </button>

      <hr className="sidebar-divider" />

      <button className="sidebar-new-chat-btn" onClick={handleNewChat}>
        + New Chat
      </button>

      <ul className="sidebar-chat-list">
        {conversations.map((conv) => (
          <li
            key={conv._id}
            onClick={() => onSelectConversation(conv._id)}
            className={`sidebar-chat-item ${conv._id === selectedConversationId ? "active" : ""}`}
          >
            {renamingId === conv._id ? (
              <input
                className="sidebar-chat-rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleRenameKeyDown}
                onBlur={() => submitRename(conv._id)}
                autoFocus
              />
            ) : (
              <span className="sidebar-chat-title">{conv.title}</span>
            )}

            <div className="sidebar-chat-menu-wrapper">
              <button
                className="sidebar-chat-dots"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirmId(null);
                  setOpenMenuId(openMenuId === conv._id ? null : conv._id);
                }}
              >
                ⋮
              </button>
              {openMenuId === conv._id && (
                <div className="sidebar-chat-dropdown" onClick={(e) => e.stopPropagation()}>
                  {deleteConfirmId === conv._id ? (
                    <>
                      <span className="sidebar-chat-confirm-text">Delete this chat?</span>
                      <button onClick={(e) => handleConfirmDelete(e, conv._id)}>
                        Confirm
                      </button>
                      <button onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={(e) => startRename(e, conv._id, conv.title)}>
                        ✏ Rename
                      </button>
                      <button onClick={() => setDeleteConfirmId(conv._id)}>
                        🗑 Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {user && (
        <div className="sidebar-footer">
          <div className="sidebar-avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div>
            <p className="sidebar-username">{user.name}</p>
            <p className="sidebar-role">{user.role}</p>
          </div>
        </div>
      )}

      <button onClick={handleLogout} className="sidebar-logout-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Logout
      </button>
    </div>
  );
}

export default Sidebar;