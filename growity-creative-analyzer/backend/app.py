import modal
import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import tempfile
import json
import time

# ---------------------------------------------------------------------------
# Modal image: GPU + tüm bağımlılıklar
# ---------------------------------------------------------------------------
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "git")
    .pip_install(
        "tribev2[plotting] @ git+https://github.com/facebookresearch/tribev2.git",
        "fastapi",
        "python-multipart",
        "supabase",
        "numpy",
        "Pillow",
        "ffmpeg-python",
    )
)

app = modal.App("growity-creative-analyzer", image=image)

# HuggingFace token secret (Modal dashboard'dan ekleyeceksin)
hf_secret = modal.Secret.from_name("huggingface-token")
supabase_secret = modal.Secret.from_name("supabase-credentials")

# ---------------------------------------------------------------------------
# Model cache volume (her çalışmada tekrar indirmesin)
# ---------------------------------------------------------------------------
model_cache = modal.Volume.from_name("tribe-model-cache", create_if_missing=True)

# ---------------------------------------------------------------------------
# Web endpoint
# ---------------------------------------------------------------------------
web_app = FastAPI(title="Growity Creative Analyzer API")

web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Render deploy sonrası frontend URL ile kısıtla
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.function(
    gpu="A10G",           # A100 yerine A10G: daha ucuz, bu iş için yeterli
    timeout=300,
    volumes={"/cache": model_cache},
    secrets=[hf_secret, supabase_secret],
    memory=32768,
)
@modal.asgi_app()
def fastapi_app():
    return web_app


# ---------------------------------------------------------------------------
# Model yükleyici (singleton, soğuk start'ta bir kez çalışır)
# ---------------------------------------------------------------------------
_model = None

def get_model():
    global _model
    if _model is None:
        from tribev2 import TribeModel
        _model = TribeModel.from_pretrained(
            "facebook/tribev2",
            cache_folder="/cache/tribev2"
        )
    return _model


# ---------------------------------------------------------------------------
# Yardımcı: Statik görsel → kısa video
# ---------------------------------------------------------------------------
def image_to_video(image_path: str, duration: int = 4) -> str:
    import ffmpeg
    out_path = image_path.replace(".jpg", ".mp4").replace(".png", ".mp4").replace(".jpeg", ".mp4")
    (
        ffmpeg
        .input(image_path, loop=1, t=duration)
        .output(out_path, vcodec="libx264", r=25, pix_fmt="yuv420p")
        .overwrite_output()
        .run(quiet=True)
    )
    return out_path


# ---------------------------------------------------------------------------
# ROI skorları: beyin bölgelerini anlamlı metriğe çevir
# ---------------------------------------------------------------------------
def compute_roi_scores(preds):
    """
    preds: (n_timesteps, ~20480 vertex) numpy array
    fsaverage5 vertex indekslerine göre yaklaşık ROI ataması.
    Gerçek ROI analizi için utils_fmri.py kullanılabilir.
    """
    import numpy as np

    n_vertices = preds.shape[1]
    half = n_vertices // 2  # sol / sağ hemisfer

    # Yaklaşık korteks bölgeleri (fsaverage5, sol hemisfer vertex aralıkları)
    # Gerçek araştırmada nilearn atlas kullanılır; burada hızlı yaklaşım
    rois = {
        "visual_cortex":    (0,    int(half * 0.15)),   # V1/V2/V3
        "ventral_visual":   (int(half * 0.15), int(half * 0.30)),  # fusiform
        "dorsal_visual":    (int(half * 0.30), int(half * 0.45)),  # parietal
        "prefrontal":       (int(half * 0.45), int(half * 0.65)),  # PFC
        "auditory":         (int(half * 0.65), int(half * 0.80)),  # temporal
        "language":         (int(half * 0.80), half),              # Broca/Wernicke
    }

    scores = {}
    mean_activation = np.mean(np.abs(preds))  # normalize için

    for roi_name, (start, end) in rois.items():
        roi_activation = np.mean(np.abs(preds[:, start:end]))
        scores[roi_name] = round(float(roi_activation / mean_activation) * 50, 1)

    # Genel "attention score" (0-100)
    scores["attention_score"] = round(
        min(100, float(np.mean(np.abs(preds))) * 200), 1
    )
    return scores


# ---------------------------------------------------------------------------
# Ana analiz endpoint'i
# ---------------------------------------------------------------------------
@web_app.post("/analyze")
async def analyze_creative(
    file: UploadFile = File(...),
    creative_name: str = Form(...),
    client_name: str = Form(""),
    notes: str = Form(""),
):
    import numpy as np

    start_time = time.time()

    # Dosyayı geçici konuma kaydet
    suffix = os.path.splitext(file.filename)[1].lower()
    allowed = {".mp4", ".mov", ".avi", ".jpg", ".jpeg", ".png", ".mp3", ".wav"}
    if suffix not in allowed:
        raise HTTPException(400, f"Desteklenmeyen format: {suffix}")

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        model = get_model()

        # Format'a göre input hazırla
        if suffix in {".jpg", ".jpeg", ".png"}:
            video_path = image_to_video(tmp_path)
            df = model.get_events_dataframe(video_path=video_path)
        elif suffix in {".mp4", ".mov", ".avi"}:
            df = model.get_events_dataframe(video_path=tmp_path)
        elif suffix in {".mp3", ".wav"}:
            df = model.get_events_dataframe(audio_path=tmp_path)

        preds, segments = model.predict(events=df)
        preds_array = preds if isinstance(preds, np.ndarray) else preds.numpy()

        roi_scores = compute_roi_scores(preds_array)
        elapsed = round(time.time() - start_time, 1)

        result = {
            "creative_name": creative_name,
            "client_name": client_name,
            "notes": notes,
            "file_type": suffix,
            "roi_scores": roi_scores,
            "n_timesteps": int(preds_array.shape[0]),
            "processing_seconds": elapsed,
            "status": "success",
        }

        # Supabase'e kaydet
        try:
            from supabase import create_client
            sb = create_client(
                os.environ["SUPABASE_URL"],
                os.environ["SUPABASE_KEY"],
            )
            sb.table("analyses").insert(result).execute()
        except Exception as e:
            result["supabase_warning"] = str(e)

        return result

    finally:
        os.unlink(tmp_path)


@web_app.get("/health")
async def health():
    return {"status": "ok"}
