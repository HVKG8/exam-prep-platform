import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import "./Admin.css";
import "./AdminUsers.css";
import "./AdminMaterials.css";

const typeIcons = {
  notes: "📝",
  book: "📕",
  assignment: "🗂️",
  "question-paper": "📄",
  diagram: "🖼️",
  syllabus: "📋",
  revision: "⚡",
};

const getName = (value, key) => {
  if (!value) return "—";
  if (typeof value === "string") return value;
  return value[key] || "—";
};

function AdminMaterials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [confirmId, setConfirmId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(20);

  const config = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  useEffect(() => {
    axios
      .get(`${API_URL}/api/materials`, config())
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data.materials || [];
        setMaterials(list);
      })
      .catch(() => setError("Could not load materials. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setVisibleCount(20);
  }, [search, subjectFilter, typeFilter]);

  const handleDelete = async (id) => {
    setError("");
    try {
      await axios.delete(`${API_URL}/api/materials/${id}`, config());
      setMaterials((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete material");
    } finally {
      setConfirmId(null);
    }
  };

  const subjectNames = [
    ...new Set(materials.map((m) => getName(m.subject, "name")).filter((n) => n !== "—")),
  ].sort();
  const typeNames = [...new Set(materials.map((m) => m.type).filter(Boolean))].sort();

  const filtered = materials.filter((m) => {
    const text = search.trim().toLowerCase();
    const matchesSearch = !text || (m.title || "").toLowerCase().includes(text);
    const matchesSubject =
      subjectFilter === "all" || getName(m.subject, "name") === subjectFilter;
    const matchesType = typeFilter === "all" || m.type === typeFilter;
    return matchesSearch && matchesSubject && matchesType;
  });

  const visible = filtered.slice(0, visibleCount);

  if (loading) return <p className="admin-loading">Loading materials...</p>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Materials</h1>
          <p>{materials.length} files uploaded across {subjectNames.length} subjects.</p>
        </div>
      </div>

      {error && <p className="admin-error-banner">{error}</p>}

      <div className="admin-toolbar admin-toolbar-wrap">
        <input
          className="admin-search"
          type="text"
          placeholder="🔍  Search by title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="admin-filter"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
        >
          <option value="all">All subjects</option>
          {subjectNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <select
          className="admin-filter"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All types</option>
          {typeNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      <div className="admin-panel admin-table-panel">
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Subject</th>
                <th>Type</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((m) => (
                <tr key={m._id}>
                  <td>
                    <div className="admin-user-cell">
                      <div className="admin-material-icon">
                        {typeIcons[m.type] || "📄"}
                      </div>
                      <div className="admin-recent-text">
                        <p className="admin-recent-name">{m.title}</p>
                        <p className="admin-recent-email">{getName(m.topic, "title")}</p>
                      </div>
                    </div>
                  </td>
                  <td className="admin-date-cell">{getName(m.subject, "name")}</td>
                  <td>
                    <span className="admin-type-badge">{m.type || "—"}</span>
                  </td>
                  <td>
                    {confirmId === m._id ? (
                      <div className="admin-confirm">
                        <span>Sure?</span>
                        <button
                          className="admin-btn-danger"
                          onClick={() => handleDelete(m._id)}
                        >
                          Yes
                        </button>
                        <button
                          className="admin-btn-ghost"
                          onClick={() => setConfirmId(null)}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="admin-actions">
                        {m.fileUrl && (
                          <a
                            className="admin-btn-ghost admin-btn-link"
                            href={m.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View
                          </a>
                        )}
                        <button
                          className="admin-btn-ghost admin-btn-delete"
                          onClick={() => setConfirmId(m._id)}
                        >
                          🗑 Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="admin-empty">No materials match your filters.</p>
          )}
        </div>

        {filtered.length > visibleCount && (
          <div className="admin-show-more">
            <button
              className="admin-btn-ghost"
              onClick={() => setVisibleCount((c) => c + 20)}
            >
              Show more ({filtered.length - visibleCount} left)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminMaterials;