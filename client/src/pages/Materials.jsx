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
  const [userRole, setUserRole] = useState('');

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState('notes');
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserRole(res.data.role);
    } catch (err) {
      console.error('Could not load user info', err);
    }
  };

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
    fetchUser();
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

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this material?');
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/materials/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMaterials();
    } catch (err) {
      alert('Failed to delete material.');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle || !uploadSubject) {
      setUploadMessage('Please fill in title, subject, and choose a file.');
      return;
    }

    setUploading(true);
    setUploadMessage('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle);
      formData.append('type', uploadType);
      formData.append('subject', uploadSubject);

      await axios.post('http://localhost:5000/api/materials', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadMessage('Upload successful!');
      setUploadTitle('');
      setUploadType('notes');
      setUploadSubject('');
      setUploadFile(null);
      e.target.reset();
      fetchMaterials();
    } catch (err) {
      setUploadMessage('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
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
            {(userRole === 'teacher' || userRole === 'admin') && (
              <button
                onClick={() => handleDelete(m._id)}
                style={{ marginLeft: '10px', color: 'red' }}
              >
                Delete
              </button>
            )}
          </li>
        ))}
      </ul>

      {(userRole === 'teacher' || userRole === 'admin') && (
        <div style={{ marginTop: '30px', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
          <h3>Upload Material</h3>
          <form onSubmit={handleUpload}>
            <div>
              <input
                type="text"
                placeholder="Title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
              />
            </div>
            <div style={{ marginTop: '8px' }}>
              <select value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
                <option value="notes">Notes</option>
                <option value="book">Book</option>
                <option value="assignment">Assignment</option>
                <option value="question-paper">Question Paper</option>
                <option value="diagram">Diagram</option>
              </select>
            </div>
            <div style={{ marginTop: '8px' }}>
              <select value={uploadSubject} onChange={(e) => setUploadSubject(e.target.value)}>
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginTop: '8px' }}>
              <input type="file" onChange={(e) => setUploadFile(e.target.files[0])} />
            </div>
            <button type="submit" disabled={uploading} style={{ marginTop: '8px' }}>
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
          {uploadMessage && <p>{uploadMessage}</p>}
        </div>
      )}
    </div>
  );
}

export default Materials;