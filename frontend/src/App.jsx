import { useState, useEffect } from 'react'
import UploadPanel from './components/UploadPanel.jsx'
import HistoryPanel from './components/HistoryPanel.jsx'
import ComparePanel from './components/ComparePanel.jsx'

const MODAL_API = import.meta.env.VITE_MODAL_API_URL

const NAV = [
  { id: 'upload',  label: 'Analiz' },
  { id: 'history', label: 'Geçmiş' },
  { id: 'compare', label: 'Karşılaştır' },
]

export default function App() {
  const [tab, setTab]         = useState('upload')
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    try {
      const res  = await fetch(`${MODAL_API}/analyses`)
      const data = await res.json()
      setAnalyses(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { reload() }, [])

  return (
    <div style={s.shell}>
      <aside style={s.sidebar}>
        <div style={s.brand}>
          <div style={s.brandMark}>G</div>
          <div>
            <div style={s.brandName}>Growity</div>
            <div style={s.brandSub}>Neural Analyzer</div>
          </div>
        </div>

        <div style={s.divider} />

        <nav style={s.nav}>
          {NAV.map(n => (
            <button
              key={n.id}
              style={{ ...s.navBtn, ...(tab === n.id ? s.navActive : {}) }}
              onClick={() => setTab(n.id)}
            >
              <span>{n.label}</span>
              {n.id === 'history' && analyses.length > 0 && (
                <span style={s.navCount}>{analyses.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={s.sidebarFooter}>
          <div style={s.footerRow}>
            <span style={s.footerDot} />
            <span style={s.footerLabel}>TRIBE v2</span>
          </div>
          <div style={s.footerSub}>Meta AI · CC BY-NC 4.0</div>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.header}>
          <h1 style={s.headerTitle}>{NAV.find(n => n.id === tab)?.label}</h1>
          <div style={s.headerRight}>
            <span style={s.headerDate}>{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </header>

        <div style={s.content}>
          {tab === 'upload'  && <UploadPanel onComplete={reload} analyses={analyses} />}
          {tab === 'history' && <HistoryPanel analyses={analyses} loading={loading} onRefresh={reload} />}
          {tab === 'compare' && <ComparePanel analyses={analyses} />}
        </div>
      </main>
    </div>
  )
}

const s = {
  shell: { display: 'flex', minHeight: '100vh' },
  sidebar: {
    width: 200, background: 'var(--surface)', borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', padding: '24px 16px',
    position: 'sticky', top: 0, height: '100vh',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 },
  brandMark: {
    width: 32, height: 32, background: 'var(--ink)', borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--head)', fontSize: 18, color: '#fff', fontStyle: 'italic',
    flexShrink: 0,
  },
  brandName: { fontFamily: 'var(--head)', fontSize: 15, color: 'var(--ink)', fontStyle: 'italic' },
  brandSub: { fontSize: 11, color: 'var(--ink3)', letterSpacing: '.04em' },
  divider: { height: '1px', background: 'var(--border)', marginBottom: 16 },
  nav: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1 },
  navBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 10px', borderRadius: 'var(--r)', border: 'none',
    background: 'transparent', color: 'var(--ink2)', fontSize: 13,
    fontWeight: 400, transition: 'all .12s', textAlign: 'left',
  },
  navActive: {
    background: 'var(--bg)', color: 'var(--ink)', fontWeight: 500,
    border: '1px solid var(--border)',
  },
  navCount: {
    fontSize: 11, background: 'var(--ink)', color: '#fff',
    borderRadius: 20, padding: '1px 7px', fontWeight: 500,
  },
  sidebarFooter: { paddingTop: 16, borderTop: '1px solid var(--border)' },
  footerRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 },
  footerDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 },
  footerLabel: { fontSize: 12, fontWeight: 500, color: 'var(--ink2)' },
  footerSub: { fontSize: 11, color: 'var(--ink3)' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 32px', borderBottom: '1px solid var(--border)',
    background: 'var(--surface)',
  },
  headerTitle: { fontFamily: 'var(--head)', fontSize: 22, fontStyle: 'italic', fontWeight: 400 },
  headerRight: { display: 'flex', gap: 12 },
  headerDate: { fontSize: 12, color: 'var(--ink3)' },
  content: { flex: 1, padding: '32px', overflowY: 'auto' },
}
