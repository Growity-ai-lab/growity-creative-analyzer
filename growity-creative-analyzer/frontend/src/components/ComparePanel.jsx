import { useState } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Legend, Tooltip
} from 'recharts'

const ROI_LABELS = {
  visual_cortex:  'Görsel Korteks',
  ventral_visual: 'Ventral Görsel',
  dorsal_visual:  'Dorsal Görsel',
  prefrontal:     'Prefrontal',
  auditory:       'İşitsel',
  language:       'Dil',
}

const COLORS = ['#6c63ff', '#ff6584', '#43e97b', '#f7971e']

export default function ComparePanel({ analyses }) {
  const [selected, setSelected] = useState([])

  const toggle = (a) => {
    if (selected.find(s => s.id === a.id)) {
      setSelected(selected.filter(s => s.id !== a.id))
    } else if (selected.length < 4) {
      setSelected([...selected, a])
    }
  }

  const chartData = Object.keys(ROI_LABELS).map(key => {
    const row = { subject: ROI_LABELS[key] }
    selected.forEach(a => {
      row[a.creative_name] = a.roi_scores?.[key] ?? 0
    })
    return row
  })

  if (analyses.length === 0) {
    return <div style={styles.empty}>Karşılaştırmak için önce analiz yapmalısın.</div>
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.left}>
        <div style={styles.sectionTitle}>Karşılaştırılacakları seç (max 4)</div>
        <div style={styles.list}>
          {analyses.map(a => {
            const isSelected = !!selected.find(s => s.id === a.id)
            const idx = selected.findIndex(s => s.id === a.id)
            return (
              <div
                key={a.id}
                style={{
                  ...styles.item,
                  ...(isSelected ? { borderColor: COLORS[idx], background: 'var(--surface2)' } : {})
                }}
                onClick={() => toggle(a)}
              >
                {isSelected && (
                  <span style={{ ...styles.colorDot, background: COLORS[idx] }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={styles.itemName}>{a.creative_name}</div>
                  <div style={styles.itemClient}>{a.client_name || '—'}</div>
                </div>
                <div style={styles.itemScore}>
                  {a.roi_scores?.attention_score ?? '—'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={styles.right}>
        {selected.length < 2 ? (
          <div style={styles.empty}>En az 2 kreatif seç</div>
        ) : (
          <>
            <div style={styles.sectionTitle}>Beyin Aktivasyon Karşılaştırması</div>
            <ResponsiveContainer width="100%" height={380}>
              <RadarChart data={chartData}>
                <PolarGrid stroke="#2a2a38" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#6b6b85', fontSize: 12, fontFamily: 'DM Sans' }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#13131a', border: '1px solid #2a2a38',
                    borderRadius: 8, fontSize: 12
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, fontFamily: 'DM Sans', paddingTop: 16 }}
                />
                {selected.map((a, i) => (
                  <Radar
                    key={a.id}
                    name={a.creative_name}
                    dataKey={a.creative_name}
                    stroke={COLORS[i]}
                    fill={COLORS[i]}
                    fillOpacity={0.12}
                    strokeWidth={2}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>

            {/* Sayısal karşılaştırma tablosu */}
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Bölge</th>
                  {selected.map((a, i) => (
                    <th key={a.id} style={{ ...styles.th, color: COLORS[i] }}>
                      {a.creative_name.length > 20
                        ? a.creative_name.slice(0, 20) + '…'
                        : a.creative_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(ROI_LABELS).map(([key, label]) => (
                  <tr key={key} style={styles.tr}>
                    <td style={styles.td}>{label}</td>
                    {selected.map(a => {
                      const val = a.roi_scores?.[key] ?? 0
                      const max = Math.max(...selected.map(s => s.roi_scores?.[key] ?? 0))
                      return (
                        <td key={a.id} style={{
                          ...styles.td,
                          fontWeight: val === max ? 600 : 400,
                          color: val === max ? 'var(--text)' : 'var(--muted)',
                        }}>
                          {val}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                <tr style={{ ...styles.tr, borderTop: '1px solid var(--border)' }}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>Dikkat Skoru</td>
                  {selected.map(a => {
                    const val = a.roi_scores?.attention_score ?? 0
                    const max = Math.max(...selected.map(s => s.roi_scores?.attention_score ?? 0))
                    return (
                      <td key={a.id} style={{
                        ...styles.td, fontWeight: 700,
                        color: val === max ? 'var(--accent)' : 'var(--muted)',
                      }}>
                        {val}
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  wrap: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32, alignItems: 'start' },
  left: { display: 'flex', flexDirection: 'column', gap: 12 },
  right: { display: 'flex', flexDirection: 'column', gap: 20 },
  sectionTitle: { fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14, color: 'var(--muted)', marginBottom: 4 },
  empty: { textAlign: 'center', color: 'var(--muted)', padding: 60 },

  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  item: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
    transition: 'border-color .15s',
  },
  colorDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  itemName: { fontSize: 13, fontWeight: 500, marginBottom: 2 },
  itemClient: { fontSize: 11, color: 'var(--muted)' },
  itemScore: { fontSize: 14, fontWeight: 700, color: 'var(--accent)' },

  table: {
    width: '100%', borderCollapse: 'collapse',
    background: 'var(--surface)', borderRadius: 10, overflow: 'hidden',
  },
  th: {
    padding: '10px 16px', textAlign: 'left', fontSize: 12,
    color: 'var(--muted)', fontWeight: 600, background: 'var(--surface2)',
    borderBottom: '1px solid var(--border)',
  },
  tr: { borderBottom: '1px solid var(--border)' },
  td: { padding: '10px 16px', fontSize: 13 },
}
