import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import "./Admin.css";
import "./AdminUsers.css";

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [confirmId, setConfirmId] = useState(null);

  const config = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, meRes] = await Promise.all([
          axios.get(`${API_URL}/api/admin/users`, config()),
          axios.get(`${API_URL}/api/auth/me`, config()),
        ]);
        setUsers(usersRes.data);
        setMe(meRes.data);
      } catch (err) {
        setError("Could not load users. Please refresh.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const myId = me ? me._id || me.id : null;

  const handleRoleChange = async (id, role) => {
    setError("");
    try {
      const res = await axios.patch(
        `${API_URL}/api/admin/users/${id}/role`,
        { role },
        config()
      );
      setUsers((prev) => prev.map((u) => (u._id === id ? res.data : u)));
    } catch (err) {
      setError(err.response?.data?.message || "Could not change role");
    }
  };

  const handleDelete = async (id) => {
    setError("");
    try {
      await axios.delete(`${API_URL}/api/admin/users/${id}`, config());
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete user");
    } finally {
      setConfirmId(null);
    }
  };

  const visibleUsers = users.filter((u) => {
    const text = search.trim().toLowerCase();
    const matchesSearch =
      !text ||
      u.name.toLowerCase().includes(text) ||
      u.email.toLowerCase().includes(text);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) return <p className="admin-loading">Loading users...</p>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Users</h1>
          <p>{users.length} people have joined ExamPrep AI.</p>
        </div>
      </div>

      {error && <p className="admin-error-banner">{error}</p>}

      <div className="admin-toolbar">
        <input
          className="admin-search"
          type="text"
          placeholder="🔍  Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="admin-filter"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="admin-panel admin-table-panel">
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((u) => {
                const isMe = u._id === myId;
                return (
                  <tr key={u._id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-recent-avatar">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="admin-recent-text">
                          <p className="admin-recent-name">
                            {u.name} {isMe && <span className="admin-you">You</span>}
                          </p>
                          <p className="admin-recent-email">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        className={`admin-role-select ${u.role}`}
                        value={u.role}
                        disabled={isMe}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="admin-date-cell">{formatDate(u.createdAt)}</td>
                    <td>
                      {isMe ? (
                        <span className="admin-muted">—</span>
                      ) : confirmId === u._id ? (
                        <div className="admin-confirm">
                          <span>Sure?</span>
                          <button
                            className="admin-btn-danger"
                            onClick={() => handleDelete(u._id)}
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
                        <button
                          className="admin-btn-ghost admin-btn-delete"
                          onClick={() => setConfirmId(u._id)}
                        >
                          🗑 Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visibleUsers.length === 0 && (
            <p className="admin-empty">No users match your search.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminUsers;