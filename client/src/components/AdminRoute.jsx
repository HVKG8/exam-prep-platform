import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";

function AdminRoute({ children }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setStatus("denied");
      return;
    }

    axios
      .get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const role = res.data.role || res.data.user?.role;
        setStatus(role === "admin" ? "allowed" : "denied");
      })
      .catch(() => setStatus("denied"));
  }, []);

  if (status === "checking") {
    return <p style={{ padding: "2rem" }}>Checking access...</p>;
  }
  if (status === "denied") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default AdminRoute;