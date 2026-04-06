import { useState } from 'react'

const ROI_LABELS = {
  visual_cortex:  'Görsel',
  ventral_visual: 'Ventral',
  dorsal_visual:  'Dorsal',
  prefrontal:     'Prefrontal',
  auditory:       'İşitsel',
  language:       'Dil',
}

export default function HistoryPanel({ analyses, loading, onRefresh }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = analyses.filter(a =>
    a.creative_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.client_name?.toLowerCase().includes(search.toLowerCase())
  )

  const fmt = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('tr-TR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) return (
    <div style={styles.empty}>Yükleniyor...</div>
  )

  return (
    <div style={styles.wrap}>
      <div style={styles.toolbar}>
        <input style={styles.search} placeholder="Kreatif veya müşteri ara..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <button style={styles.refreshBtn} onClick={onRefresh}>↻ Yenile</button>
      </div>

      {filtered.length === 0 ? (
        <div style={styles.empty}>Henüz analiz yok.</div>
      ) : (
        <div style={styles.grid}>
          {filtered.map(a => (
            <div
              key={a.id}
              style={{ ...styles.card, ...(selected?.id === a.id ? styles.cardSelected : {}) }}
              onClick={() => setSelected(selected?.id === a.id ? null : a)}
            >
              <div style={styles.cardTop}>
                <div>
                  <div style={styles.cardName}>{a.creative_name}</div>
                  <div style={styles.cardClient}>{a.client_name || 'Müşteri belirtilmemiş'}</div>
                </div>
                <div style={styles.attBadge}>
                  {a.roi_scores?.attention_score ?? '—'}
                </div>
              </div>

              <div style={styles.miniScores}>
                {Object.entries(ROI_LABELS).map(([key, label]) => (
                  <div key={key} style={styles.miniScore}>
                    <div style={styles.miniLabel}>{label}</div>
                    <div style={styles.miniBar}>
                      <div style={{
                        ...styles.miniFill,
                        width: `${Math.min(100, a.roi_scores?.[key] ?? 0)}%`
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              {selected?.id === a.id && (
                <div style={styles.cardDetail}>
                  <div style={styles.detailRow}>
                    <span style={styles.detailKey}>Tarih</span>
                    <span>{fmt(a.created_at)}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailKey}>Format</span>
                    <span>{a.file_type || '—'}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailKey}>İşlem süresi</span>
                    <span>{a.processing_seconds}s</span>
                  </div>
                  {a.notes && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailKey}>Not</span>
                      <span style={{ color: 'var(--muted)' }}>{a.notes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 20 },
  toolbar: { display: 'flex', gap: 12 },
  search: {
    flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none',
  },
  refreshBtn: {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '10px 18px', color: 'var(--text)', fontSize: 14,
  },
  empty: { textAlign: 'center', color: 'var(--muted)', padding: 60 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 },
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 12, padding: 18, cursor: 'pointer',
    transition: 'border-color .15s', display: 'flex', flexDirection: 'column', gap: 14,
  },
  cardSelected: { borderColor: 'var(--accent)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardName: { fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14, marginBottom: 2 },
  cardClient: { fontSize: 12, color: 'var(--muted)' },
  attBadge: {
    background: 'var(--accent)', color: '#fff', borderRadius: 20,
    fontSize: 13, fontWeight: 700, padding: '3px 12px', flexShrink: 0,
  },
  miniScores: { display: 'flex', flexDirection: 'column', gap: 6 },
  miniScore: { display: 'grid', gridTemplateColumns: '70px 1fr', gap: 8, alignItems: 'center' },
  miniLabel: { fontSize: 11, color: 'var(--muted)' },
  miniBar: { height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' },
  miniFill: { height: '100%', background: 'var(--accent)', borderRadius: 2 },
  cardDetail: {
    borderTop: '1px solid var(--border)', paddingTop: 12,
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  detailRow: {
    display: 'flex', justifyContent: 'space-between', fontSize: 12,
  },
  detailKey: { color: 'var(--muted)' },
}
