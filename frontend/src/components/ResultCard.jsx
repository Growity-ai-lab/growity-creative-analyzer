import { useRef, useEffect, useState } from 'react'

const ROI_LABELS = {
  visual_cortex:  'Görsel Korteks',
  ventral_visual: 'Ventral Görsel',
  dorsal_visual:  'Dorsal Görsel',
  prefrontal:     'Prefrontal',
  auditory:       'İşitsel',
  language:       'Dil',
}

const ROI_INSIGHTS = {
  visual_cortex:  {
    high: 'Temel görsel işleme güçlü — renk, kontrast ve kompozisyon etkili çalışıyor.',
    mid:  'Görsel korteks orta düzeyde aktive. Daha güçlü kontrast veya hareket bu skoru artırır.',
    low:  'Görsel korteks zayıf. Dinamik kamera hareketleri veya yüksek kontrast kompozisyon gerekli.',
  },
  ventral_visual: {
    high: 'Nesne/yüz tanıma güçlü — izleyici beyninin dikkat sistemi devrede.',
    mid:  'Ventral görsel orta. İnsan yüzü içeren sahneler bu skoru %30-50 artırır.',
    low:  'Yüz/nesne tanıma düşük. Videoya talent eklemek en etkili çözüm.',
  },
  dorsal_visual:  {
    high: 'Uzamsal hareket ve dinamizm güçlü şekilde işleniyor.',
    mid:  'Dorsal görsel orta. Pan, zoom veya tracking shot aktivasyonu artırır.',
    low:  'Hareket algısı zayıf — video büyük olasılıkla statik sahnelerden oluşuyor.',
  },
  prefrontal:     {
    high: 'Karar verme ve dikkat sistemi tam devrede.',
    mid:  'Prefrontal orta düzeyde. Net call-to-action bu skoru yükseltir.',
    low:  'Dikkat sistemi zayıf aktive. Merak uyandıran unsur veya sürpriz moment ekleyin.',
  },
  auditory:       {
    high: 'Ses/müzik elementi beyin tarafından güçlü işleniyor.',
    mid:  'İşitsel bölge orta. Voiceover veya müzik güçlendirilebilir.',
    low:  'İşitsel korteks düşük — model sesi taramış ancak güçlü sinyal bulamamış. Voiceover veya impactful müzik başlangıcı kritik.',
  },
  language:       {
    high: 'Dil işleme aktif — metin/slogan beyin tarafından güçlü algılanıyor.',
    mid:  'Dil bölgesi orta. Daha net slogan veya anlatı bu skoru artırır.',
    low:  'Dil bölgesi düşük — net mesaj veya voiceover eksik.',
  },
}

const ROI_REGIONS = {
  visual_cortex:  { cx:200, cy:248, rx:52, ry:26 },
  ventral_visual: { cx:155, cy:224, rx:36, ry:20 },
  dorsal_visual:  { cx:200, cy:108, rx:44, ry:24 },
  prefrontal:     { cx:200, cy:76,  rx:34, ry:18 },
  auditory:       { cx:118, cy:175, rx:32, ry:18 },
  language:       { cx:138, cy:140, rx:36, ry:20 },
}

const ROI_LABELS_R = {
  visual_cortex:  { cx:275, cy:175, rx:32, ry:18 },
}

function scoreLevel(v) {
  if (v >= 55) return 'high'
  if (v >= 42) return 'mid'
  return 'low'
}
function scoreColor(v) {
  if (!v && v !== 0) return '#aaa'
  if (v >= 55) return '#2d7a4f'
  if (v >= 42) return '#d4780a'
  return '#c0392b'
}
function scoreBg(v) {
  if (v >= 55) return '#2d7a4f'
  if (v >= 42) return '#e8a020'
  return '#e8593c'
}
function scoreAlpha(v) {
  return 0.5 + (Math.min(v, 70) / 70) * 0.45
}
function attLabel(v) {
  if (v >= 60) return { text: 'Güçlü', color: '#2d7a4f' }
  if (v >= 35) return { text: 'Orta', color: '#d4780a' }
  return { text: 'Zayıf', color: '#c0392b' }
}

function BrainMap({ scores, active, onSelect }) {
  const regions = Object.entries(ROI_REGIONS)

  return (
    <svg width="100%" viewBox="0 0 400 320" style={{ display: 'block' }}>
      <defs>
        <style>{`
          @keyframes bpulse { 0%,100%{opacity:.75} 50%{opacity:1} }
          @keyframes bripple { 0%{r:0;opacity:.5} 100%{r:24;opacity:0} }
          .breg { cursor:pointer; transition:all .2s; }
          .breg ellipse { transition: all .2s; }
          .breg:hover ellipse { opacity:1 !important; }
          .bpulse { animation: bpulse 2.5s ease-in-out infinite; }
          .bripple { animation: bripple 2.2s ease-out infinite; }
        `}</style>
      </defs>

      <ellipse cx="200" cy="168" rx="158" ry="132" fill="#f0ede8" stroke="#d0ccc5" strokeWidth="1"/>
      <path d="M200,48 C152,43 115,58 95,90 C75,118 70,148 76,172 C82,202 94,228 116,248 C138,268 168,278 200,278 C232,278 262,268 284,248 C306,228 318,202 324,172 C330,148 325,118 305,90 C285,58 248,43 200,48 Z"
        fill="#ede9e3" stroke="#c5c0b8" strokeWidth="1.5" fillOpacity=".55"/>

      <path d="M200,50 C200,50 196,68 196,85 C196,99 199,108 200,113 C201,108 204,99 204,85 C204,68 200,50 200,50 Z" fill="#ccc" stroke="none" opacity=".35"/>
      <path d="M128,78 C139,94 146,110 146,126" fill="none" stroke="#ccc" strokeWidth="1.2" opacity=".45"/>
      <path d="M272,78 C261,94 254,110 254,126" fill="none" stroke="#ccc" strokeWidth="1.2" opacity=".45"/>
      <path d="M88,162 C105,160 122,162 136,164" fill="none" stroke="#ccc" strokeWidth="1" opacity=".35"/>
      <path d="M312,162 C295,160 278,162 264,164" fill="none" stroke="#ccc" strokeWidth="1" opacity=".35"/>

      {regions.map(([key, reg]) => {
        const v = scores[key] ?? 0
        const isActive = active === key
        const col = scoreBg(v)
        const alpha = scoreAlpha(v)
        const delay = { visual_cortex:0, ventral_visual:.4, dorsal_visual:.2, prefrontal:.6, auditory:.8, language:1 }[key] || 0
        return (
          <g key={key} className="breg bpulse" style={{ animationDelay: `${delay}s` }}
            onClick={() => onSelect(key)}>
            {isActive && (
              <circle cx={reg.cx} cy={reg.cy} r="0" fill="none" stroke={col} strokeWidth="1.5"
                className="bripple" style={{ animationDelay: '.2s' }} />
            )}
            <ellipse cx={reg.cx} cy={reg.cy} rx={isActive ? reg.rx + 4 : reg.rx} ry={isActive ? reg.ry + 3 : reg.ry}
              fill={col} fillOpacity={isActive ? 0.95 : alpha}
              stroke={isActive ? col : 'none'} strokeWidth={isActive ? 2 : 0} />
            <text x={reg.cx} y={reg.cy + 4} textAnchor="middle"
              fontSize={isActive ? 10 : 9} fontFamily="system-ui,sans-serif"
              fontWeight={isActive ? '700' : '500'}
              fill={v >= 55 ? '#0d3320' : v >= 42 ? '#3a2000' : '#5a0d00'}
              style={{ pointerEvents: 'none' }}>
              {ROI_LABELS[key].split(' ')[0]}
            </text>
          </g>
        )
      })}

      {/* Sağ hemisfer işitsel mirror */}
      <g className="breg bpulse" style={{ animationDelay: '.8s' }} onClick={() => onSelect('auditory')}>
        <ellipse cx="282" cy="175" rx="32" ry="18"
          fill={scoreBg(scores.auditory ?? 0)}
          fillOpacity={scoreAlpha(scores.auditory ?? 0)} />
        <text x="282" y="179" textAnchor="middle" fontSize="9" fontFamily="system-ui,sans-serif"
          fontWeight="500" fill="#444" style={{ pointerEvents:'none' }}>İşitsel</text>
      </g>

      <text x="200" y="308" textAnchor="middle" fontSize="10" fontFamily="system-ui,sans-serif" fill="#aaa">
        Bölgeye tıkla → detay
      </text>
    </svg>
  )
}

export default function ResultCard({ result, creative, client }) {
  const scores = result.roi_scores || {}
  const att    = scores.attention_score ?? 0
  const al     = attLabel(att)
  const [active, setActive] = useState(null)

  const activeInsight = active
    ? ROI_INSIGHTS[active]?.[scoreLevel(scores[active] ?? 0)]
    : null

  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <div>
          <div style={s.cardTitle}>{creative}</div>
          {client && <div style={s.cardSub}>{client}</div>}
        </div>
        <div style={s.attBox}>
          <div style={{ ...s.attScore, color: al.color }}>{att.toFixed(1)}</div>
          <div style={{ ...s.attLabel, color: al.color }}>{al.text}</div>
          <div style={s.attMeta}>dikkat skoru</div>
        </div>
      </div>

      <div style={s.section}>
        <div style={s.sectionTitle}>Korteks aktivasyon haritası</div>
        <div style={s.vizRow}>
          <div style={s.brainCol}>
            <BrainMap scores={scores} active={active} onSelect={setActive} />
            {active && (
              <div style={s.insightPopup}>
                <div style={{ fontSize: 11, fontWeight: 600, color: scoreColor(scores[active]), letterSpacing: '.03em', marginBottom: 4 }}>
                  {ROI_LABELS[active]} — {(scores[active] ?? 0).toFixed(1)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.6 }}>{activeInsight}</div>
              </div>
            )}
          </div>

          <div style={s.barCol}>
            {Object.entries(ROI_LABELS).map(([key, label]) => {
              const val = scores[key] ?? 0
              const pct = Math.min(100, (val / 70) * 100)
              const isActive = active === key
              return (
                <div key={key}
                  style={{ ...s.barRow, ...(isActive ? s.barRowActive : {}) }}
                  onClick={() => setActive(isActive ? null : key)}
                >
                  <div style={s.barLabel}>{label}</div>
                  <div style={s.barTrack}>
                    <div style={{ ...s.barFill, width: `${pct}%`, background: scoreColor(val) }} />
                  </div>
                  <div style={{ ...s.barVal, color: scoreColor(val) }}>{val.toFixed(1)}</div>
                </div>
              )
            })}
            <div style={s.legend}>
              <span style={{ color: '#2d7a4f' }}>● Güçlü (&gt;55)</span>
              <span style={{ color: '#d4780a' }}>● Orta (42–55)</span>
              <span style={{ color: '#c0392b' }}>● Zayıf (&lt;42)</span>
            </div>
          </div>
        </div>
      </div>

      <div style={s.section}>
        <div style={s.sectionTitle}>Genel değerlendirme</div>
        <div style={s.insights}>
          {Object.entries(scores)
            .filter(([k]) => k !== 'attention_score')
            .sort((a, b) => b[1] - a[1])
            .slice(0, 1)
            .map(([key]) => (
              <div key={key} style={{ ...s.insightRow, borderLeftColor: '#2d7a4f' }}>
                <span style={s.insightTag}>Güçlü</span>
                <span style={s.insightText}>{ROI_INSIGHTS[key]?.high}</span>
              </div>
            ))
          }
          {Object.entries(scores)
            .filter(([k]) => k !== 'attention_score')
            .sort((a, b) => a[1] - b[1])
            .slice(0, 2)
            .map(([key]) => (
              <div key={key} style={{ ...s.insightRow, borderLeftColor: '#c0392b' }}>
                <span style={s.insightTag}>Geliştir</span>
                <span style={s.insightText}>{ROI_INSIGHTS[key]?.low}</span>
              </div>
            ))
          }
          <div style={{ ...s.insightRow, borderLeftColor: '#e0ddd6' }}>
            <span style={s.insightTag}>Genel</span>
            <span style={s.insightText}>
              {att >= 60 ? 'Güçlü beyin aktivasyonu. Mevcut yapıyı koruyarak A/B testi önerilir.'
               : att >= 35 ? 'Orta düzey aktivasyon. Zayıf bölgeler güçlendirilirse dikkat skoru önemli ölçüde artabilir.'
               : 'Düşük aktivasyon. İnsan yüzü, hareket ve net ses anlatımı eklemek kapsamlı iyileşme sağlar.'}
            </span>
          </div>
        </div>
      </div>

      <div style={s.meta}>
        <span>{result.n_timesteps} zaman adımı</span>
        <span>·</span>
        <span>{result.processing_seconds?.toFixed(0)}s işlem süresi</span>
        <span>·</span>
        <span>TRIBE v2 · fsaverage5 · ~20k vertex</span>
      </div>
    </div>
  )
}

const s = {
  card: { background: '#fff', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '20px 24px', borderBottom: '1px solid var(--border)',
  },
  cardTitle: { fontFamily: 'var(--head)', fontSize: 17, fontStyle: 'italic', marginBottom: 2 },
  cardSub: { fontSize: 12, color: 'var(--ink3)' },
  attBox: { textAlign: 'right' },
  attScore: { fontFamily: 'var(--head)', fontSize: 28, fontStyle: 'italic', lineHeight: 1 },
  attLabel: { fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', marginTop: 2 },
  attMeta: { fontSize: 11, color: 'var(--ink3)', marginTop: 1 },

  section: { padding: '20px 24px', borderBottom: '1px solid var(--border)' },
  sectionTitle: { fontSize: 11, fontWeight: 500, color: 'var(--ink3)', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 14 },

  vizRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' },
  brainCol: { display: 'flex', flexDirection: 'column', gap: 10 },
  insightPopup: {
    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6,
    padding: '10px 14px', fontSize: 12, lineHeight: 1.6,
  },

  barCol: { display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 8 },
  barRow: {
    display: 'grid', gridTemplateColumns: '100px 1fr 36px', gap: 10, alignItems: 'center',
    padding: '6px 8px', borderRadius: 4, cursor: 'pointer', transition: 'background .12s',
  },
  barRowActive: { background: 'var(--bg)' },
  barLabel: { fontSize: 12, color: 'var(--ink2)' },
  barTrack: { height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2, transition: 'width .8s ease' },
  barVal: { fontSize: 12, fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  legend: { display: 'flex', gap: 10, fontSize: 10, color: 'var(--ink3)', marginTop: 8, flexWrap: 'wrap' },

  insights: { display: 'flex', flexDirection: 'column', gap: 8 },
  insightRow: {
    display: 'flex', gap: 12, alignItems: 'flex-start',
    padding: '10px 14px', background: 'var(--bg)', borderRadius: 4,
    borderLeft: '3px solid', borderLeftStyle: 'solid',
  },
  insightTag: { fontSize: 11, fontWeight: 600, color: 'var(--ink2)', letterSpacing: '.04em', textTransform: 'uppercase', minWidth: 52, paddingTop: 1, flexShrink: 0 },
  insightText: { fontSize: 12, color: 'var(--ink)', lineHeight: 1.6 },

  meta: { padding: '10px 24px', display: 'flex', gap: 8, fontSize: 11, color: 'var(--ink3)', background: 'var(--bg)', flexWrap: 'wrap' },
}
