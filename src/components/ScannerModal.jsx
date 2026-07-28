import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Tesseract from 'tesseract.js';
import { lookupBarcode } from '../utils/openFoodFacts';
import { parseLabelText } from '../utils/parseLabel';
import FoodDefinitionModal from './FoodDefinitionModal';

const READER_ID = 'barcode-reader-region';

export default function ScannerModal({ onResult, onClose }) {
  const [mode, setMode] = useState(null); // 'label' | 'barcode' | null
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // parsed food, shown in shared result step
  const fileInputRef = useRef(null);
  const qrRef = useRef(null);

  // --- Barcode mode -------------------------------------------------------
  useEffect(() => {
    if (mode !== 'barcode') return;
    const scanner = new Html5Qrcode(READER_ID);
    qrRef.current = scanner;
    setStatus('Point the camera at a barcode…');

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        async (decodedText) => {
          setStatus('Looking up product…');
          try {
            await scanner.stop();
          } catch { /* already stopped */ }
          try {
            const food = await lookupBarcode(decodedText);
            if (!food) {
              setError('No product found for that barcode. Try Nutrition Label mode instead.');
              setMode(null);
            } else {
              setResult(food);
            }
          } catch (e) {
            setError(e.message || 'Lookup failed.');
            setMode(null);
          }
        },
        () => {} // per-frame decode errors, ignored
      )
      .catch((e) => {
        setError('Camera unavailable: ' + (e?.message || e));
        setMode(null);
      });

    return () => {
      if (qrRef.current) {
        qrRef.current.stop().catch(() => {});
      }
    };
  }, [mode]);

  // --- Label mode ----------------------------------------------------------
  const handleImage = async (file) => {
    if (!file) return;
    setStatus('Reading label… this can take a few seconds');
    setError('');
    try {
      const { data } = await Tesseract.recognize(file, 'eng');
      const parsed = parseLabelText(data.text);
      setResult({ name: '', ...parsed, source: 'label' });
    } catch {
      setError('Could not read the label. Try a clearer, well-lit photo.');
    } finally {
      setStatus('');
    }
  };

  if (result) {
    return (
      <FoodDefinitionModal
        title="Confirm scanned nutrition"
        initial={result}
        onSave={(food) => onResult(food)}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: 4 }}>Add food via camera</h3>
        <p className="page-sub" style={{ marginBottom: 14 }}>Scan a nutrition label or a barcode.</p>

        {!mode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-primary btn-block" onClick={() => setMode('label')}>
              📷 Scan nutrition label
            </button>
            <button className="btn btn-secondary btn-block" onClick={() => setMode('barcode')}>
              ▮▮▮ Scan barcode
            </button>
            <button className="btn btn-outline btn-block" onClick={onClose}>Cancel</button>
          </div>
        )}

        {mode === 'label' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => fileInputRef.current?.click()}
              >
                Take / upload photo
              </button>
              <button className="btn btn-outline" onClick={() => { setMode(null); setError(''); }}>Back</button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => handleImage(e.target.files?.[0])}
            />
            {status && <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>{status}</p>}
          </div>
        )}

        {mode === 'barcode' && (
          <div>
            <div id={READER_ID} style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 10 }} />
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: 10 }}>{status}</p>
            <button className="btn btn-outline btn-block" onClick={() => setMode(null)}>Back</button>
          </div>
        )}

        {error && <p style={{ color: 'var(--brick)', fontSize: '0.85rem', marginTop: 10 }}>{error}</p>}
      </div>
    </div>
  );
}
