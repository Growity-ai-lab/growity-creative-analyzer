// Tüm veri okuma işlemleri Modal backend üzerinden geçer
// (Neon'a direkt tarayıcıdan bağlanılamaz — SSL/auth gerektirir)

const MODAL_API = import.meta.env.VITE_MODAL_API_URL

export async function fetchAnalyses(limit = 50) {
  const res = await fetch(`${MODAL_API}/analyses?limit=${limit}`)
  if (!res.ok) throw new Error(`API hatası: ${res.status}`)
  return res.json()
}
