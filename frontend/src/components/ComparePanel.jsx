import { useState } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const ROI_LABELS = {
  visual_cortex:  'Görsel',
  ventral_visual: 'Ventral',
  dorsal_visual:  'Dorsal',
  prefrontal:     'Prefrontal',
  auditory:       'İşitsel',
  language:       'Dil',
}

const COLORS = ['#1a1916', '#c0392b', '#2d7a4f', '#d4780a']

function scoreColor(v) {
  if (!v && v !== 0) return 'var(--ink3)'
  if (v >= 60) return '#2d7a4f'
  if (v >= 35) return '#d4780a'
  return '#c0392b'
}

export default function ComparePanel({ analyses }) {
  const [selected, setSelected] = useState([])

  const toggle = (a) => {
    if (selected.find(s => s.id === a.id))
      setSelected(selected.filter(s => s.id !== a.id))
    else if (selected.length < 4)
      setSelected([...selected, a])
  }

  const chartData = Object.keys(ROI_LABELS).map(key => {
    const row = { subject: ROI_LABELS[key] }
    selected.forEach(a => { row[a.creative_name] = a.roi_scores?.[key] ?? 0 })
    return row
  })

  if (analyses.length === 0)
    return <div style={s.empty}>Karşılaştırmak için önce en az 2 analiz yapmalısın.</div>

  return (
    <div style={s.wrap}>
      <div style={s.left}>
        <div style={s.sectionTitle}>Seç (max 4)</div>
        <div style={s.list}>
          {analyses.map(a => {
            const idx = selected.findIndex(x => x.id === a.id)
            const active = idx >= 0
            return (
              <div key={a.id}
                style={{ ...s.item, ...(active ? { borderColor: COLORS[idx], background: 'var(--bg)' } : {}) }}
                onClick={() => toggle(a)}
              >
                {active && <span style={{ ...s.colorDot, background: COLORS[idx] }} />}
                {!active && <span style={s.emptyDot} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.itemName}>{a.creative_name}</div>
                  <div style={s.itemClient}>{a.client_name || '—'}</div>
                </div>
                <div style={{ ...s.itemScore, color: scoreColor(a.roi_scores?.attention_score) }}>
                  {a.roi_scores?.attention_score?.toFixed(1) ?? '—'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={s.right}>
        {selected.length < 2
          ? <div style={s.empty}>En az 2 kreatif seç</div>
          : (
            <>
              <div style={s.sectionTitle}>Aktivasyon karşılaştırması</div>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={chartData}>
                  <PolarGrid stroke="#e0ddd6" />
                  <PolarAngleAxis dataKey="subject"
                    tick={{ fill: '#6b6860', fontSize: 12, fontFamily: 'Geist, sans-serif' }} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e0ddd6', borderRadius: 6, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'Geist, sans-serif', paddingTop: 12 }} />
                  {selected.map((a, i) => (
                    <Radar key={a.id} name={a.creative_name} dataKey={a.creative_name}
                      stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.07} strokeWidth={1.5} />
                  ))}
                </RadarChart>
              </ResponsiveContainer>

              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Bölge</th>
                    {selected.map((a, i) => (
                      <th key={a.id} style={{ ...s.th, color: COLORS[i] }}>
                        {a.creative_name.length > 18 ? a.creative_name.slice(0,18)+'…' : a.creative_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(ROI_LABELS).map(([key, label]) => (
                    <tr key={key} style={s.tr}>
                      <td style={s.td}>{label}</td>
                      {selected.map(a => {
                        const val = a.roi_scores?.[key] ?? 0
                        const max = Math.max(...selected.map(x => x.roi_scores?.[key] ?? 0))
                        return (
                          <td key={a.id} style={{ ...s.td, fontWeight: val === max ? 600 : 400, color: val === max ? 'var(--ink)' : 'var(--ink3)' }}>
                            {val.toFixed(1)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                  <tr style={{ ...s.tr, borderTop: '2px solid var(--border)' }}>
                    <td style={{ ...s.td, fontWeight: 600 }}>Dikkat skoru</td>
                    {selected.map(a => {
                      const val = a.roi_scores?.attention_score ?? 0
                      const max = Math.max(...selected.map(x => x.roi_scores?.attention_score ?? 0))
                      return (
                        <td key={a.id} style={{ ...s.td, fontWeight: 700, color: scoreColor(val), fontFamily: 'var(--head)', fontStyle: 'italic', fontSize: 16 }}>
                          {val.toFixed(1)}
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </>
          )
        }
      </div>
    </div>
  )
}

const s = {
  wrap: { display: 'grid', gridTemplateColumns: '260px 1fr', gap: 40, alignItems: 'start' },
  left: { display: 'flex', flexDirection: 'column', gap: 10 },
  right: { display: 'flex', flexDirection: 'column', gap: 20 },
  sectionTitle: { fontSize: 11, fontWeight: 500, color: 'var(--ink3)', letterSpacing: '.05em', textTransform: 'uppercase' },
  empty: { textAlign: 'center', color: 'var(--ink3)', padding: 60 },
  list: { display: 'flex', flexDirection: 'column', gap: 6 },
  item: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#fff', border: '1px solid var(--border)',
    borderRadius: 'var(--r)', padding: '10px 12px', cursor: 'pointer', transition: 'all .12s',
  },
  colorDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  emptyDot: { width: 8, height: 8, borderRadius: '50%', border: '1px solid var(--border2)', flexShrink: 0 },
  itemName: { fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  itemClient: { fontSize: 11, color: 'var(--ink3)' },
  itemScore: { fontSize: 14, fontWeight: 600, marginLeft: 8, fontFamily: 'var(--head)', fontStyle: 'italic' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--ink2)', background: 'var(--bg)', borderBottom: '1px solid var(--border)', letterSpacing: '.03em', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid var(--border)' },
  td: { padding: '9px 14px', fontSize: 13 },
}
