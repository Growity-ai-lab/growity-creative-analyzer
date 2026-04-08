import { useState, useRef, useEffect } from 'react'

const MODAL_API = import.meta.env.VITE_MODAL_API_URL

const ROI_LABELS = {
  visual_cortex:   'Görsel Korteks',
  ventral_visual:  'Ventral Görsel',
  dorsal_visual:   'Dorsal Görsel',
  prefrontal:      'Prefrontal',
  auditory:        'İşitsel',
  language:        'Dil',
}

const ROI_COLORS = {
  visual_cortex:  '#6c63ff',
  ventral_visual: '#ff6584',
  dorsal_visual:  '#43e97b',
  prefrontal:     '#f7971e',
  auditory:       '#4facfe',
  language:       '#a18cd1',
}

export default function UploadPanel({ onComplete }) {
  const [file, setFile]               = useState(null)
  const [preview, setPreview]         = useState(null)
  const [creativeName, setCreativeName] = useState('')
  const [clientName, setClientName]   = useState('')
  const [notes, setNotes]             = useState('')
  const [status, setStatus]           = useState('idle')
  const [result, setResult]           = useState(null)
  const [error, setError]             = useState('')
  const [drag, setDrag]               = useState(false)
  const [elapsed, setElapsed]         = useState(0)
  const [jobId, setJobId]             = useState(null)
  const inputRef  = useRef()
  const pollRef   = useRef()
  const timerRef  = useRef()

  // Polling
  useEffect(() => {
    if (!jobId) return
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${MODAL_API}/analyze/status/${jobId}`)
        const data = await res.json()
        if (data.status === 'success') {
          clearInterval(pollRef.current)
          clearInterval(timerRef.current)
          setResult(data)
          setStatus('done')
          onComplete(data)
        } else if (data.status === 'failed') {
          clearInterval(pollRef.current)
          clearInterval(timerRef.current)
          setError(data.error_message || 'Analiz başarısız')
          setStatus('error')
        }
        // pending / running → devam et
      } catch (e) {
        // ağ hatası → polling devam etsin
      }
    }, 8000) // 8 saniyede bir kontrol

    return () => {
      clearInterval(pollRef.current)
      clearInterval(timerRef.current)
    }
  }, [jobId])

  const handleFile = (f) => {
    if (!f) return
    setFile(f); setResult(null); setError('')
    if (f.type.startsWith('image/') || f.type.startsWith('video/'))
      setPreview(URL.createObjectURL(f))
    else setPreview(null)
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false)
    handleFile(e.dataTransfer.files[0])
  }

  const analyze = async () => {
    if (!file || !creativeName) return
    setStatus('uploading'); setError(''); setElapsed(0)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('creative_name', creativeName)
    fd.append('client_name', clientName)
    fd.append('notes', notes)

    try {
      const res = await fetch(`${MODAL_API}/analyze/start`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error(`API hatası: ${res.status}`)
      const data = await res.json()
      setJobId(data.job_id)
      setStatus('analyzing')

      // Elapsed sayacı
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } catch (e) {
      setError(e.message); setStatus('error')
    }
  }

  const reset = () => {
    clearInterval(pollRef.current); clearInterval(timerRef.current)
    setFile(null); setPreview(null); setResult(null)
    setStatus('idle'); setError(''); setCreativeName('')
    setClientName(''); setNotes(''); setJobId(null); setElapsed(0)
  }

  const fmtElapsed = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

  return (
    <div style={styles.wrap}>
      <div style={styles.left}>
        <div
          style={{ ...styles.dropzone, ...(drag ? styles.dropzoneActive : {}) }}
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
        >
          <input ref={inputRef} type="file"
            accept="image/*,video/mp4,video/mov,audio/mp3,audio/wav"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])}
          />
          {preview ? (
            file?.type.startsWith('video') ? (
              <video src={preview} style={styles.previewMedia} controls />
            ) : (
              <img src={preview} alt="preview" style={styles.previewMedia} />
            )
          ) : (
            <div style={styles.dropPlaceholder}>
              <div style={styles.dropIcon}>↑</div>
              <div style={styles.dropText}>Görsel, video veya ses sürükle</div>
              <div style={styles.dropSub}>JPG · PNG · MP4 · MOV · MP3 · WAV</div>
            </div>
          )}
        </div>
        {file && (
          <div style={styles.fileName}>
            <span style={styles.fileNameDot} />
            {file.name}
            <button style={styles.clearBtn} onClick={reset}>✕</button>
          </div>
        )}
      </div>

      <div style={styles.right}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Kreatif Adı *</label>
          <input style={styles.input} placeholder="örn. Yaz Kampanyası Hero Görseli"
            value={creativeName} onChange={e => setCreativeName(e.target.value)} />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Müşteri</label>
          <input style={styles.input} placeholder="örn. Uludağ İçecek"
            value={clientName} onChange={e => setClientName(e.target.value)} />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Notlar</label>
          <textarea style={{ ...styles.input, height: 72, resize: 'vertical' }}
            placeholder="Hedef kitle, kampanya amacı..."
            value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <button
          style={{
            ...styles.analyzeBtn,
            ...(!file || !creativeName || ['uploading','analyzing'].includes(status)
              ? styles.analyzeBtnDisabled : {})
          }}
          onClick={analyze}
          disabled={!file || !creativeName || ['uploading','analyzing'].includes(status)}
        >
          {status === 'uploading' && (
            <span style={styles.analyzingText}><span style={styles.spinner} /> Yükleniyor...</span>
          )}
          {status === 'analyzing' && (
            <span style={styles.analyzingText}>
              <span style={styles.spinner} /> Analiz ediliyor... {fmtElapsed(elapsed)}
            </span>
          )}
          {!['uploading','analyzing'].includes(status) && 'Analiz Et'}
        </button>

        {status === 'analyzing' && (
          <div style={styles.infoBox}>
            Model beyin yanıtını hesaplıyor. Bu işlem 8-12 dakika sürebilir,
            sayfayı kapatma — arka planda devam eder.
          </div>
        )}

        {error && <div style={styles.errorBox}>{error}</div>}

        {result && status === 'done' && (
          <div style={styles.resultBox}>
            <div style={styles.resultHeader}>
              <span style={styles.resultTitle}>Analiz Sonucu</span>
              <span style={styles.attentionScore}>
                Dikkat: {result.roi_scores?.attention_score ?? '—'}
              </span>
            </div>
            <div style={styles.roiGrid}>
              {Object.entries(ROI_LABELS).map(([key, label]) => {
                const val = result.roi_scores?.[key] ?? 0
                return (
                  <div key={key} style={styles.roiRow}>
                    <div style={styles.roiLabel}>{label}</div>
                    <div style={styles.roiBar}>
                      <div style={{
                        ...styles.roiFill,
                        width: `${Math.min(100, val)}%`,
                        background: ROI_COLORS[key],
                      }} />
                    </div>
                    <div style={styles.roiVal}>{val}</div>
                  </div>
                )
              })}
            </div>
            <div style={styles.resultMeta}>
              İşlem süresi: {result.processing_seconds}s &nbsp;·&nbsp;
              {result.n_timesteps} zaman adımı
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  wrap: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' },
  left: { display: 'flex', flexDirection: 'column', gap: 12 },
  right: { display: 'flex', flexDirection: 'column', gap: 16 },
  dropzone: {
    border: '2px dashed var(--border)', borderRadius: 16,
    minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'border-color .2s, background .2s',
    background: 'var(--surface)', overflow: 'hidden',
  },
  dropzoneActive: { borderColor: 'var(--accent)', background: 'var(--surface2)' },
  dropPlaceholder: { textAlign: 'center', padding: 32 },
  dropIcon: { fontSize: 32, marginBottom: 12, color: 'var(--muted)' },
  dropText: { fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 15 },
  dropSub: { color: 'var(--muted)', fontSize: 12, marginTop: 6 },
  previewMedia: { width: '100%', height: 260, objectFit: 'cover', display: 'block' },
  fileName: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--surface2)', borderRadius: 8, padding: '8px 14px',
    fontSize: 13, color: 'var(--muted)',
  },
  fileNameDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 },
  clearBtn: { marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, padding: '2px 6px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, color: 'var(--muted)', fontWeight: 500, letterSpacing: '.03em' },
  input: {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none',
  },
  analyzeBtn: {
    background: 'var(--accent)', color: '#fff', border: 'none',
    borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 600,
    fontFamily: 'var(--font-head)', letterSpacing: '.02em', transition: 'opacity .15s',
  },
  analyzeBtnDisabled: { opacity: .4 },
  analyzingText: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 },
  spinner: {
    display: 'inline-block', width: 14, height: 14,
    border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff',
    borderRadius: '50%', animation: 'spin 1s linear infinite',
  },
  infoBox: {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '10px 14px', color: 'var(--muted)', fontSize: 13, lineHeight: 1.6,
  },
  errorBox: {
    background: '#2a1010', border: '1px solid #7f1d1d',
    borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13,
  },
  resultBox: {
    background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20,
  },
  resultHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  resultTitle: { fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15 },
  attentionScore: { background: 'var(--accent)', color: '#fff', borderRadius: 20, fontSize: 12, padding: '3px 12px', fontWeight: 600 },
  roiGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
  roiRow: { display: 'grid', gridTemplateColumns: '120px 1fr 36px', alignItems: 'center', gap: 10 },
  roiLabel: { fontSize: 12, color: 'var(--muted)' },
  roiBar: { height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' },
  roiFill: { height: '100%', borderRadius: 3, transition: 'width 1s ease' },
  roiVal: { fontSize: 12, color: 'var(--text)', textAlign: 'right' },
  resultMeta: { fontSize: 11, color: 'var(--muted)', marginTop: 14, textAlign: 'right' },
}
