import { useState, useEffect } from 'react';
import axios from 'axios';

function Materials() {
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/subjects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(res.data);
    } catch (err) {
      console.error('Could not load subjects', err);
    }
  };

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url;

      if (searchTerm) {
        url = `http://localhost:5000/api/materials/search?query=${searchTerm}`;
      } else {
        const params = new URLSearchParams();
        if (subjectFilter) params.append('subject', subjectFilter);
        if (typeFilter) params.append('type', typeFilter);
        url = `http://localhost:5000/api/materials?${params.toString()}`;
      }

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
    fetchSubjects();
    fetchMaterials();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMaterials();
  };

  const handleFilterChange = () => {
    setSearchTerm('');
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

      <div style={{ marginTop: '10px' }}>
        <select
          value={subjectFilter}
          onChange={(e) => {
            setSubjectFilter(e.target.value);
            handleFilterChange();
          }}
        >
          <option value="">All Subjects</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            handleFilterChange();
          }}
          style={{ marginLeft: '10px' }}
        >
          <option value="">All Types</option>
          <option value="notes">Notes</option>
          <option value="book">Book</option>
          <option value="assignment">Assignment</option>
          <option value="question-paper">Question Paper</option>
          <option value="diagram">Diagram</option>
        </select>
      </div>

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