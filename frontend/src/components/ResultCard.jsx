import { useState } from 'react'

const ROI_LABELS = {
  visual_cortex:  'Görsel Etki',
  ventral_visual: 'Duygusal Bağ',
  dorsal_visual:  'Dinamizm',
  prefrontal:     'İkna Gücü',
  auditory:       'Ses & Ton',
  language:       'Mesaj Netliği',
}

const ROI_DESCRIPTIONS = {
  visual_cortex:  'Kreatifinizin görsel olarak ne kadar dikkat çektiğini ölçer.',
  ventral_visual: 'İzleyicinin kreatifinizle duygusal bağ kurma gücünü ölçer.',
  dorsal_visual:  'Kreatifinizin ne kadar dinamik ve enerjik hissettirdiğini ölçer.',
  prefrontal:     'Mesajınızın ne kadar ikna edici ve harekete geçirici olduğunu ölçer.',
  auditory:       'Ses, müzik ve anlatımın mesajı ne kadar güçlendirdiğini ölçer.',
  language:       'Slogan, metin ve anlatının ne kadar net ve akılda kalıcı olduğunu ölçer.',
}

const ROI_INSIGHTS = {
  visual_cortex: {
    high: 'Kreatifiniz görsel olarak güçlü bir ilk izlenim yaratıyor. Renk, kompozisyon ve görsel hiyerarşi bir arada iyi çalışıyor. Bu görsel dili diğer format ve boyutlara tutarlı şekilde taşıyın.',
    mid:  'Kreatifiniz fark edilir ama rakip kreatiflerin arasında kaybolma riski var. Arka plan–ön plan kontrastını artırmak, ürünü veya mesajı daha belirgin konumlandırmak ilk bakışta yakalanma oranını yükseltir.',
    low:  'Kreatifiniz şu haliyle yeterince ayırt edici değil. Cesur bir renk kararı, dramatik bir kompozisyon değişikliği veya beklenmedik bir görsel unsur eklemek gerekiyor. İzleyicinin feed\'inde durup bakmasını sağlayacak tek bir güçlü görsel moment belirleyin.',
  },
  ventral_visual: {
    high: 'İzleyici kreatifinizle duygusal bağ kuruyor — bu marka hatırlanırlığı için kritik. İnsan unsuru veya empati yaratan hikaye yapısı güçlü çalışıyor. Bu duygusal çekirdeği diğer kreatif varyantlarda koruyun.',
    mid:  'Duygusal bağ potansiyeli var ama tam açılmıyor. Talent kullanıyorsanız yüze daha uzun süre odaklanan çekimler ekleyin. Kullanmıyorsanız ürünü bir insan bağlamında — bir el, bir an, bir his — gösterin.',
    low:  'Kreatifiniz izleyicide yeterli duygusal tepki uyandırmıyor. En hızlı çözüm: gerçek bir insan yüzü veya ürünü kullanan biri. Soyut ve yalnızca ürün odaklı kreatiflerde duygusal bağ kurmak çok daha zor, hafıza izi çok daha zayıf kalır.',
  },
  dorsal_visual: {
    high: 'Kreatif dinamik ve enerjik hissettiriyor. Hareket ve ritim izleyiciyi aktif tutuyor — özellikle sosyal medyada bu avantaj. Bu enerjiyi kampanyanın diğer dokunma noktalarına taşıyın.',
    mid:  'Ritim tutarlı ama ivme eksik. Kurgu temposunu biraz artırmak, kamera hareketine dinamizm katmak ya da ürünü harekette göstermek seyirciyi baştan sona taşır. Durağan sahneleri kısaltın.',
    low:  'Kreatif durağan — izleyicinin gözü takip edecek bir hareket noktası bulamıyor. Statik kreatiflerde bile belirgin bir odak noktası, net bir görsel akış veya minimal animasyon bu sorunu çözer.',
  },
  prefrontal: {
    high: 'Mesajınız net ve harekete geçirici. İzleyici "neden bu markayı tercih etmeliyim?" sorusuna yanıt buluyor. Bu netliği tüm iletişimde koruyun — CTA\'yı seyreltmeyin.',
    mid:  'Mesaj anlaşılıyor ama harekete geçirmiyor. CTA daha erken ve daha belirgin konumlandırılabilir. Faydayı somutlaştırın: rakam, garanti, karşılaştırma veya sosyal kanıt eklemek karar verme sürecini hızlandırır.',
    low:  'İzleyici ne yapması gerektiğini bilmiyor. Tek ve net bir CTA, somut bir fayda ifadesi ve şimdi harekete geçmesi için bir neden eksik. Her üçünü aynı anda vermek zorunda değilsiniz — ama en az biri çok güçlü olmalı.',
  },
  auditory: {
    high: 'Ses katmanı kreatifi tamamlıyor ve mesajı pekiştiriyor. Müzik seçimi veya voiceover tonu marka karakteriyle uyumlu çalışıyor. Sesi kapatıp yalnızca görsel izlendiğinde de mesaj iletiliyorsa mükemmel.',
    mid:  'Ses var ama mesajı taşımıyor. Voiceover varsa daha özgün ve sıcak bir ton deneyin — okuma gibi değil, konuşma gibi. Müzik varsa daha belirgin bir giriş momenti mesajla senkronize edilebilir.',
    low:  'Ses stratejisi eksik veya etkisiz. Sosyal medyada içerikler çoğunlukla sessiz başlıyor — ilk 3 saniyede yalnızca görsel ve metinle mesajınızı iletebiliyor musunuz? Bunu önce çözün, ardından ses katmanını güçlendirin.',
  },
  language: {
    high: 'Mesaj dili güçlü ve akılda kalıcı. Slogan, başlık veya anlatı izleyicinin zihninde yer açıyor. Bu dil tutarlılığını tüm kampanya materyallerinde koruyun — farklı formatlarda aynı çekirdek mesaj.',
    mid:  'Mesaj var ama sıradan. Daha özgün bir dil, beklenmedik bir kelime seçimi veya izleyiciyle doğrudan konuşan bir ton sloganı hatırlanabilir kılar. "Kaliteli ürün" değil, "farkı ilk kullanışta hissedersiniz" gibi.',
    low:  'Kreatifte güçlü bir dil unsuru yok. Şunu sorun: Bu slogan yalnızca sizin markanıza mı ait, yoksa rakip marka logosu koysan da geçer mi? Eğer ikincisiyse yeniden yazmanız gerekiyor.',
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

const FORMAT_PRIORITY = {
  feed_image:  ['visual_cortex','ventral_visual','language'],
  story_reels: ['dorsal_visual','visual_cortex','auditory'],
  feed_video:  ['dorsal_visual','ventral_visual','language'],
  tvc:         ['ventral_visual','auditory','prefrontal'],
  bumper:      ['visual_cortex','language','prefrontal'],
  ooh:         ['visual_cortex','language'],
}

const ROI_REGIONS = {
  visual_cortex:  { cx:200, cy:248, rx:52, ry:26 },
  ventral_visual: { cx:155, cy:224, rx:36, ry:20 },
  dorsal_visual:  { cx:200, cy:108, rx:44, ry:24 },
  prefrontal:     { cx:200, cy:76,  rx:34, ry:18 },
  auditory:       { cx:118, cy:175, rx:32, ry:18 },
  language:       { cx:138, cy:140, rx:36, ry:20 },
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
          .breg { cursor:pointer; }
          .breg ellipse { transition: all .2s; }
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
        const delay = { visual_cortex:0, ventral_visual:.4, dorsal_visual:.2, prefrontal:.6, auditory:.8, language:1 }[key] || 0
        return (
          <g key={key} className="breg bpulse" style={{ animationDelay: `${delay}s` }} onClick={() => onSelect(key)}>
            {isActive && <circle cx={reg.cx} cy={reg.cy} r="0" fill="none" stroke={col} strokeWidth="1.5" className="bripple" />}
            <ellipse cx={reg.cx} cy={reg.cy}
              rx={isActive ? reg.rx + 4 : reg.rx} ry={isActive ? reg.ry + 3 : reg.ry}
              fill={col} fillOpacity={isActive ? 0.95 : scoreAlpha(v)}
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
      <g className="breg bpulse" style={{ animationDelay: '.8s' }} onClick={() => onSelect('auditory')}>
        <ellipse cx="282" cy="175" rx="32" ry="18"
          fill={scoreBg(scores.auditory ?? 0)} fillOpacity={scoreAlpha(scores.auditory ?? 0)} />
        <text x="282" y="179" textAnchor="middle" fontSize="9" fontFamily="system-ui,sans-serif"
          fontWeight="500" fill="#444" style={{ pointerEvents:'none' }}>Ses</text>
      </g>
      <text x="200" y="308" textAnchor="middle" fontSize="10" fontFamily="system-ui,sans-serif" fill="#bbb">
        Bölgeye tıkla → detay
      </text>
    </svg>
  )
}

export default function ResultCard({ result, creative, client, format }) {
  const scores = result.roi_scores || {}
  const att    = scores.attention_score ?? 0
  const al     = attLabel(att)
  const [active, setActive] = useState(null)

  const priority = format ? FORMAT_PRIORITY[format] || [] : []

  const activeInsight = active
    ? ROI_INSIGHTS[active]?.[scoreLevel(scores[active] ?? 0)]
    : null

  const generalText = att >= 60
    ? 'Kreatif güçlü performans gösteriyor. Yayına alınmaya hazır — farklı hedef kitlelerde veya formatlarda A/B testi yaparak en iyi varyantı belirleyin ve ölçeklendirin.'
    : att >= 35
    ? 'Kreatif çalışıyor ama potansiyelinin altında. En düşük skoru olan tek bir unsuru değiştirin, tekrar test edin. Tüm kreatiifi yeniden yazmak yerine cerrahi müdahaleler daha hızlı sonuç verir.'
    : 'Kreatif şu haliyle yeterli aktivasyon yaratmıyor. Önce hedef kitleyle hızlı bir kavram testi yapılmasını öneririz. Duygusal bağ, net mesaj ve ses — bu üç unsur öncelikli müdahale alanı. Bütçeyi bu haliyle ölçeklendirmekten kaçının.'

  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <div>
          <div style={s.cardTitle}>{creative}</div>
          <div style={s.cardMeta}>
            {client && <span>{client}</span>}
            {client && format && <span style={{ color:'var(--border2)' }}> · </span>}
            {format && <span style={s.formatTag}>{FORMAT_LABELS[format]}</span>}
          </div>
        </div>
        <div style={s.attBox}>
          <div style={{ ...s.attScore, color: al.color }}>{att.toFixed(1)}</div>
          <div style={{ ...s.attLabel, color: al.color }}>{al.text}</div>
          <div style={s.attMeta}>dikkat skoru</div>
        </div>
      </div>

      {priority.length > 0 && (
        <div style={s.priorityBar}>
          <span style={s.priorityLabel}>Bu format için öncelikli:</span>
          {priority.map(k => (
            <span key={k} style={{
              ...s.priorityChip,
              background: scoreColor(scores[k]) + '18',
              color: scoreColor(scores[k]),
              borderColor: scoreColor(scores[k]) + '40',
            }}>
              {ROI_LABELS[k]}
            </span>
          ))}
        </div>
      )}

      <div style={s.section}>
        <div style={s.sectionTitle}>Kreatif performans analizi</div>
        <div style={s.vizRow}>
          <div style={s.brainCol}>
            <BrainMap scores={scores} active={active} onSelect={k => setActive(active === k ? null : k)} />
            {active && (
              <div style={s.popup}>
                <div style={{ fontSize: 11, fontWeight: 700, color: scoreColor(scores[active]), letterSpacing: '.03em', textTransform: 'uppercase', marginBottom: 3 }}>
                  {ROI_LABELS[active]}
                </div>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>
                  {ROI_DESCRIPTIONS[active]}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.65 }}>
                  {activeInsight}
                </div>
              </div>
            )}
          </div>

          <div style={s.barCol}>
            {Object.entries(ROI_LABELS).map(([key, label]) => {
              const val = scores[key] ?? 0
              const pct = Math.min(100, (val / 70) * 100)
              const isActive = active === key
              const isPriority = priority.includes(key)
              return (
                <div key={key}
                  style={{ ...s.barRow, ...(isActive ? s.barRowActive : {}), ...(isPriority ? s.barRowPriority : {}) }}
                  onClick={() => setActive(active === key ? null : key)}
                >
                  <div style={{ ...s.barLabel, ...(isPriority ? { fontWeight:600, color:'var(--ink)' } : {}) }}>
                    {label}
                    {isPriority && <span style={s.priorityStar}>★</span>}
                  </div>
                  <div style={s.barTrack}>
                    <div style={{ ...s.barFill, width: `${pct}%`, background: scoreColor(val) }} />
                  </div>
                  <div style={{ ...s.barVal, color: scoreColor(val) }}>{val.toFixed(1)}</div>
                </div>
              )
            })}
            <div style={s.legend}>
              <span style={{ color:'#2d7a4f' }}>● Güçlü (&gt;55)</span>
              <span style={{ color:'#d4780a' }}>● Orta (42–55)</span>
              <span style={{ color:'#c0392b' }}>● Zayıf (&lt;42)</span>
            </div>
          </div>
        </div>
      </div>

      <div style={s.section}>
        <div style={s.sectionTitle}>Öncelikli aksiyon alanları</div>
        <div style={s.insights}>
          {Object.entries(scores)
            .filter(([k]) => k !== 'attention_score')
            .sort((a, b) => b[1] - a[1])
            .slice(0, 1)
            .map(([key]) => (
              <div key={key} style={{ ...s.insightRow, borderLeftColor: '#2d7a4f' }}>
                <span style={{ ...s.insightTag, color: '#2d7a4f' }}>Güçlü</span>
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
                <span style={{ ...s.insightTag, color: '#c0392b' }}>Geliştir</span>
                <span style={s.insightText}>{ROI_INSIGHTS[key]?.low}</span>
              </div>
            ))
          }
          <div style={{ ...s.insightRow, borderLeftColor: '#e0ddd6' }}>
            <span style={{ ...s.insightTag, color: 'var(--ink2)' }}>Sonuç</span>
            <span style={s.insightText}>{generalText}</span>
          </div>
        </div>
      </div>

      <div style={s.meta}>
        <span>{result.n_timesteps} zaman adımı analiz edildi</span>
        <span>·</span>
        <span>{result.processing_seconds?.toFixed(0)}s işlem süresi</span>
        <span>·</span>
        <span>TRIBE v2 by Meta AI</span>
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
  cardMeta: { fontSize: 12, color: 'var(--ink3)', display:'flex', alignItems:'center', gap:4, marginTop:2 },
  formatTag: { fontSize:11, fontWeight:600, color:'var(--ink2)', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:4, padding:'1px 6px' },
  priorityBar: {
    display:'flex', alignItems:'center', gap:8, flexWrap:'wrap',
    padding:'10px 24px', background:'var(--bg)', borderBottom:'1px solid var(--border)',
    fontSize:11,
  },
  priorityLabel: { color:'var(--ink3)', fontWeight:500, flexShrink:0 },
  priorityChip: {
    fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:4,
    border:'1px solid', letterSpacing:'.02em',
  },
  barRowPriority: { background:'#fafaf8' },
  priorityStar: { color:'#d4780a', fontSize:10, marginLeft:3 },
  attBox: { textAlign: 'right' },
  attScore: { fontFamily: 'var(--head)', fontSize: 28, fontStyle: 'italic', lineHeight: 1 },
  attLabel: { fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', marginTop: 2 },
  attMeta: { fontSize: 11, color: 'var(--ink3)', marginTop: 1 },
  section: { padding: '20px 24px', borderBottom: '1px solid var(--border)' },
  sectionTitle: { fontSize: 11, fontWeight: 500, color: 'var(--ink3)', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 14 },
  vizRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' },
  brainCol: { display: 'flex', flexDirection: 'column', gap: 10 },
  popup: {
    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6,
    padding: '12px 14px',
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
    borderLeft: '3px solid',
  },
  insightTag: { fontSize: 11, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', minWidth: 52, paddingTop: 1, flexShrink: 0 },
  insightText: { fontSize: 12, color: 'var(--ink)', lineHeight: 1.65 },
  meta: { padding: '10px 24px', display: 'flex', gap: 8, fontSize: 11, color: 'var(--ink3)', background: 'var(--bg)', flexWrap: 'wrap' },
}
