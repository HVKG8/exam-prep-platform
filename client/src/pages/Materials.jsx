import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import './Materials.css';

function Materials() {
  const [searchParams] = useSearchParams();
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

  const typeOptions = [
  { value: '', label: 'All Types', icon: '📁' },
  { value: 'notes', label: 'Notes', icon: '📝' },
  { value: 'book', label: 'Book', icon: '📕' },
  { value: 'assignment', label: 'Assignment', icon: '🗂️' },
  { value: 'question-paper', label: 'Question Paper', icon: '📄' },
  { value: 'diagram', label: 'Diagram', icon: '🖼️' },
  { value: 'syllabus', label: 'Syllabus', icon: '📋' },
  { value: 'revision', label: 'Revision', icon: '⚡' },
];

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

  // NEW: clicking a subject in the left panel sets the filter and refetches
  const handleSubjectClick = (subjectId) => {
    setSubjectFilter(subjectId);
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

  const getTypeIcon = (type) => {
  const icons = {
    notes: '📝',
    book: '📕',
    assignment: '🗂️',
    'question-paper': '📄',
    diagram: '🖼️',
    syllabus: '📋',
    revision: '⚡',
  };
  return icons[type] || '📁';
};

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-container">
        <h1>Study Materials</h1>

        <div className="materials-body">
          {/* LEFT PANEL: Subjects */}
          <div className="materials-subjects-panel">
            <button
              className={`subject-nav-item ${subjectFilter === '' ? 'active' : ''}`}
              onClick={() => handleSubjectClick('')}
            >
              All Subjects
            </button>
            {subjects.map((s) => (
              <button
                key={s._id}
                className={`subject-nav-item ${subjectFilter === s._id ? 'active' : ''}`}
                onClick={() => handleSubjectClick(s._id)}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* RIGHT PANEL: everything else, unchanged for now */}
          <div className="materials-main-panel">
            <div className="materials-toolbar">
              <form onSubmit={handleSearch} className="search-form">
  <span className="search-icon">🔍</span>
  <input
    type="text"
    className="search-input"
    placeholder="Search materials by title..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
  <button type="submit" className="btn search-btn">Search</button>
</form>

              <div className="type-tabs">
  {typeOptions.map((opt) => (
    <button
      key={opt.value}
      className={`type-tab ${typeFilter === opt.value ? 'active' : ''}`}
      onClick={() => {
        setTypeFilter(opt.value);
        handleFilterChange();
      }}
    >
      {opt.icon} {opt.label}
    </button>
  ))}
</div>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p className="error-text">{error}</p>}
            {!loading && !error && materials.length === 0 && <p>No materials found.</p>}

            <div className="materials-grid">
  {materials.map((m) => (
    <div key={m._id} className="material-card">
      <div className="material-card-icon">{getTypeIcon(m.type)}</div>
      <div className="material-card-body">
        <h4 className="material-card-title">{m.title}</h4>
        <p className="material-card-subject">{m.subject?.name}</p>
        <span className="material-card-badge">{m.type}</span>
      </div>
      <div className="material-card-actions">
        <button onClick={() => handleDownload(m._id)} className="btn-outline">
          Download
        </button>
        {(userRole === 'teacher' || userRole === 'admin') && (
          <button onClick={() => handleDelete(m._id)} className="btn-danger">
            Delete
          </button>
        )}
      </div>
    </div>
  ))}
</div>

            {(userRole === 'teacher' || userRole === 'admin') && (
              <div className="card upload-section">
                <h3>Upload Material</h3>
                <form onSubmit={handleUpload} className="upload-form">
                  <input
                    type="text"
                    className="input"
                    placeholder="Title"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                  />
                  <select
                    className="input"
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                  >
                    <option value="notes">Notes</option>
                    <option value="book">Book</option>
                    <option value="assignment">Assignment</option>
                    <option value="question-paper">Question Paper</option>
                    <option value="diagram">Diagram</option>
                    <option value="syllabus">Syllabus</option>
                    <option value="revision">Quick Revision</option>
                  </select>
                  <select
                    className="input"
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value)}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <input type="file" onChange={(e) => setUploadFile(e.target.files[0])} />
                  <button type="submit" className="btn" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </form>
                {uploadMessage && <p className="upload-message">{uploadMessage}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Materials;