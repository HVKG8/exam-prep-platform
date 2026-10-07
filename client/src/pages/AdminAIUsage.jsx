import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import "./Admin.css";
import "./AdminUsers.css";
import "./AdminAIUsage.css";

function formatWhen(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

// "2026-10-07" -> Date (local, no timezone shifting)
function fromKey(key) {
  return new Date(`${key}T00:00:00`);
}

function AdminAIUsage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/admin/ai-usage`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setData(res.data);
      } catch (err) {
        setError("Could not load AI usage. Please refresh.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <p className="admin-loading">Loading AI usage...</p>;

  if (error || !data) {
    return (
      <div className="admin-page">
        <p className="admin-error-banner">{error || "Something went wrong."}</p>
      </div>
    );
  }

  const maxCount = Math.max(1, ...data.daily.map((d) => d.count));

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>AI Usage</h1>
          <p>See how students are using the AI Tutor.</p>
        </div>
      </div>

      <div className="aiu-stats">
        <div className="admin-panel aiu-card">
          <p className="aiu-card-label">Today</p>
          <p className="aiu-card-value">{data.today}</p>
          <p className="aiu-card-note">questions asked</p>
        </div>
        <div className="admin-panel aiu-card">
          <p className="aiu-card-label">Last 7 days</p>
          <p className="aiu-card-value">{data.last7}</p>
          <p className="aiu-card-note">questions asked</p>
        </div>
        <div className="admin-panel aiu-card">
          <p className="aiu-card-label">All time</p>
          <p className="aiu-card-value">{data.total}</p>
          <p className="aiu-card-note">questions asked</p>
        </div>
      </div>

      <div className="admin-panel aiu-section">
        <h3 className="aiu-title">Questions per day</h3>
        <p className="aiu-subtitle">Last 14 days</p>
        <div className="aiu-chart">
          {data.daily.map((d) => {
            const date = fromKey(d.date);
            const height = d.count === 0 ? 2 : Math.max(6, (d.count / maxCount) * 100);
            return (
              <div
                className="aiu-bar-col"
                key={d.date}
                title={`${date.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}: ${d.count}`}
              >
                <span className="aiu-bar-value">{d.count}</span>
                <div className="aiu-bar-track">
                  <div
                    className={`aiu-bar ${d.count === 0 ? "empty" : ""}`}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="aiu-bar-label">{date.getDate()}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="admin-panel aiu-section">
        <h3 className="aiu-title">Most active students</h3>
        <p className="aiu-subtitle">By total questions asked</p>
        {data.topStudents.length === 0 ? (
          <p className="admin-empty">No questions have been asked yet.</p>
        ) : (
          <div className="aiu-top-list">
            {data.topStudents.map((s, i) => (
              <div className="aiu-top-row" key={`${s.email}-${i}`}>
                <span className="aiu-rank">{i + 1}</span>
                <div className="admin-recent-avatar">
                  {(s.name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="admin-recent-text aiu-top-text">
                  <p className="admin-recent-name">{s.name}</p>
                  <p className="admin-recent-email">{s.email}</p>
                </div>
                <span className="aiu-top-count">{s.questions}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-panel admin-table-panel aiu-section-flush">
        <div className="aiu-table-head">
          <h3 className="aiu-title">Recent questions</h3>
          <p className="aiu-subtitle">The 15 latest, newest first</p>
        </div>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Question</th>
                <th>Marks</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((r, i) => (
                <tr key={i}>
                  <td className="aiu-student-cell">{r.student}</td>
                  <td className="aiu-question-cell">{r.question}</td>
                  <td>{r.marks ? `${r.marks}` : "—"}</td>
                  <td className="admin-date-cell">{formatWhen(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.recent.length === 0 && (
            <p className="admin-empty">No questions have been asked yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminAIUsage;