import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import "./Admin.css";

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Admin() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setStats(res.data))
      .catch(() => setError("Could not load admin stats. Please refresh."));
  }, []);

  if (error) return <p className="admin-error">{error}</p>;
  if (!stats) return <p className="admin-loading">Loading overview...</p>;

  const cards = [
    { label: "Total Users", value: stats.users.total, icon: "👥", color: "indigo" },
    { label: "Materials", value: stats.materials, icon: "📘", color: "blue" },
    { label: "Subjects", value: stats.subjects, icon: "📚", color: "green" },
    { label: "Topics", value: stats.topics, icon: "🗂️", color: "orange" },
    { label: "AI Chats", value: stats.conversations, icon: "🤖", color: "purple" },
    { label: "Viva Sessions", value: stats.vivas, icon: "🎤", color: "pink" },
  ];

  const roles = [
    { label: "Students", value: stats.users.students },
    { label: "Teachers", value: stats.users.teachers },
    { label: "Admins", value: stats.users.admins },
  ];

  return (
    <div className="admin-page">
      <div className="admin-hero">
        <div>
          <h1>Admin Overview</h1>
          <p>Everything happening in ExamPrep AI, at a glance.</p>
        </div>
        <span className="admin-hero-emoji">🛡️</span>
      </div>

      <div className="admin-stat-grid">
        {cards.map((card) => (
          <div key={card.label} className="admin-stat-card">
            <div className={`admin-stat-icon ${card.color}`}>{card.icon}</div>
            <div>
              <p className="admin-stat-value">{card.value}</p>
              <p className="admin-stat-label">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-two-col">
        <div className="admin-panel">
          <h2>Users by role</h2>
          <div className="admin-role-list">
            {roles.map((role) => {
              const percent = stats.users.total
                ? Math.round((role.value / stats.users.total) * 100)
                : 0;
              return (
                <div key={role.label} className="admin-role-row">
                  <div className="admin-role-top">
                    <span>{role.label}</span>
                    <strong>{role.value}</strong>
                  </div>
                  <div className="admin-role-bar">
                    <div
                      className="admin-role-fill"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="admin-panel">
          <h2>Recent signups</h2>
          <ul className="admin-recent-list">
            {stats.recentUsers.map((u) => (
              <li key={u._id} className="admin-recent-item">
                <div className="admin-recent-avatar">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="admin-recent-text">
                  <p className="admin-recent-name">{u.name}</p>
                  <p className="admin-recent-email">{u.email}</p>
                </div>
                <div className="admin-recent-right">
                  <span className={`admin-role-badge ${u.role}`}>{u.role}</span>
                  <span className="admin-recent-date">
                    {formatDate(u.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Admin;