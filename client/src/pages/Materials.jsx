import { useState, useEffect } from 'react';
import axios from 'axios';

function Materials() {
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMaterials() {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/materials', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMaterials(res.data);
      } catch (err) {
        setError('Could not load materials');
      } finally {
        setLoading(false);
      }
    }
    fetchMaterials();
  }, []);

  const handleDownload = (id) => {
    const token = localStorage.getItem('token');
    window.open(`http://localhost:5000/api/materials/${id}/download?token=${token}`, '_blank');
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>Study Materials</h2>
      {materials.length === 0 && <p>No materials found.</p>}
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