import { useState } from 'react';

function AISolver() {
  const [question, setQuestion] = useState('');
  const [marks, setMarks] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Question:', question);
    console.log('Marks:', marks);
  };

  return (
    <div>
      <h2>AI Solver</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Question: </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            cols={40}
          />
        </div>
        <div>
          <label>Marks: </label>
          <input
            type="number"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
          />
        </div>
        <button type="submit">Get Answer</button>
      </form>
    </div>
  );
}

export default AISolver;