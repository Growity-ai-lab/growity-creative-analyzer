import { useState, useRef, useEffect } from 'react'
import ResultCard from './ResultCard.jsx'

const MODAL_API = import.meta.env.VITE_MODAL_API_URL

const FORMATS = [
  { id: 'feed_image',   label: 'Feed Görseli',    sub: 'Instagram / Facebook / LinkedIn statik post', icon: '▣' },
  { id: 'story_reels',  label: 'Story / Reels',   sub: '6–15 sn dikey format',                        icon: '▮' },
  { id: 'feed_video',   label: 'Feed Video',      sub: '15–60 sn yatay veya kare',                    icon: '▶' },
  { id: 'tvc',          label: 'TVC',             sub: '20–30 sn televizyon reklamı',                  icon: '◫' },
  { id: 'bumper',       label: 'Bumper / Pre-roll','sub': '6 sn atlanamaz format',                     icon: '◈' },
  { id: 'ooh',          label: 'OOH / Dijital',   sub: 'Açıkhava veya dijital banner',                icon: '◱' },
]

const FORMAT_CONTEXT = {
  feed_image:  { priority: ['visual_cortex','ventral_visual','language'], note: 'Feed görsellerinde ilk 0.3 saniyedeki görsel çekim ve duygusal bağ belirleyici.' },
  story_reels: { priority: ['dorsal_visual','visual_cortex','auditory'],  note: 'Dikey formatta dinamizm ve ses kritik — ilk kare her şey.' },
  feed_video:  { priority: ['dorsal_visual','ventral_visual','language'],  note: 'Sessiz izlenme oranı yüksek, görsel anlatı ses olmadan da çalışmalı.' },
  tvc:         { priority: ['ventral_visual','auditory','prefrontal'],     note: 'TVC\'de duygusal bağ ve ses bütünlüğü, ardından net CTA.' },
  bumper:      { priority: ['visual_cortex','language','prefrontal'],      note: '6 saniyede tek mesaj — görsel etki ve slogan netliği öncelikli.' },
  ooh:         { priority: ['visual_cortex','language'],                   note: 'OOH\'da yalnızca görsel etki ve mesaj netliği geçerli, ses analizi anlamsız.' },
}

// Validation kuralları
function validateFile(file) {
  const warnings = []
  const errors   = []

  // Format kontrolü
  const allowed = ['image/jpeg','image/png','image/webp','video/mp4','video/quicktime','audio/mpeg','audio/wav']
  if (!allowed.includes(file.type)) {
    errors.push(`Desteklenmeyen format: ${file.type}. JPG, PNG, MP4, MOV, MP3 veya WAV yükleyin.`)
    return { ok: false, warnings, errors }
  }

  // Boyut kontrolü (görsel için)
  const sizeMB = file.size / 1024 / 1024
  if (sizeMB < 0.05) {
    errors.push('Dosya çok küçük — muhtemelen ekran görüntüsü veya sıkıştırılmış dosya. Orijinal export dosyasını yükleyin.')
    return { ok: false, warnings, errors }
  }
  if (sizeMB > 500) {
    errors.push('Dosya 500MB limitini aşıyor.')
    return { ok: false, warnings, errors }
  }

  // Ekran görüntüsü tespiti (dosya adı bazlı)
  const name = file.name.toLowerCase()
  const screenshotPatterns = ['screenshot','ekran','whatsapp','screen shot','img-','img_','capture']
  if (screenshotPatterns.some(p => name.includes(p))) {
    warnings.push('Dosya adı ekran görüntüsü olduğunu gösteriyor. Orijinal kreatif dosyasını yüklemek daha güvenilir sonuç verir.')
  }

  // Küçük dosya uyarısı (görsel için)
  if (file.type.startsWith('image/') && sizeMB < 0.3) {
    warnings.push('Görsel dosyası küçük — sıkıştırılmış olabilir. Mümkünse orijinal export dosyasını (min. 1080px) yükleyin.')
  }

  return { ok: true, warnings, errors }
}

function fmtTime(s) {
  return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`
}

export default function UploadPanel({ onComplete, analyses }) {
  const [file, setFile]         = useState(null)
  const [preview, setPreview]   = useState(null)
  const [name, setName]         = useState('')
  const [client, setClient]     = useState('')
  const [notes, setNotes]       = useState('')
  const [format, setFormat]     = useState(null)
  const [status, setStatus]     = useState('idle')
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
  const [warnings, setWarnings] = useState([])
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
    const validation = validateFile(f)
    if (!validation.ok) {
      setError(validation.errors[0])
      setWarnings([])
      return
    }
    setFile(f); setResult(null); setError('')
    setWarnings(validation.warnings)
    if (f.type.startsWith('image/') || f.type.startsWith('video/'))
      setPreview(URL.createObjectURL(f))
    else setPreview(null)
  }

  const analyze = async () => {
    if (!file || !name || !format) return
    setStatus('uploading'); setError(''); setElapsed(0)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('creative_name', name)
    fd.append('client_name', client)
    fd.append('notes', notes)
    fd.append('format', format)
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
    setStatus('idle'); setError(''); setWarnings([])
    setName(''); setClient(''); setNotes('')
    setFormat(null); setJobId(null); setElapsed(0)
  }

  const busy    = ['uploading','analyzing'].includes(status)
  const canSend = file && name && format && !busy

  return (
    <div style={s.wrap}>
      <div style={s.left}>
        {/* Drop zone */}
        <div
          style={{ ...s.dropzone, ...(drag ? s.dropActive : {}), ...(file ? s.dropFilled : {}) }}
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]) }}
          onClick={() => !file && inputRef.current.click()}
        >
          <input ref={inputRef} type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,audio/mpeg,audio/wav"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])}
          />
          {preview ? (
            file?.type.startsWith('video')
              ? <video src={preview} style={s.media} controls onClick={e => e.stopPropagation()} />
              : <img src={preview} style={s.media} alt="" />
          ) : (
            <div style={s.dropInner}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="var(--ink3)" strokeWidth="1.2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              <div style={s.dropText}>Orijinal kreatif dosyasını sürükle</div>
              <div style={s.dropSub}>JPG · PNG · MP4 · MOV · MP3 · WAV</div>
              <div style={s.dropHint}>Ekran görüntüsü değil, export dosyası</div>
            </div>
          )}
        </div>

        {/* Validation */}
        {error && !file && (
          <div style={s.errorBox}>
            <span style={s.errorIcon}>✕</span> {error}
          </div>
        )}
        {warnings.map((w, i) => (
          <div key={i} style={s.warnBox}>
            <span style={s.warnIcon}>!</span> {w}
          </div>
        ))}

        {file && (
          <div style={s.filePill}>
            <span style={s.fileDot} />
            <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12 }}>{file.name}</span>
            <span style={{ fontSize:11, color:'var(--ink3)', marginLeft:4 }}>
              {(file.size/1024/1024).toFixed(1)} MB
            </span>
            <button style={s.fileRemove} onClick={reset}>✕</button>
          </div>
        )}

        {/* Son analizler */}
        {analyses.length > 0 && (
          <div style={s.recentBox}>
            <div style={s.recentTitle}>Son analizler</div>
            {analyses.slice(0,3).map(a => (
              <div key={a.id} style={s.recentRow}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.creative_name}</div>
                  <div style={{ fontSize:11, color:'var(--ink3)' }}>{a.client_name || '—'}</div>
                </div>
                <span style={{ fontSize:13, fontWeight:600, color: scoreColor(a.roi_scores?.attention_score), marginLeft:8 }}>
                  {a.roi_scores?.attention_score?.toFixed(1) ?? '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={s.right}>
        {/* Format seçimi */}
        <div style={s.fieldGroup}>
          <label style={s.label}>Kreatif formatı *</label>
          <div style={s.formatGrid}>
            {FORMATS.map(f => (
              <button key={f.id}
                style={{ ...s.formatBtn, ...(format === f.id ? s.formatActive : {}) }}
                onClick={() => setFormat(format === f.id ? null : f.id)}
              >
                <span style={s.formatIcon}>{f.icon}</span>
                <span style={s.formatLabel}>{f.label}</span>
                <span style={s.formatSub}>{f.sub}</span>
              </button>
            ))}
          </div>
          {format && (
            <div style={s.formatNote}>
              <span style={s.formatNoteIcon}>→</span>
              {FORMAT_CONTEXT[format].note}
            </div>
          )}
        </div>

        {/* Form alanları */}
        <div style={s.fieldGroup}>
          <label style={s.label}>Kreatif adı *</label>
          <input style={s.input} placeholder="örn. Yaz 2026 Hero Görseli"
            value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div style={s.fieldGroup}>
          <label style={s.label}>Müşteri</label>
          <input style={s.input} placeholder="örn. Uludağ İçecek"
            value={client} onChange={e => setClient(e.target.value)} />
        </div>
        <div style={s.fieldGroup}>
          <label style={s.label}>Notlar</label>
          <textarea style={{ ...s.input, height:60, resize:'vertical' }}
            placeholder="Hedef kitle, kampanya amacı..."
            value={notes} onChange={e => setNotes(e.target.value)} />
          <div style={s.noteHint}>Notlar veritabanına kaydedilir, model inference'ı etkilemez.</div>
        </div>

        <button style={{ ...s.btn, ...(!canSend ? s.btnDisabled : {}) }}
          onClick={analyze} disabled={!canSend}>
          {status === 'uploading' && <><Spinner /> Yükleniyor...</>}
          {status === 'analyzing' && <><Spinner /> Analiz ediliyor &nbsp;<span style={s.timer}>{fmtTime(elapsed)}</span></>}
          {!busy && (
            !file ? 'Önce dosya yükle'
            : !format ? 'Format seç'
            : !name ? 'Kreatif adı gir'
            : 'Analiz Et →'
          )}
        </button>

        {status === 'analyzing' && (
          <div style={s.progressBox}>
            <div style={s.progressBar}>
              <div style={s.progressFill} />
            </div>
            <div style={s.progressText}>
              Model beyin yanıtını hesaplıyor. Ortalama süre 8–12 dakika.
            </div>
          </div>
        )}

        {error && file && <div style={s.errorBox}><span style={s.errorIcon}>✕</span> {error}</div>}

        {result && status === 'done' && (
          <ResultCard result={result} creative={name} client={client} format={format} />
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return <span style={{
    display:'inline-block', width:13, height:13,
    border:'1.5px solid rgba(255,255,255,.3)', borderTopColor:'#fff',
    borderRadius:'50%', animation:'spin 1s linear infinite', marginRight:8,
  }} />
}

function scoreColor(v) {
  if (!v && v !== 0) return 'var(--ink3)'
  if (v >= 55) return '#2d7a4f'
  if (v >= 42) return '#d4780a'
  return '#c0392b'
}

const s = {
  wrap: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:40, alignItems:'start' },
  left: { display:'flex', flexDirection:'column', gap:12 },
  right: { display:'flex', flexDirection:'column', gap:16 },

  dropzone: {
    border:'1.5px dashed var(--border2)', borderRadius:8,
    minHeight:220, display:'flex', alignItems:'center', justifyContent:'center',
    cursor:'pointer', background:'#fff', overflow:'hidden', transition:'border-color .15s',
  },
  dropActive: { borderColor:'var(--ink)', background:'var(--bg)' },
  dropFilled: { cursor:'default', border:'1px solid var(--border)' },
  dropInner: { textAlign:'center', padding:28, display:'flex', flexDirection:'column', alignItems:'center', gap:8 },
  dropText: { fontSize:13, fontWeight:500, color:'var(--ink2)' },
  dropSub: { fontSize:11, color:'var(--ink3)' },
  dropHint: { fontSize:11, color:'var(--ink3)', fontStyle:'italic', marginTop:2 },
  media: { width:'100%', height:220, objectFit:'cover', display:'block' },

  errorBox: {
    display:'flex', alignItems:'flex-start', gap:8,
    background:'#fef2f2', border:'1px solid #fecaca',
    borderRadius:6, padding:'10px 12px', color:'#c0392b', fontSize:12, lineHeight:1.5,
  },
  errorIcon: { fontWeight:700, flexShrink:0, marginTop:1 },
  warnBox: {
    display:'flex', alignItems:'flex-start', gap:8,
    background:'#fffbeb', border:'1px solid #fde68a',
    borderRadius:6, padding:'10px 12px', color:'#92400e', fontSize:12, lineHeight:1.5,
  },
  warnIcon: { fontWeight:700, flexShrink:0, marginTop:1 },

  filePill: {
    display:'flex', alignItems:'center', gap:8,
    background:'#fff', border:'1px solid var(--border)', borderRadius:6,
    padding:'7px 12px', color:'var(--ink2)',
  },
  fileDot: { width:6, height:6, borderRadius:'50%', background:'#2d7a4f', flexShrink:0 },
  fileRemove: { background:'none', border:'none', color:'var(--ink3)', fontSize:12, padding:'0 2px', marginLeft:'auto' },

  recentBox: { background:'#fff', border:'1px solid var(--border)', borderRadius:6, padding:12 },
  recentTitle: { fontSize:10, fontWeight:600, color:'var(--ink3)', letterSpacing:'.05em', textTransform:'uppercase', marginBottom:8 },
  recentRow: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid var(--border)' },

  fieldGroup: { display:'flex', flexDirection:'column', gap:6 },
  label: { fontSize:11, fontWeight:600, color:'var(--ink2)', letterSpacing:'.04em', textTransform:'uppercase' },

  formatGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 },
  formatBtn: {
    display:'flex', flexDirection:'column', alignItems:'flex-start', gap:2,
    background:'#fff', border:'1px solid var(--border)', borderRadius:6,
    padding:'10px 12px', cursor:'pointer', transition:'all .12s', textAlign:'left',
  },
  formatActive: { borderColor:'var(--ink)', background:'var(--bg)' },
  formatIcon: { fontSize:14, color:'var(--ink2)', lineHeight:1 },
  formatLabel: { fontSize:12, fontWeight:600, color:'var(--ink)' },
  formatSub: { fontSize:10, color:'var(--ink3)', lineHeight:1.4 },
  formatNote: {
    display:'flex', gap:8, alignItems:'flex-start',
    background:'var(--bg)', border:'1px solid var(--border)',
    borderRadius:6, padding:'8px 12px', fontSize:11, color:'var(--ink2)', lineHeight:1.5,
  },
  formatNoteIcon: { fontWeight:700, color:'var(--ink)', flexShrink:0 },

  input: {
    background:'#fff', border:'1px solid var(--border)',
    borderRadius:6, padding:'9px 12px', color:'var(--ink)', fontSize:13, outline:'none',
  },
  noteHint: { fontSize:11, color:'var(--ink3)', fontStyle:'italic' },

  btn: {
    display:'flex', alignItems:'center', justifyContent:'center',
    background:'var(--ink)', color:'#fff', border:'none',
    borderRadius:6, padding:'12px 20px', fontSize:14, fontWeight:500,
    fontFamily:'var(--body)', transition:'opacity .15s',
  },
  btnDisabled: { opacity:.35 },
  timer: { fontVariantNumeric:'tabular-nums', fontSize:12, opacity:.7 },

  progressBox: { display:'flex', flexDirection:'column', gap:8 },
  progressBar: { height:2, background:'var(--border)', borderRadius:1, overflow:'hidden' },
  progressFill: { height:'100%', background:'var(--ink)', width:'60%', borderRadius:1, animation:'progressAnim 3s ease-in-out infinite' },
  progressText: { fontSize:12, color:'var(--ink3)' },
}
