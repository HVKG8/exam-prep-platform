import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-link">Dashboard</Link>
      <Link to="/solver" className="navbar-link">AI Solver</Link>
      <Link to="/materials" className="navbar-link">Materials</Link>
      <Link to="/history" className="navbar-link">History</Link>
      <div className="navbar-spacer"></div>
      <button onClick={handleLogout} className="logout-btn">Logout</button>
    </nav>
  );
}

export default Navbar;