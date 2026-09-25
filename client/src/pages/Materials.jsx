import { useState, useEffect } from 'react';
import axios from 'axios';

function Materials() {
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = searchTerm
        ? `http://localhost:5000/api/materials/search?query=${searchTerm}`
        : 'http://localhost:5000/api/materials';
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMaterials(res.data);
      setError('');
    } catch (err) {
      setError('Could not load materials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMaterials();
  };

  const handleDownload = (id) => {
    const token = localStorage.getItem('token');
    window.open(`http://localhost:5000/api/materials/${id}/download?token=${token}`, '_blank');
  };

  return (
    <div>
      <h2>Study Materials</h2>

      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && materials.length === 0 && <p>No materials found.</p>}

      <ul>
        {materials.map((m) => (
          <li key={m._id}>
            <strong>{m.title}</strong> — {m.type} ({m.subject?.name})
            <button onClick={() => handleDownload(m._id)} style={{ marginLeft: '10px' }}>
              Download
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Materials;