import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav style={{ padding: '10px', borderBottom: '1px solid #ccc', marginBottom: '20px' }}>
      <Link to="/dashboard" style={{ marginRight: '15px' }}>Dashboard</Link>
      <Link to="/solver" style={{ marginRight: '15px' }}>AI Solver</Link>
      <Link to="/materials" style={{ marginRight: '15px' }}>Materials</Link>
      <button onClick={handleLogout}>Logout</button>
    </nav>
  );
}

export default Navbar;