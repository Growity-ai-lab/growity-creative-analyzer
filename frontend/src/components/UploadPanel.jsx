import { useState, useRef, useEffect } from 'react'
import ResultCard from './ResultCard.jsx'

const MODAL_API = import.meta.env.VITE_MODAL_API_URL

export default function UploadPanel({ onComplete, analyses }) {
  const [file, setFile]         = useState(null)
  const [preview, setPreview]   = useState(null)
  const [name, setName]         = useState('')
  const [client, setClient]     = useState('')
  const [notes, setNotes]       = useState('')
  const [status, setStatus]     = useState('idle')
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
  const [drag, setDrag]         = useState(false)
  const [elapsed, setElapsed]   = useState(0)
  const [jobId, setJobId]       = useState(null)
  const inputRef = useRef()
  const pollRef  = useRef()
  const timerRef = useRef()

  useEffect(() => {
    if (!jobId) return
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${MODAL_API}/analyze/status/${jobId}`)
        const data = await res.json()
        if (data.status === 'success') {
          clearInterval(pollRef.current); clearInterval(timerRef.current)
          setResult(data); setStatus('done'); onComplete()
        } else if (data.status === 'failed') {
          clearInterval(pollRef.current); clearInterval(timerRef.current)
          setError(data.error_message || 'Analiz başarısız'); setStatus('error')
        }
      } catch (_) {}
    }, 8000)
    return () => { clearInterval(pollRef.current); clearInterval(timerRef.current) }
  }, [jobId])

  const handleFile = (f) => {
    if (!f) return
    setFile(f); setResult(null); setError('')
    if (f.type.startsWith('image/') || f.type.startsWith('video/'))
      setPreview(URL.createObjectURL(f))
    else setPreview(null)
  }

  const analyze = async () => {
    if (!file || !name) return
    setStatus('uploading'); setError(''); setElapsed(0)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('creative_name', name)
    fd.append('client_name', client)
    fd.append('notes', notes)
    try {
      const res = await fetch(`${MODAL_API}/analyze/start`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error(`Sunucu hatası: ${res.status}`)
      const data = await res.json()
      setJobId(data.job_id); setStatus('analyzing')
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } catch (e) { setError(e.message); setStatus('error') }
  }

  const reset = () => {
    clearInterval(pollRef.current); clearInterval(timerRef.current)
    setFile(null); setPreview(null); setResult(null)
    setStatus('idle'); setError(''); setName(''); setClient('')
    setNotes(''); setJobId(null); setElapsed(0)
  }

  const fmtTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`
  const busy = ['uploading','analyzing'].includes(status)

  return (
    <div style={s.wrap}>
      <div style={s.left}>
        <div
          style={{ ...s.dropzone, ...(drag ? s.dropActive : {}), ...(file ? s.dropFilled : {}) }}
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]) }}
          onClick={() => !file && inputRef.current.click()}
        >
          <input ref={inputRef} type="file"
            accept="image/*,video/mp4,video/mov,audio/mp3,audio/wav"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])}
          />
          {preview ? (
            file?.type.startsWith('video')
              ? <video src={preview} style={s.media} controls onClick={e => e.stopPropagation()} />
              : <img src={preview} style={s.media} alt="" />
          ) : (
            <div style={s.dropInner}>
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="var(--ink3)" strokeWidth="1.2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              <div style={s.dropText}>Sürükle veya tıkla</div>
              <div style={s.dropSub}>JPG · PNG · MP4 · MOV · MP3 · WAV</div>
            </div>
          )}
        </div>

        {file && (
          <div style={s.filePill}>
            <span style={s.fileDot} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
            <button style={s.fileRemove} onClick={reset}>✕</button>
          </div>
        )}

        {analyses.length > 0 && (
          <div style={s.recentBox}>
            <div style={s.recentTitle}>Son analizler</div>
            {analyses.slice(0,3).map(a => (
              <div key={a.id} style={s.recentRow}>
                <span style={s.recentName}>{a.creative_name}</span>
                <span style={{ ...s.recentScore, color: scoreColor(a.roi_scores?.attention_score) }}>
                  {a.roi_scores?.attention_score ?? '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={s.right}>
        <div style={s.form}>
          <Field label="Kreatif adı *" value={name} onChange={setName} placeholder="örn. Yaz 2026 Hero Video" />
          <Field label="Müşteri" value={client} onChange={setClient} placeholder="örn. Uludağ İçecek" />
          <Field label="Notlar" value={notes} onChange={setNotes} placeholder="Hedef kitle, kampanya amacı..." multi />
          <div style={s.noteHint}>Not: Notlar veritabanına kaydedilir, model inference'ı etkilemez.</div>
        </div>

        <button style={{ ...s.btn, ...(busy || !file || !name ? s.btnDisabled : {}) }}
          onClick={analyze} disabled={busy || !file || !name}>
          {status === 'uploading' && <><Spinner /> Yükleniyor...</>}
          {status === 'analyzing' && <><Spinner /> Analiz ediliyor &nbsp;<span style={s.timer}>{fmtTime(elapsed)}</span></>}
          {!busy && 'Analiz Et →'}
        </button>

        {status === 'analyzing' && (
          <div style={s.progressBox}>
            <div style={s.progressBar}>
              <div style={{ ...s.progressFill, animation: 'progressAnim 12s ease-in-out infinite' }} />
            </div>
            <div style={s.progressText}>
              Model beyin yanıtını hesaplıyor. Ortalama süre 8–12 dakika.
            </div>
          </div>
        )}

        {error && <div style={s.errorBox}>{error}</div>}

        {result && status === 'done' && (
          <ResultCard result={result} creative={name} client={client} />
        )}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, multi }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink2)', letterSpacing: '.05em', textTransform: 'uppercase' }}>{label}</label>
      {multi
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={{ ...fStyle, height: 68, resize: 'vertical' }} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={fStyle} />
      }
    </div>
  )
}

function Spinner() {
  return <span style={{
    display: 'inline-block', width: 13, height: 13,
    border: '1.5px solid rgba(255,255,255,.3)', borderTopColor: '#fff',
    borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: 8,
  }} />
}

function scoreColor(score) {
  if (!score) return 'var(--ink3)'
  if (score >= 60) return 'var(--green)'
  if (score >= 35) return 'var(--amber)'
  return 'var(--red)'
}

const fStyle = {
  background: '#fff', border: '1px solid var(--border)',
  borderRadius: 'var(--r)', padding: '9px 12px',
  color: 'var(--ink)', fontSize: 13, outline: 'none',
}

const s = {
  wrap: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' },
  left: { display: 'flex', flexDirection: 'column', gap: 12 },
  right: { display: 'flex', flexDirection: 'column', gap: 16 },

  dropzone: {
    border: '1.5px dashed var(--border2)', borderRadius: 8,
    minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', background: '#fff', overflow: 'hidden', transition: 'border-color .15s',
  },
  dropActive: { borderColor: 'var(--ink)', background: 'var(--bg)' },
  dropFilled: { cursor: 'default', border: '1px solid var(--border)' },
  dropInner: { textAlign: 'center', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  dropText: { fontSize: 14, fontWeight: 500, color: 'var(--ink2)' },
  dropSub: { fontSize: 12, color: 'var(--ink3)' },
  media: { width: '100%', height: 240, objectFit: 'cover', display: 'block' },

  filePill: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r)',
    padding: '7px 12px', fontSize: 12, color: 'var(--ink2)',
  },
  fileDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 },
  fileRemove: { background: 'none', border: 'none', color: 'var(--ink3)', fontSize: 12, padding: '0 2px', marginLeft: 'auto' },

  recentBox: {
    background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 14,
  },
  recentTitle: { fontSize: 11, fontWeight: 500, color: 'var(--ink3)', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 10 },
  recentRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--border)' },
  recentName: { fontSize: 12, color: 'var(--ink2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 },
  recentScore: { fontSize: 13, fontWeight: 600, marginLeft: 12 },

  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  noteHint: { fontSize: 11, color: 'var(--ink3)', fontStyle: 'italic', marginTop: -6 },

  btn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--ink)', color: '#fff', border: 'none',
    borderRadius: 'var(--r)', padding: '12px 20px', fontSize: 14, fontWeight: 500,
    fontFamily: 'var(--body)', letterSpacing: '.01em', transition: 'opacity .15s',
  },
  btnDisabled: { opacity: .35 },
  timer: { fontVariantNumeric: 'tabular-nums', fontSize: 12, opacity: .7 },

  progressBox: { display: 'flex', flexDirection: 'column', gap: 8 },
  progressBar: { height: 2, background: 'var(--border)', borderRadius: 1, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'var(--ink)', width: '60%', borderRadius: 1 },
  progressText: { fontSize: 12, color: 'var(--ink3)' },

  errorBox: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 'var(--r)', padding: '10px 14px', color: '#c0392b', fontSize: 13,
  },
}
