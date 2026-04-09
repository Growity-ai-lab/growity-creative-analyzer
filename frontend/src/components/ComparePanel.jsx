import { useState } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const ROI_LABELS = {
  visual_cortex:  'Görsel Etki',
  ventral_visual: 'Duygusal Bağ',
  dorsal_visual:  'Dinamizm',
  prefrontal:     'İkna Gücü',
  auditory:       'Ses & Ton',
  language:       'Mesaj Netliği',
}

const ROI_RATIONALE = {
  visual_cortex: {
    win:  'Bu kreatif görsel olarak daha güçlü ilk izlenim yaratıyor — renk, kontrast veya kompozisyon farkı belirleyici olmuş.',
    tie:  'Her iki kreatif görsel çekim gücü açısından benzer performans gösteriyor. Farkı başka unsurlarda aramak gerekiyor.',
    lose: 'Diğer kreatif görsel olarak daha ayırt edici. Kompozisyon veya renk kararları gözden geçirilmeli.',
  },
  ventral_visual: {
    win:  'İzleyicide daha güçlü duygusal bağ kuruyor — insan unsuru veya hikaye yapısı fark yaratmış.',
    tie:  'Duygusal bağ kurma gücü birbirine yakın. Her iki kreatifte de insan unsuru benzer düzeyde.',
    lose: 'Diğer kreatif duygusal açıdan daha etkili. İnsan yüzü veya empati yaratan sahne eksik olabilir.',
  },
  dorsal_visual: {
    win:  'Daha dinamik ve enerjik — hareket, kurgu ritmi veya kamera açısı izleyiciyi daha aktif tutuyor.',
    tie:  'Her iki kreatifte dinamizm benzer. Tempo veya hareket tasarımında belirgin fark yok.',
    lose: 'Diğer kreatif daha dinamik hissettiriyor. Kurgu hızı veya kamera hareketi artırılabilir.',
  },
  prefrontal: {
    win:  'Mesaj daha ikna edici ve harekete geçirici — CTA netliği veya fayda ifadesi fark yaratmış.',
    tie:  'İkna gücü benzer. Her iki kreatifte mesaj netliği ve CTA etkisi yakın düzeyde.',
    lose: 'Diğer kreatif daha ikna edici. CTA daha belirgin konumlandırılmalı veya fayda somutlaştırılmalı.',
  },
  auditory: {
    win:  'Ses katmanı daha etkili çalışıyor — müzik seçimi, voiceover tonu veya ses-görsel senkronizasyonu üstün.',
    tie:  'Ses etkisi benzer düzeyde. Her iki kreatifte ses stratejisi yakın performans gösteriyor.',
    lose: 'Diğer kreatifte ses daha güçlü mesajı taşıyor. Müzik veya voiceover gözden geçirilmeli.',
  },
  language: {
    win:  'Mesaj dili daha net ve akılda kalıcı — slogan, başlık veya anlatı farkı yaratmış.',
    tie:  'Mesaj netliği benzer. Her iki kreatifte dil gücü yakın düzeyde.',
    lose: 'Diğer kreatifte dil daha güçlü. Slogan veya metin daha özgün ve doğrudan olmalı.',
  },
}

const FORMAT_LABELS = {
  feed_image:  'Feed Görseli',
  story_reels: 'Story / Reels',
  feed_video:  'Feed Video',
  tvc:         'TVC',
  bumper:      'Bumper / Pre-roll',
  ooh:         'OOH / Dijital',
}

const COLORS = ['#1a1916', '#c0392b', '#2d7a4f', '#d4780a']

function scoreColor(v) {
  if (!v && v !== 0) return 'var(--ink3)'
  if (v >= 55) return '#2d7a4f'
  if (v >= 42) return '#d4780a'
  return '#c0392b'
}

function winnerFor(key, selected) {
  if (selected.length < 2) return null
  const vals = selected.map(a => ({ id: a.id, val: a.roi_scores?.[key] ?? 0 }))
  const max = Math.max(...vals.map(v => v.val))
  const min = Math.min(...vals.map(v => v.val))
  if (max - min < 2) return 'tie'
  return vals.find(v => v.val === max)?.id
}

export default function ComparePanel({ analyses }) {
  const [selected, setSelected]   = useState([])
  const [activeRow, setActiveRow] = useState(null)

  const toggle = (a) => {
    if (selected.find(s => s.id === a.id))
      setSelected(selected.filter(s => s.id !== a.id))
    else if (selected.length < 4)
      setSelected([...selected, a])
  }

  const chartData = Object.keys(ROI_LABELS).map(key => {
    const row = { subject: ROI_LABELS[key].split(' ')[0] }
    selected.forEach(a => { row[a.creative_name] = a.roi_scores?.[key] ?? 0 })
    return row
  })

  if (analyses.length === 0)
    return <div style={s.empty}>Karşılaştırmak için önce en az 2 analiz yapmalısın.</div>

  return (
    <div style={s.wrap}>

      {/* Sol: seçim listesi */}
      <div style={s.left}>
        <div style={s.sectionTitle}>Karşılaştırılacakları seç (max 4)</div>
        <div style={s.list}>
          {analyses.map(a => {
            const idx    = selected.findIndex(x => x.id === a.id)
            const active = idx >= 0
            return (
              <div key={a.id}
                style={{ ...s.item, ...(active ? { borderColor: COLORS[idx], background: 'var(--bg)' } : {}) }}
                onClick={() => toggle(a)}
              >
                {active
                  ? <span style={{ ...s.dot, background: COLORS[idx] }} />
                  : <span style={s.dotEmpty} />
                }
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={s.itemName}>{a.creative_name}</div>
                  <div style={s.itemMeta}>
                    {a.client_name || '—'}
                    {a.creative_format && (
                      <span style={s.itemFormat}>{FORMAT_LABELS[a.creative_format] || a.creative_format}</span>
                    )}
                  </div>
                </div>
                <div style={{ ...s.itemScore, color: scoreColor(a.roi_scores?.attention_score) }}>
                  {a.roi_scores?.attention_score?.toFixed(1) ?? '—'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sağ: karşılaştırma */}
      <div style={s.right}>
        {selected.length < 2 ? (
          <div style={s.emptyRight}>
            <div style={s.emptyIcon}>◫</div>
            <div style={s.emptyText}>En az 2 kreatif seç</div>
          </div>
        ) : (
          <>
            <div style={s.sectionTitle}>Aktivasyon karşılaştırması</div>

            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={chartData} margin={{ top:10, right:20, bottom:10, left:20 }}>
                <PolarGrid stroke="#e0ddd6" />
                <PolarAngleAxis dataKey="subject"
                  tick={{ fill:'#6b6860', fontSize:11, fontFamily:'Geist, sans-serif' }} />
                <Tooltip
                  contentStyle={{ background:'#fff', border:'1px solid #e0ddd6', borderRadius:6, fontSize:12 }}
                />
                <Legend wrapperStyle={{ fontSize:12, fontFamily:'Geist, sans-serif', paddingTop:8 }} />
                {selected.map((a, i) => (
                  <Radar key={a.id} name={a.creative_name} dataKey={a.creative_name}
                    stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.07} strokeWidth={1.5} />
                ))}
              </RadarChart>
            </ResponsiveContainer>

            {/* Metrik tablosu — tıklanabilir */}
            <div style={s.sectionTitle}>Metrik bazlı karşılaştırma</div>
            <div style={s.metricList}>
              {Object.entries(ROI_LABELS).map(([key, label]) => {
                const winner    = winnerFor(key, selected)
                const isOpen    = activeRow === key
                const maxVal    = Math.max(...selected.map(a => a.roi_scores?.[key] ?? 0))
                const minVal    = Math.min(...selected.map(a => a.roi_scores?.[key] ?? 0))

                return (
                  <div key={key}>
                    <div
                      style={{ ...s.metricRow, ...(isOpen ? s.metricRowOpen : {}) }}
                      onClick={() => setActiveRow(isOpen ? null : key)}
                    >
                      <div style={s.metricLabel}>
                        <span style={s.metricName}>{label}</span>
                        {winner === 'tie' && <span style={s.tieBadge}>Berabere</span>}
                      </div>
                      <div style={s.metricScores}>
                        {selected.map((a, i) => {
                          const val     = a.roi_scores?.[key] ?? 0
                          const isWin   = winner !== 'tie' && winner === a.id
                          const isBest  = val === maxVal && maxVal !== minVal
                          return (
                            <div key={a.id} style={s.metricScoreCell}>
                              <div style={{ ...s.metricDot, background: COLORS[i] }} />
                              <span style={{
                                ...s.metricVal,
                                color: scoreColor(val),
                                fontWeight: isBest ? 700 : 400,
                              }}>
                                {val.toFixed(1)}
                                {isBest && <span style={s.winArrow}>↑</span>}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                      <span style={{ ...s.chevron, transform: isOpen ? 'rotate(90deg)' : 'none' }}>›</span>
                    </div>

                    {isOpen && (
                      <div style={s.rationaleBox}>
                        {selected.map((a, i) => {
                          const val   = a.roi_scores?.[key] ?? 0
                          const role  = winner === 'tie' ? 'tie' : winner === a.id ? 'win' : 'lose'
                          const text  = ROI_RATIONALE[key]?.[role]
                          return (
                            <div key={a.id} style={s.rationaleRow}>
                              <div style={{ ...s.rationaleDot, background: COLORS[i] }} />
                              <div style={{ flex:1 }}>
                                <div style={s.rationaleName}>{a.creative_name}</div>
                                <div style={s.rationaleText}>{text}</div>
                              </div>
                              <div style={{ ...s.rationaleScore, color: scoreColor(val) }}>
                                {val.toFixed(1)}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Genel kazanan */}
            <div style={s.winnerBox}>
              {(() => {
                const attScores = selected.map(a => ({
                  a, val: a.roi_scores?.attention_score ?? 0
                })).sort((x,y) => y.val - x.val)
                const best = attScores[0]
                const diff = best.val - attScores[1]?.val
                if (diff < 2) return (
                  <div style={s.winnerText}>
                    <span style={s.winnerLabel}>Dikkat skoru</span>
                    Kreatiflerin genel performansı birbirine çok yakın — ikisi de değerlendirilebilir.
                  </div>
                )
                const idx = selected.findIndex(a => a.id === best.a.id)
                return (
                  <div style={s.winnerText}>
                    <span style={s.winnerLabel}>Dikkat skoru</span>
                    <span style={{ color: COLORS[idx], fontWeight:600 }}>{best.a.creative_name}</span>
                    {' '}genel aktivasyonda öne çıkıyor ({best.val.toFixed(1)} vs {attScores[1]?.val.toFixed(1)}).
                  </div>
                )
              })()}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const s = {
  wrap: { display:'grid', gridTemplateColumns:'260px 1fr', gap:40, alignItems:'start' },
  left: { display:'flex', flexDirection:'column', gap:10 },
  right: { display:'flex', flexDirection:'column', gap:16 },
  sectionTitle: { fontSize:11, fontWeight:600, color:'var(--ink3)', letterSpacing:'.05em', textTransform:'uppercase', marginBottom:4 },
  empty: { textAlign:'center', color:'var(--ink3)', padding:60 },
  emptyRight: { display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'60px 0', color:'var(--ink3)' },
  emptyIcon: { fontSize:32, opacity:.3 },
  emptyText: { fontSize:13 },

  list: { display:'flex', flexDirection:'column', gap:6 },
  item: {
    display:'flex', alignItems:'center', gap:10,
    background:'#fff', border:'1px solid var(--border)',
    borderRadius:6, padding:'10px 12px', cursor:'pointer', transition:'all .12s',
  },
  dot: { width:8, height:8, borderRadius:'50%', flexShrink:0 },
  dotEmpty: { width:8, height:8, borderRadius:'50%', border:'1px solid var(--border2)', flexShrink:0 },
  itemName: { fontSize:12, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  itemMeta: { fontSize:11, color:'var(--ink3)', display:'flex', alignItems:'center', gap:6, marginTop:1 },
  itemFormat: { fontSize:10, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:3, padding:'1px 5px', color:'var(--ink3)' },
  itemScore: { fontSize:14, fontWeight:600, marginLeft:8, fontFamily:'var(--head)', fontStyle:'italic' },

  metricList: { display:'flex', flexDirection:'column', border:'1px solid var(--border)', borderRadius:6, overflow:'hidden' },
  metricRow: {
    display:'flex', alignItems:'center', gap:12,
    padding:'10px 14px', background:'#fff', cursor:'pointer',
    transition:'background .12s', borderBottom:'1px solid var(--border)',
  },
  metricRowOpen: { background:'var(--bg)' },
  metricLabel: { flex:1, display:'flex', alignItems:'center', gap:8 },
  metricName: { fontSize:13, fontWeight:500, color:'var(--ink)' },
  tieBadge: { fontSize:10, color:'var(--ink3)', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:3, padding:'1px 6px' },
  metricScores: { display:'flex', gap:16, alignItems:'center' },
  metricScoreCell: { display:'flex', alignItems:'center', gap:5 },
  metricDot: { width:6, height:6, borderRadius:'50%', flexShrink:0 },
  metricVal: { fontSize:13, fontVariantNumeric:'tabular-nums' },
  winArrow: { fontSize:10, marginLeft:2 },
  chevron: { fontSize:16, color:'var(--ink3)', transition:'transform .15s', flexShrink:0 },

  rationaleBox: {
    background:'#fafaf8', borderBottom:'1px solid var(--border)',
    padding:'12px 14px', display:'flex', flexDirection:'column', gap:10,
  },
  rationaleRow: { display:'flex', gap:10, alignItems:'flex-start' },
  rationaleDot: { width:8, height:8, borderRadius:'50%', flexShrink:0, marginTop:4 },
  rationaleName: { fontSize:11, fontWeight:600, color:'var(--ink2)', marginBottom:2 },
  rationaleText: { fontSize:12, color:'var(--ink)', lineHeight:1.6 },
  rationaleScore: { fontSize:14, fontWeight:700, fontFamily:'var(--head)', fontStyle:'italic', flexShrink:0 },

  winnerBox: {
    background:'var(--bg)', border:'1px solid var(--border)',
    borderRadius:6, padding:'12px 16px',
  },
  winnerText: { fontSize:13, color:'var(--ink)', lineHeight:1.6 },
  winnerLabel: { fontSize:10, fontWeight:600, color:'var(--ink3)', letterSpacing:'.05em', textTransform:'uppercase', display:'block', marginBottom:4 },
}
