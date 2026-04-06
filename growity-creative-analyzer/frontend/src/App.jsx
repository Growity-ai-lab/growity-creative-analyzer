import { useState, useEffect } from 'react'
import UploadPanel from './components/UploadPanel.jsx'
import HistoryPanel from './components/HistoryPanel.jsx'
import ComparePanel from './components/ComparePanel.jsx'
import { fetchAnalyses } from './lib/supabase.js'

const NAV = [
  { id: 'upload',  label: 'Analiz Et' },
  { id: 'history', label: 'Geçmiş' },
  { id: 'compare', label: 'Karşılaştır' },
]

export default function App() {
  const [tab, setTab] = useState('upload')
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastResult, setLastResult] = useState(null)

  const reload = async () => {
    try {
      const data = await fetchAnalyses()
      setAnalyses(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [])

  const onAnalysisComplete = (result) => {
    setLastResult(result)
    reload()
  }

  return (
    <div style={styles.shell}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoMark}>G</span>
          <div>
            <div style={styles.logoName}>Growity</div>
            <div style={styles.logoSub}>Creative Analyzer</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {NAV.map(n => (
            <button
              key={n.id}
              style={{ ...styles.navBtn, ...(tab === n.id ? styles.navActive : {}) }}
              onClick={() => setTab(n.id)}
            >
              {n.label}
              {n.id === 'history' && analyses.length > 0 && (
                <span style={styles.badge}>{analyses.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.footerDot} />
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>TRIBE v2 powered</span>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.topbar}>
          <h1 style={styles.pageTitle}>{NAV.find(n => n.id === tab)?.label}</h1>
          <div style={styles.topbarRight}>
            <span style={styles.modelBadge}>Model: TRIBE v2</span>
          </div>
        </div>

        <div style={styles.content}>
          {tab === 'upload'  && <UploadPanel onComplete={onAnalysisComplete} lastResult={lastResult} />}
          {tab === 'history' && <HistoryPanel analyses={analyses} loading={loading} onRefresh={reload} />}
          {tab === 'compare' && <ComparePanel analyses={analyses} />}
        </div>
      </main>
    </div>
  )
}

const styles = {
  shell: {
    display: 'flex', minHeight: '100vh',
  },
  sidebar: {
    width: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', padding: '28px 16px',
    position: 'sticky', top: 0, height: '100vh',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40,
  },
  logoMark: {
    width: 36, height: 36, background: 'var(--accent)', borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 18, color: '#fff',
    flexShrink: 0,
  },
  logoName: {
    fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, color: 'var(--text)',
  },
  logoSub: {
    fontSize: 11, color: 'var(--muted)', marginTop: 1,
  },
  nav: {
    display: 'flex', flexDirection: 'column', gap: 4, flex: 1,
  },
  navBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 14px', borderRadius: 8, border: 'none',
    background: 'transparent', color: 'var(--muted)', fontSize: 14,
    fontWeight: 500, transition: 'all .15s', textAlign: 'left',
  },
  navActive: {
    background: 'var(--surface2)', color: 'var(--text)',
    borderLeft: '3px solid var(--accent)', paddingLeft: 11,
  },
  badge: {
    background: 'var(--accent)', color: '#fff', borderRadius: 20,
    fontSize: 11, padding: '1px 7px', fontWeight: 600,
  },
  sidebarFooter: {
    display: 'flex', alignItems: 'center', gap: 8, paddingTop: 16,
    borderTop: '1px solid var(--border)',
  },
  footerDot: {
    width: 8, height: 8, borderRadius: '50%', background: 'var(--success)',
    boxShadow: '0 0 6px #4ade80',
  },
  main: {
    flex: 1, display: 'flex', flexDirection: 'column',
  },
  topbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 32px', borderBottom: '1px solid var(--border)',
    background: 'var(--surface)',
  },
  pageTitle: {
    fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20,
    color: 'var(--text)',
  },
  topbarRight: { display: 'flex', gap: 12, alignItems: 'center' },
  modelBadge: {
    fontSize: 12, color: 'var(--muted)', background: 'var(--surface2)',
    border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px',
  },
  content: {
    flex: 1, padding: '32px', overflowY: 'auto',
  },
}
