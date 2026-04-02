import React, { useState } from 'react';

const AddAssetForm = ({ refreshData }) => {
  const [ticker, setTicker] = useState('');
  const [shares, setShares] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!ticker || !shares) return alert('Please enter ticker and quantity!');
    if (shares <= 0) return alert('Quantity must be greater than 0!');

    setIsLoading(true);

    fetch('http://localhost:8080/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker: ticker.toUpperCase(), shares: parseInt(shares) })
    })
    .then(async (res) => {
      setIsLoading(false);
      if (res.ok) {
        setTicker('');
        setShares('');
        refreshData();
      } else {
        const errorText = await res.text();
        alert(`Trade failed: ${errorText}`);
      }
    })
    .catch(err => {
      setIsLoading(false);
      console.error('Network error:', err);
      alert('Network error. Please check the backend service.');
    });
  };

  return (
    <div style={{ flex: '1', backgroundColor: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h2 style={{ borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginTop: 0 }}>Buy New Asset</h2>

      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontWeight: 'bold', color: '#34495e', display: 'block', marginBottom: '5px' }}>Ticker</label>
          <input
            type="text"
            value={ticker}
            onChange={e => setTicker(e.target.value)}
            placeholder="e.g. AAPL, TSLA"
            required
            style={{ width: '90%', padding: '10px', borderRadius: '5px', border: '1px solid #bdc3c7', fontSize: '16px', textTransform: 'uppercase' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold', color: '#34495e', display: 'block', marginBottom: '5px' }}>Shares</label>
          <input
            type="number"
            value={shares}
            onChange={e => setShares(e.target.value)}
            placeholder="Enter integer"
            min="1"
            required
            style={{ width: '90%', padding: '10px', borderRadius: '5px', border: '1px solid #bdc3c7', fontSize: '16px' }}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '95%',
            padding: '12px',
            backgroundColor: isLoading ? '#95a5a6' : '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
            transition: 'background-color 0.3s'
          }}
        >
          {isLoading ? 'Processing...' : 'Confirm Buy'}
        </button>
      </form>
    </div>
  );
};

export default AddAssetForm;
