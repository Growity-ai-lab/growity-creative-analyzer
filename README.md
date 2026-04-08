# Growity Creative Analyzer

TRIBE v2 tabanlı kreatif beyin aktivasyon analiz sistemi.

## Mimari

```
GitHub → Modal (GPU/TRIBE v2 API) ←→ Supabase (DB)
                    ↑
         Render (React Frontend)
```

## Kurulum

### 1. Modal Backend

```bash
cd backend
pip install modal
modal setup          # tarayıcıda login
modal secret create huggingface-token HF_TOKEN=hf_xxxxx
modal secret create supabase-credentials \
  SUPABASE_URL=https://xxx.supabase.co \
  SUPABASE_KEY=your-service-role-key

# Deploy
modal deploy app.py
# → URL alacaksın: https://xxx--growity-creative-analyzer-fastapi-app.modal.run
```

### 2. Supabase

Supabase dashboard > SQL Editor'da `supabase_schema.sql` dosyasını çalıştır.

### 3. Frontend (Render)

1. Render.com > New > Static Site
2. GitHub repo bağla, Root directory: `frontend`
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Environment variables ekle:
   - `VITE_MODAL_API_URL` = Modal deploy URL'i
   - `VITE_SUPABASE_URL` = Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = Supabase anon key

### 4. HuggingFace (LLaMA 3.2 erişimi)

HuggingFace token'ını Modal secret olarak ekledikten sonra
meta-llama/Llama-3.2-3B için access request doldur.

## Desteklenen Formatlar

| Format | İşlem |
|--------|-------|
| JPG/PNG | → ffmpeg ile 4s video'ya çevrilir |
| MP4/MOV | Direkt işlenir |
| MP3/WAV | Ses analizi |

## ROI Skorları

- **Görsel Korteks** — Temel görsel işleme (V1/V2/V3)
- **Ventral Görsel** — Nesne/yüz tanıma (fusiform)
- **Dorsal Görsel** — Uzamsal ilişkiler (parietal)
- **Prefrontal** — Karar verme, dikkat
- **İşitsel** — Ses işleme (temporal)
- **Dil** — Metin/anlam işleme (Broca/Wernicke)
- **Dikkat Skoru** — Genel aktivasyon özeti (0-100)
