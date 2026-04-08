import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

const ROI_LABELS = {
  visual_cortex:  'Görsel Korteks',
  ventral_visual: 'Ventral Görsel',
  dorsal_visual:  'Dorsal Görsel',
  prefrontal:     'Prefrontal',
  auditory:       'İşitsel',
  language:       'Dil',
}

const ROI_INSIGHTS = {
  visual_cortex:  { high: 'Güçlü görsel uyarım — renk, kontrast ve şekil etkili çalışıyor.', low: 'Görsel korteks zayıf aktive. Daha güçlü görsel kontrastlar veya hareketli öğeler ekleyin.' },
  ventral_visual: { high: 'İnsan yüzü veya nesne tanıma güçlü — izleyici dikkatini çekiyor.', low: 'Nesne/yüz işleme düşük. İnsan yüzü eklemek bu skoru önemli ölçüde artırır.' },
  dorsal_visual:  { high: 'Uzamsal hareket ve dinamizm beyin tarafından algılanıyor.', low: 'Dorsal görsel zayıf — kreatifte hareket/dinamizm eksik.' },
  prefrontal:     { high: 'İzleyici karar verme ve dikkat sistemi devrede.', low: 'Prefrontal aktivasyon düşük — mesaj yeterince dikkat çekici değil.' },
  auditory:       { high: 'Ses/müzik elementi beyin tarafından güçlü işleniyor.', low: 'İşitsel bölge zayıf — müzik veya voiceover etkisini artırabilir.' },
  language:       { high: 'Dil işleme aktif — metin/slogan beyin tarafından algılanıyor.', low: 'Dil bölgesi düşük — net bir mesaj veya voiceover eksik olabilir.' },
}

function scoreLevel(v) {
  if (v >= 55) return 'high'
  if (v >= 42) return 'mid'
  return 'low'
}
function scoreColor(v) {
  if (v >= 55) return '#2d7a4f'
  if (v >= 42) return '#d4780a'
  return '#c0392b'
}
function scoreLabel(v) {
  if (v >= 55) return 'Yüksek'
  if (v >= 42) return 'Orta'
  return 'Düşük'
}
function attLabel(v) {
  if (v >= 60) return { text: 'Güçlü', color: '#2d7a4f' }
  if (v >= 35) return { text: 'Orta', color: '#d4780a' }
  return { text: 'Zayıf', color: '#c0392b' }
}

export default function ResultCard({ result, creative, client }) {
  const scores = result.roi_scores || {}
  const att    = scores.attention_score ?? 0
  const al     = attLabel(att)

  const radarData = Object.entries(ROI_LABELS).map(([key, label]) => ({
    subject: label.split(' ')[0],
    value: scores[key] ?? 0,
    fullLabel: label,
  }))

  const weakest  = Object.entries(ROI_LABELS)
    .sort((a,b) => (scores[a[0]] ?? 0) - (scores[b[0]] ?? 0))
    .slice(0, 2)
    .map(([k]) => k)

  const strongest = Object.entries(ROI_LABELS)
    .sort((a,b) => (scores[b[0]] ?? 0) - (scores[a[0]] ?? 0))
    .slice(0, 1)
    .map(([k]) => k)

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
        <div style={s.charts}>
          <div style={s.radarWrap}>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="#e0ddd6" />
                <PolarAngleAxis dataKey="subject"
                  tick={{ fill: '#6b6860', fontSize: 11, fontFamily: 'Geist, sans-serif' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div style={{ background: '#fff', border: '1px solid #e0ddd6', borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
                        <div style={{ fontWeight: 500 }}>{d.fullLabel}</div>
                        <div style={{ color: scoreColor(d.value) }}>{d.value.toFixed(1)} — {scoreLabel(d.value)}</div>
                      </div>
                    )
                  }}
                />
                <Radar dataKey="value" stroke="#1a1916" fill="#1a1916" fillOpacity={0.08} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div style={s.barList}>
            {Object.entries(ROI_LABELS).map(([key, label]) => {
              const val = scores[key] ?? 0
              const pct = Math.min(100, (val / 70) * 100)
              return (
                <div key={key} style={s.barRow}>
                  <div style={s.barLabel}>{label}</div>
                  <div style={s.barTrack}>
                    <div style={{ ...s.barFill, width: `${pct}%`, background: scoreColor(val) }} />
                  </div>
                  <div style={{ ...s.barVal, color: scoreColor(val) }}>{val.toFixed(1)}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={s.section}>
        <div style={s.sectionTitle}>Insight & Öneriler</div>
        <div style={s.insights}>
          {strongest.map(k => (
            <div key={k} style={{ ...s.insightRow, borderLeft: '3px solid #2d7a4f' }}>
              <div style={s.insightTag}>Güçlü</div>
              <div style={s.insightText}>{ROI_INSIGHTS[k].high}</div>
            </div>
          ))}
          {weakest.map(k => (
            <div key={k} style={{ ...s.insightRow, borderLeft: '3px solid #c0392b' }}>
              <div style={s.insightTag}>Geliştir</div>
              <div style={s.insightText}>{ROI_INSIGHTS[k].low}</div>
            </div>
          ))}
          <div style={{ ...s.insightRow, borderLeft: '3px solid #e0ddd6', borderRadius: 0 }}>
            <div style={s.insightTag}>Genel</div>
            <div style={s.insightText}>
              {att >= 60
                ? 'Bu kreatif güçlü bir beyin aktivasyonu yaratıyor. Mevcut yapıyı koruyarak A/B testi önerilir.'
                : att >= 35
                ? 'Orta düzey aktivasyon. Zayıf bölgeler güçlendirilirse dikkat skoru önemli ölçüde artabilir.'
                : 'Dikkat aktivasyonu düşük. Kapsamlı revizyon gerekebilir — özellikle insan yüzü ve hareket elementi eklenmeli.'}
            </div>
          </div>
        </div>
      </div>

      <div style={s.meta}>
        <span>{result.n_timesteps} zaman adımı</span>
        <span>·</span>
        <span>{result.processing_seconds?.toFixed(0)}s işlem süresi</span>
        <span>·</span>
        <span>TRIBE v2 · fsaverage5</span>
      </div>
    </div>
  )
}

const s = {
  card: {
    background: '#fff', border: '1px solid var(--border)', borderRadius: 8,
    overflow: 'hidden', animation: 'fadeUp .4s ease',
  },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '20px 24px', borderBottom: '1px solid var(--border)',
  },
  cardTitle: { fontFamily: 'var(--head)', fontSize: 17, fontStyle: 'italic', marginBottom: 2 },
  cardSub: { fontSize: 12, color: 'var(--ink3)' },
  attBox: { textAlign: 'right' },
  attScore: { fontFamily: 'var(--head)', fontSize: 28, fontStyle: 'italic', lineHeight: 1 },
  attLabel: { fontSize: 12, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', marginTop: 2 },
  attMeta: { fontSize: 11, color: 'var(--ink3)', marginTop: 1 },

  section: { padding: '20px 24px', borderBottom: '1px solid var(--border)' },
  sectionTitle: { fontSize: 11, fontWeight: 500, color: 'var(--ink3)', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 14 },

  charts: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center' },
  radarWrap: { minHeight: 200 },

  barList: { display: 'flex', flexDirection: 'column', gap: 9 },
  barRow: { display: 'grid', gridTemplateColumns: '100px 1fr 36px', gap: 10, alignItems: 'center' },
  barLabel: { fontSize: 12, color: 'var(--ink2)' },
  barTrack: { height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2, transition: 'width .8s ease' },
  barVal: { fontSize: 12, fontWeight: 500, textAlign: 'right', fontVariantNumeric: 'tabular-nums' },

  insights: { display: 'flex', flexDirection: 'column', gap: 10 },
  insightRow: {
    display: 'flex', gap: 12, alignItems: 'flex-start',
    padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--r)',
    borderLeftWidth: 3, borderLeftStyle: 'solid',
  },
  insightTag: { fontSize: 11, fontWeight: 600, color: 'var(--ink2)', letterSpacing: '.04em', textTransform: 'uppercase', minWidth: 52, paddingTop: 1 },
  insightText: { fontSize: 13, color: 'var(--ink)', lineHeight: 1.6 },

  meta: {
    padding: '12px 24px', display: 'flex', gap: 8, fontSize: 11, color: 'var(--ink3)',
    background: 'var(--bg)',
  },
}
