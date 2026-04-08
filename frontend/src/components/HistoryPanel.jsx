import { useState } from 'react'
import ResultCard from './ResultCard.jsx'

function scoreColor(v) {
  if (!v && v !== 0) return 'var(--ink3)'
  if (v >= 60) return '#2d7a4f'
  if (v >= 35) return '#d4780a'
  return '#c0392b'
}

export default function HistoryPanel({ analyses, loading, onRefresh }) {
  const [search, setSearch]   = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = analyses.filter(a =>
    a.creative_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.client_name?.toLowerCase().includes(search.toLowerCase())
  )

  const fmt = iso => iso ? new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit', month: 'short', year: 'numeric'
  }) : '—'

  if (loading) return <div style={s.empty}>Yükleniyor...</div>

  return (
    <div style={s.wrap}>
      <div style={s.toolbar}>
        <input style={s.search} placeholder="Kreatif veya müşteri ara..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <button style={s.refreshBtn} onClick={onRefresh}>↻</button>
      </div>

      {filtered.length === 0
        ? <div style={s.empty}>Henüz analiz yok.</div>
        : (
          <div style={s.layout}>
            <div style={s.list}>
              {filtered.map(a => (
                <div key={a.id}
                  style={{ ...s.row, ...(selected?.id === a.id ? s.rowActive : {}) }}
                  onClick={() => setSelected(selected?.id === a.id ? null : a)}
                >
                  <div style={s.rowMain}>
                    <div style={s.rowName}>{a.creative_name}</div>
                    <div style={s.rowMeta}>{a.client_name || '—'} · {fmt(a.created_at)}</div>
                  </div>
                  <div style={{ ...s.rowScore, color: scoreColor(a.roi_scores?.attention_score) }}>
                    {a.roi_scores?.attention_score?.toFixed(1) ?? '—'}
                  </div>
                </div>
              ))}
            </div>

            {selected && (
              <div style={s.detail}>
                <ResultCard result={selected} creative={selected.creative_name} client={selected.client_name} />
              </div>
            )}
          </div>
        )
      }
    </div>
  )
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 20 },
  toolbar: { display: 'flex', gap: 10 },
  search: {
    flex: 1, background: '#fff', border: '1px solid var(--border)',
    borderRadius: 'var(--r)', padding: '9px 14px', color: 'var(--ink)', fontSize: 13, outline: 'none',
  },
  refreshBtn: {
    background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r)',
    padding: '9px 14px', color: 'var(--ink2)', fontSize: 15,
  },
  empty: { textAlign: 'center', color: 'var(--ink3)', padding: 60 },
  layout: { display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' },
  list: { display: 'flex', flexDirection: 'column', gap: 2 },
  row: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 14px', borderRadius: 'var(--r)', cursor: 'pointer',
    border: '1px solid transparent', transition: 'all .12s', background: '#fff',
    borderColor: 'var(--border)',
  },
  rowActive: { borderColor: 'var(--ink)', background: 'var(--bg)' },
  rowMain: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 13, fontWeight: 500, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowMeta: { fontSize: 11, color: 'var(--ink3)' },
  rowScore: { fontSize: 16, fontWeight: 600, marginLeft: 12, fontFamily: 'var(--head)', fontStyle: 'italic' },
  detail: {},
}
