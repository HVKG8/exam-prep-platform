import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Sidebar.css";

function Sidebar({ selectedConversationId, onSelectConversation, onNewChat, refreshTrigger }) {
  const [conversations, setConversations] = useState([]);
  const [user, setUser] = useState(null);
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
      if (onNewChat) onNewChat();
    } catch (error) {
      console.error(error);
    }
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

      <hr className="sidebar-divider" />

      <button className="sidebar-new-chat-btn" onClick={handleNewChat}>
        + New Chat
      </button>

      <ul className="sidebar-chat-list">
        {conversations.map((conv) => (
          <li
            key={conv._id}
            onClick={() => onSelectConversation && onSelectConversation(conv._id)}
            className={`sidebar-chat-item ${conv._id === selectedConversationId ? "active" : ""}`}
          >
            {conv.title}
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