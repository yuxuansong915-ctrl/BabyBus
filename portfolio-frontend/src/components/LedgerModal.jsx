import React, { useState, useEffect } from 'react';

const LedgerModal = ({ onClose }) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8080/api/portfolio/ledger')
      .then(res => res.json())
      .then(data => {
        const sortedData = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setTransactions(sortedData);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch ledger:", err);
        setIsLoading(false);
      });
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '800px', maxWidth: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ecf0f1', paddingBottom: '15px', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>Transaction Ledger</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#7f8c8d' }}
          >
            x
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: '1' }}>
          {isLoading ? (
            <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '40px 0' }}>Loading records...</p>
          ) : transactions.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '40px 0' }}>No transaction records.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <tr style={{ color: '#34495e' }}>
                  <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Date</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Ticker</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Action</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Shares</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #ecf0f1' }}>
                    <td style={{ padding: '12px', color: '#7f8c8d', fontSize: '14px' }}>
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{tx.ticker}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: tx.actionType === 'BUY' ? '#e8f8f5' : '#fdedec',
                        color: tx.actionType === 'BUY' ? '#27ae60' : '#e74c3c'
                      }}>
                        {tx.actionType}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{tx.shares}</td>
                    <td style={{ padding: '12px' }}>${tx.price?.toFixed(2) || '0.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
};

export default LedgerModal;
