import React, { useState, useEffect } from 'react';

const PuzzleModal = ({ onResolve }) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (parseInt(answer) === num1 + num2) {
      onResolve();
    } else {
      setError('Incorrect answer. Try again!');
      setAnswer('');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>You seem distracted!</h2>
        <p>Please solve this math puzzle to resume your session:</p>

        <div style={{ fontSize: '1.5rem', margin: '1.5rem 0', fontWeight: 'bold' }}>
          {num1} + {num2} = ?
        </div>

        {error && <p style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Your answer"
            autoFocus
            style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #cbd5e1',
              width: '100px',
              textAlign: 'center',
              fontSize: '1.125rem',
              marginBottom: '1rem'
            }}
          />
          <button type="submit" className="primary-button">Submit & Resume</button>
        </form>
      </div>
    </div>
  );
};

export default PuzzleModal;
