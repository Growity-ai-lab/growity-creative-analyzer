# Growity Creative Analyzer

TRIBE v2 tabanlı kreatif beyin aktivasyon analiz sistemi.

## Mimari

​```
GitHub → Modal (GPU/TRIBE v2 API) ←→ Neon.tech (PostgreSQL)
                    ↑
         Render (React Frontend)
​```

## Kurulum

### 1. Neon — Veritabanı

1. [neon.tech](https://neon.tech) → GitHub ile giriş → New Project → `growity-creative-analyzer`
2. Dashboard → **SQL Editor** → `neon_schema.sql` içeriğini yapıştır → **Run**
3. Dashboard → **Connection Details** → connection string'i kopyala

### 2. Modal — GPU Backend

​```bash
pip install modal
modal setup

modal secret create huggingface-token \
  HF_TOKEN=hf_SENIN_TOKENIN

modal secret create neon-credentials \
  NEON_CONNECTION_STRING="postgresql://neondb_owner:SIFRE@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require"

cd backend
modal deploy app.py
​```

HuggingFace token → [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) → New token (Read). LLaMA 3.2 onayı geldikten sonra yap.

### 3. Render — Frontend

1. render.com → **New** → **Static Site** → GitHub repo bağla
2. Root directory: `frontend`
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Environment variable ekle: `VITE_MODAL_API_URL` = Modal URL

### 4. CORS (deploy sonrası)

`backend/app.py` içinde:
​```python
allow_origins=["https://growity-creative-analyzer.onrender.com"],
​```
Sonra `modal deploy app.py` ile tekrar deploy et.

## Desteklenen Formatlar

| Format | İşlem |
|--------|-------|
| JPG / PNG | ffmpeg ile 4 saniyelik videoya çevrilir |
| MP4 / MOV | Direkt işlenir |
| MP3 / WAV | Ses analizi |

## ROI Skorları

| Bölge | Açıklama |
|-------|----------|
| Görsel Korteks | Temel görsel işleme (V1/V2/V3) |
| Ventral Görsel | Nesne/yüz tanıma (fusiform) |
| Dorsal Görsel | Uzamsal ilişkiler (parietal) |
| Prefrontal | Karar verme, dikkat |
| İşitsel | Ses işleme (temporal lob) |
| Dil | Metin/anlam (Broca/Wernicke) |
| **Dikkat Skoru** | Genel aktivasyon özeti (0–100) |
