import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Activity, BrainCircuit } from 'lucide-react';

const AddRecordModal = ({ isOpen, onClose, onSuccess, prefillData, tradeMode = 'ADD' }) => {
  const [ticker, setTicker] = useState('');
  const [assetType, setAssetType] = useState('STOCK');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [price, setPrice] = useState('');
  const [shares, setShares] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [emotion, setEmotion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isSell = tradeMode === 'SELL';
  const modalTitle = isSell ? 'Sell Asset' : 'New Trade (Buy)';
  const themeColor = isSell ? '#ef4444' : '#2563eb';
  const apiEndpoint = isSell ? '/api/portfolio/sell' : '/api/portfolio/add';

  useEffect(() => {
    if (isOpen) {
      setTicker(prefillData?.ticker || '');
      setAssetType(prefillData?.assetType || 'STOCK');
      setPrice(''); setShares(''); setTotalCost('');
      setEmotion(isSell ? 'Take Profit / Target Reached' : 'Rational / Undervalued');
    }
  }, [isOpen, prefillData, isSell]);

  if (!isOpen) return null;

  const handleSharesChange = (e) => { setShares(e.target.value); setTotalCost(''); };
  const handleTotalCostChange = (e) => { setTotalCost(e.target.value); setShares(''); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ticker) return alert('Please enter a ticker symbol!');
    if (!shares && !totalCost) return alert(isSell ? 'Please fill in sell quantity or total proceeds!' : 'Please fill in at least one: quantity or total cost!');

    const enableLossCooldown = localStorage.getItem('enableLossCooldown') === 'true';
    if (enableLossCooldown) {
      const cooldownUntil = localStorage.getItem('lossCooldownUntil');
      if (cooldownUntil && Date.now() < parseInt(cooldownUntil)) {
        const remainingHours = ((parseInt(cooldownUntil) - Date.now()) / (1000 * 60 * 60)).toFixed(1);

        const confirmCooldown = window.confirm(
          `Cooldown Warning\n\nA recent stop-loss has been triggered. You are still within a 24-hour trading cooldown (${remainingHours} hours remaining).\n\nEmotional trading after losses often leads to further mistakes. Are you sure you want to proceed?`
        );

        if (!confirmCooldown) return;
      }
    }

    const enableFomoAlert = localStorage.getItem('enableFomoAlert') !== 'false';
    if (!isSell && enableFomoAlert && emotion.includes('FOMO')) {
      const confirmFomo = window.confirm(
        `FOMO Alert\n\nYour current decision tag is "FOMO".\nWarren Buffett: "Be fearful when others are greedy." Chasing momentum is a common source of losses.\n\nHave you assessed the worst-case risk, and do you still want to buy?`
      );
      if (!confirmFomo) return;
    }

    setIsLoading(true);
    const payload = {
      ticker: ticker.toUpperCase(), assetType, date: date || null,
      price: price ? parseFloat(price) : null,
      shares: shares ? parseFloat(shares) : null,
      totalCost: totalCost ? parseFloat(totalCost) : null, currency, emotion
    };

    fetch(`http://127.0.0.1:8080${apiEndpoint}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    })
    .then(async (res) => {
      setIsLoading(false);
      if (res.ok) {
        if (isSell && emotion.includes('Stop Loss') && enableLossCooldown) {
          const lockTime = Date.now() + 24 * 60 * 60 * 1000;
          localStorage.setItem('lossCooldownUntil', lockTime.toString());
          alert('Stop-loss executed.\n\nA 24-hour trading cooldown has been activated. You will receive extra risk warnings during this period.');
        }
        onSuccess();
        onClose();
      }
      else { alert(`Failed: ${await res.text()}`); }
    })
    .catch(err => { setIsLoading(false); alert('Network request failed'); });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '550px', maxWidth: '90%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
        <div style={{ backgroundColor: '#f8fafc', padding: '20px 25px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={22} color={themeColor} /> {modalTitle}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#64748b" /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '25px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Ticker *</label>
              <input type="text" value={ticker} onChange={e => setTicker(e.target.value)} required disabled={isSell} placeholder="e.g. AAPL.US" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', textTransform: 'uppercase', backgroundColor: isSell ? '#f1f5f9' : 'white' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Asset Type *</label>
              <select value={assetType} onChange={e => setAssetType(e.target.value)} disabled={isSell} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', backgroundColor: isSell ? '#f1f5f9' : 'white' }}>
                <option value="STOCK">Stocks</option>
                <option value="CRYPTO">Crypto</option>
                <option value="FOREX">Forex</option>
                <option value="COMMODITIES">Commodities</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}><Calendar size={16}/> Trade Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}><DollarSign size={16}/> Execution Price (Optional)</label>
              <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="Leave blank to use closing price" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 'bold' }}>Trade Size (fill one) *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <input type="number" value={shares} onChange={handleSharesChange} placeholder={isSell ? "Sell Qty" : "Buy Qty"} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', opacity: totalCost ? 0.5 : 1 }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', width: '80px' }}>
                  <option value="USD">USD</option>
                  <option value="CNY">CNY</option>
                  <option value="HKD">HKD</option>
                </select>
                <input type="number" step="0.01" value={totalCost} onChange={handleTotalCostChange} placeholder={isSell ? "Total Proceeds" : "Total Cost"} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', opacity: shares ? 0.5 : 1 }} />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: themeColor }}><BrainCircuit size={18}/> Decision Tag *</label>
            <select value={emotion} onChange={e => setEmotion(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `2px solid ${isSell ? '#fca5a5' : '#ddd6fe'}`, boxSizing: 'border-box', backgroundColor: isSell ? '#fef2f2' : '#f5f3ff', color: isSell ? '#991b1b' : '#4c1d95', fontWeight: 'bold', fontSize: '15px' }}>
              {isSell ? (
                <>
                  <option value="Take Profit / Target Reached">Take Profit / Target Reached</option>
                  <option value="Stop Loss / Thesis Broken">Stop Loss / Thesis Broken</option>
                  <option value="Panic Sell / Risk Off">Panic Sell / Risk Off</option>
                  <option value="Impulsive Sell / Impatient">Impulsive Sell / Impatient</option>
                </>
              ) : (
                <>
                  <option value="Rational / Undervalued">Rational / Undervalued</option>
                  <option value="FOMO / Chasing">FOMO / Chasing</option>
                  <option value="Panic Buy / Averaging Down">Panic Buy / Averaging Down</option>
                  <option value="Impulsive / Pure Instinct">Impulsive / Pure Instinct</option>
                </>
              )}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#e2e8f0', color: '#475569', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: isLoading ? '#94a3b8' : themeColor, color: 'white', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
              {isLoading ? 'Processing...' : (isSell ? 'Confirm Sale' : 'Save Trade')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRecordModal;
