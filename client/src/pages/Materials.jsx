import { API_URL } from '../config'
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
  const [newSubjectName, setNewSubjectName] = useState('');
  const [subjectMessage, setSubjectMessage] = useState('');
  const [addingSubject, setAddingSubject] = useState(false);
  const [topics, setTopics] = useState([]);
  const [uploadTopic, setUploadTopic] = useState('');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [topicMessage, setTopicMessage] = useState('');
  const [addingTopic, setAddingTopic] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState({});

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState('notes');
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploading, setUploading] = useState(false);

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

  const quickAccessOptions = [
    { value: 'notes', label: 'All Notes', icon: '📝' },
    { value: 'book', label: 'All Books', icon: '📕' },
    { value: 'assignment', label: 'All Assignments', icon: '🗂️' },
    { value: 'question-paper', label: 'All Question Papers', icon: '📄' },
    { value: 'diagram', label: 'All Diagrams', icon: '🖼️' },
    { value: 'syllabus', label: 'All Syllabus', icon: '📋' },
    { value: 'revision', label: 'All Revision', icon: '⚡' },
  ];

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(API_URL + '/api/auth/me', {
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
      const res = await axios.get(API_URL + '/api/subjects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(res.data);
    } catch (err) {
      console.error('Could not load subjects', err);
    }
  };

  const fetchTopics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(API_URL + '/api/topics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTopics(res.data);
    } catch (err) {
      console.error('Could not load topics', err);
    }
  };

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url;

      if (searchTerm) {
        url = API_URL + `/api/materials/search?query=${searchTerm}`;
      } else {
        const params = new URLSearchParams();
        if (subjectFilter) params.append('subject', subjectFilter);
        if (typeFilter) params.append('type', typeFilter);
        url = API_URL + `/api/materials?${params.toString()}`;
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
    fetchTopics();
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [subjectFilter, typeFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMaterials();
  };

  const handleFilterChange = () => {
    setSearchTerm('');
  };

  const handleSubjectClick = (subjectId) => {
    setSubjectFilter(subjectId);
    setSearchTerm('');
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) {
      setSubjectMessage('Please enter a subject name.');
      return;
    }

    setAddingSubject(true);
    setSubjectMessage('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        API_URL + '/api/subjects',
        { name: newSubjectName.trim(), semester: 7 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewSubjectName('');
      setSubjectMessage('Subject added!');
      fetchSubjects();
    } catch (err) {
      setSubjectMessage(err.response?.data?.message || 'Failed to add subject.');
    } finally {
      setAddingSubject(false);
    }
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !uploadSubject) {
      setTopicMessage('Select a subject above first, then enter a topic name.');
      return;
    }

    setAddingTopic(true);
    setTopicMessage('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        API_URL + '/api/topics',
        { title: newTopicTitle.trim(), subject: uploadSubject },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewTopicTitle('');
      setTopicMessage('Topic added!');
      fetchTopics();
    } catch (err) {
      setTopicMessage(err.response?.data?.message || 'Failed to add topic.');
    } finally {
      setAddingTopic(false);
    }
  };

  const handleDownload = (id) => {
    const token = localStorage.getItem('token');
    window.open(API_URL + `/api/materials/${id}/download?token=${token}`, '_blank');
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this material?');
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(API_URL + `/api/materials/${id}`, {
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
      if (uploadTopic) formData.append('topic', uploadTopic);

      await axios.post(API_URL + '/api/materials', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadMessage('Upload successful!');
      setUploadTitle('');
      setUploadType('notes');
      setUploadSubject('');
      setUploadTopic('');
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

  const toggleTopic = (key) => {
    setExpandedTopics((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const groupMaterialsByTopic = () => {
    const groups = {};
    materials.forEach((m) => {
      const key = m.topic?._id || 'uncategorized';
      const title = m.topic?.title || 'Uncategorized';
      if (!groups[key]) groups[key] = { title, items: [] };
      groups[key].items.push(m);
    });
    const entries = Object.entries(groups);
    entries.sort((a, b) => (a[0] === 'uncategorized' ? 1 : b[0] === 'uncategorized' ? -1 : 0));
    return entries;
  };

  const selectedSubjectName = subjects.find((s) => s._id === subjectFilter)?.name;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-container page-container-wide">
        <div className="page-header">
  <div className="page-header-icon">📖</div>
  <div>
    <h1 className="page-header-title">Study Materials</h1>
    <p className="page-header-subtitle">
      Access organized notes, papers, diagrams, and more for all your subjects.
    </p>
  </div>
</div>

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

            {(userRole === 'teacher' || userRole === 'admin') && (
              <form onSubmit={handleAddSubject} className="add-subject-form">
                <input
                  type="text"
                  className="input"
                  placeholder="New subject name"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                />
                <button type="submit" className="btn-outline" disabled={addingSubject}>
                  {addingSubject ? 'Adding...' : '+ Add Subject'}
                </button>
                {subjectMessage && <p className="subject-message">{subjectMessage}</p>}
              </form>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div className="materials-main-panel">

            {subjectFilter && selectedSubjectName && (
              <div className="subject-hero">
                <div className="subject-hero-icon">📘</div>
                <div>
                  <h2 className="subject-hero-title">{selectedSubjectName}</h2>
                  <p className="subject-hero-subtitle">
                    Access notes, papers, and study material for this subject.
                  </p>
                </div>
              </div>
            )}

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
            <div className="subject-shortcut-bar">
  <button
    className={`subject-shortcut ${subjectFilter === '' ? 'active' : ''}`}
    onClick={() => handleSubjectClick('')}
  >
    📚 All Subjects
  </button>
  {subjects.map((s) => (
    <button
      key={s._id}
      className={`subject-shortcut ${subjectFilter === s._id ? 'active' : ''}`}
      onClick={() => handleSubjectClick(s._id)}
    >
      {s.name}
    </button>
  ))}
</div>

            {loading && <p>Loading...</p>}
            {error && <p className="error-text">{error}</p>}
            {!loading && !error && materials.length === 0 && <p>No materials found.</p>}

            {!loading && !error && materials.length > 0 && (
              subjectFilter ? (
                <div className="topic-accordion">
                  {groupMaterialsByTopic().map(([key, group], index) => {
                    const isOpen =
                      expandedTopics[key] !== undefined ? expandedTopics[key] : index === 0;
                    return (
                      <div key={key} className="topic-section">
                        <button className="topic-section-header" onClick={() => toggleTopic(key)}>
                          <span>{group.title}</span>
                          <span className="topic-section-meta">
                            {group.items.length} resource{group.items.length !== 1 ? 's' : ''}
                            <span className={`topic-chevron ${isOpen ? 'open' : ''}`}>▾</span>
                          </span>
                        </button>
                        {isOpen && (
                          <div className="materials-grid">
                            {group.items.map((m) => (
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
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
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
              )
            )}

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
                    onChange={(e) => {
                      setUploadSubject(e.target.value);
                      setUploadTopic('');
                    }}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  {uploadSubject && (
                    <>
                      <select
                        className="input"
                        value={uploadTopic}
                        onChange={(e) => setUploadTopic(e.target.value)}
                      >
                        <option value="">No Topic / Unit (optional)</option>
                        {topics
                          .filter((t) => t.subject?._id === uploadSubject)
                          .map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.title}
                            </option>
                          ))}
                      </select>

                      <div className="add-topic-inline">
                        <input
                          type="text"
                          className="input"
                          placeholder="New unit/topic name"
                          value={newTopicTitle}
                          onChange={(e) => setNewTopicTitle(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-outline"
                          onClick={handleAddTopic}
                          disabled={addingTopic}
                        >
                          {addingTopic ? 'Adding...' : '+ Add'}
                        </button>
                      </div>
                      {topicMessage && <p className="subject-message">{topicMessage}</p>}
                    </>
                  )}

                  <input type="file" onChange={(e) => setUploadFile(e.target.files[0])} />
                  <button type="submit" className="btn" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </form>
                {uploadMessage && <p className="upload-message">{uploadMessage}</p>}
              </div>
            )}
          </div>
          {/* end materials-main-panel */}

          {/* RIGHT SIDEBAR: Quick Access */}
          <div className="materials-quick-access">
            <h3 className="quick-access-title">Quick Access</h3>
            {quickAccessOptions.map((opt) => (
              <button
                key={opt.value}
                className={`quick-access-item ${typeFilter === opt.value ? 'active' : ''}`}
                onClick={() => {
                  setTypeFilter(opt.value);
                  handleFilterChange();
                }}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
          {/* end materials-body */}
        </div>
      </div>
    </div>
  );
}

export default Materials;