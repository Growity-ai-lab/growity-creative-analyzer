import modal
import os
import tempfile
import time
import uuid

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "git")
    .pip_install(
        "tribev2[plotting] @ git+https://github.com/facebookresearch/tribev2.git",
        "fastapi",
        "python-multipart",
        "psycopg2-binary",
        "numpy",
        "Pillow",
        "ffmpeg-python",
    )
)

app = modal.App("growity-creative-analyzer", image=image)

hf_secret   = modal.Secret.from_name("huggingface-token")
neon_secret = modal.Secret.from_name("neon-credentials")

model_cache = modal.Volume.from_name("tribe-model-cache", create_if_missing=True)
upload_vol  = modal.Volume.from_name("tribe-uploads",     create_if_missing=True)

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

def image_to_video(image_path: str, duration: int = 4) -> str:
    import ffmpeg, os
    out_path = os.path.splitext(image_path)[0] + "_converted.mp4"
    (
        ffmpeg
        .input(image_path, loop=1, t=duration, framerate=25)
        .filter('scale', 'trunc(iw/2)*2', 'trunc(ih/2)*2')
        .output(out_path, vcodec="libx264", r=25, pix_fmt="yuv420p")
        .overwrite_output()
        .run(quiet=False, capture_stdout=True, capture_stderr=True)
    )
    return out_path

def compute_roi_scores(preds):
    import numpy as np
    n_vertices = preds.shape[1]
    half = n_vertices // 2
    rois = {
        "visual_cortex":  (0,                 int(half * 0.15)),
        "ventral_visual": (int(half * 0.15),  int(half * 0.30)),
        "dorsal_visual":  (int(half * 0.30),  int(half * 0.45)),
        "prefrontal":     (int(half * 0.45),  int(half * 0.65)),
        "auditory":       (int(half * 0.65),  int(half * 0.80)),
        "language":       (int(half * 0.80),  half),
    }
    scores = {}
    mean_activation = np.mean(np.abs(preds))
    for roi_name, (start, end) in rois.items():
        roi_activation = np.mean(np.abs(preds[:, start:end]))
        scores[roi_name] = round(float(roi_activation / mean_activation) * 50, 1)
    scores["attention_score"] = round(min(100, float(np.mean(np.abs(preds))) * 200), 1)
    return scores

def db_connect():
    import psycopg2
    return psycopg2.connect(os.environ["NEON_CONNECTION_STRING"])

def db_update_job(job_id, status, roi_scores=None, n_timesteps=None,
                  processing_seconds=None, error=None):
    import json as _json
    conn = db_connect()
    cur = conn.cursor()
    cur.execute(
        """UPDATE analyses SET status=%s, roi_scores=%s, n_timesteps=%s,
               processing_seconds=%s, error_message=%s
           WHERE job_id=%s""",
        (status, _json.dumps(roi_scores) if roi_scores else None,
         n_timesteps, processing_seconds, error, job_id)
    )
    conn.commit(); cur.close(); conn.close()

@app.function(
    gpu="A10G",
    timeout=1800,
    volumes={"/cache": model_cache, "/uploads": upload_vol},
    secrets=[hf_secret, neon_secret],
    memory=32768,
)
def run_inference(job_id, file_path, file_suffix):
    import numpy as np
    start_time = time.time()
    try:
        db_update_job(job_id, "running")
        model = get_model()
        if file_suffix in {".jpg", ".jpeg", ".png"}:
            video_path = image_to_video(file_path)
            df = model.get_events_dataframe(video_path=video_path)
        elif file_suffix in {".mp4", ".mov", ".avi"}:
            df = model.get_events_dataframe(video_path=file_path)
        elif file_suffix in {".mp3", ".wav"}:
            df = model.get_events_dataframe(audio_path=file_path)
        preds, _ = model.predict(events=df)
        arr = preds.numpy() if hasattr(preds, "numpy") else preds
        roi_scores = compute_roi_scores(arr)
        elapsed = round(time.time() - start_time, 1)
        db_update_job(job_id, "success", roi_scores=roi_scores,
                      n_timesteps=int(arr.shape[0]), processing_seconds=elapsed)
    except Exception as e:
        db_update_job(job_id, "failed", error=str(e))
        raise

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

web_app = FastAPI(title="Growity Creative Analyzer API")
web_app.add_middleware(CORSMiddleware, allow_origins=["*"],
                       allow_methods=["*"], allow_headers=["*"])

@app.function(
    timeout=300,
    volumes={"/uploads": upload_vol},
    secrets=[hf_secret, neon_secret],
    memory=512,
)
@modal.asgi_app()
def fastapi_app():
    return web_app

@web_app.post("/analyze/start")
async def analyze_start(
    file: UploadFile = File(...),
    creative_name: str = Form(...),
    client_name: str = Form(""),
    notes: str = Form(""),
):
    suffix = os.path.splitext(file.filename)[1].lower()
    allowed = {".mp4", ".mov", ".avi", ".jpg", ".jpeg", ".png", ".mp3", ".wav"}
    if suffix not in allowed:
        raise HTTPException(400, f"Desteklenmeyen format: {suffix}")
    job_id = str(uuid.uuid4())
    file_path = f"/uploads/{job_id}{suffix}"
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    await upload_vol.commit.aio()
    import json as _json
    conn = db_connect()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO analyses
           (job_id, creative_name, client_name, notes, file_type, status)
           VALUES (%s,%s,%s,%s,%s,'pending')""",
        (job_id, creative_name, client_name, notes, suffix)
    )
    conn.commit(); cur.close(); conn.close()
    await run_inference.spawn.aio(job_id, file_path, suffix)
    return {"job_id": job_id, "status": "pending"}

@web_app.get("/analyze/status/{job_id}")
async def analyze_status(job_id: str):
    import json as _json
    conn = db_connect()
    cur = conn.cursor()
    cur.execute(
        """SELECT status, roi_scores, n_timesteps, processing_seconds, error_message
           FROM analyses WHERE job_id=%s""", (job_id,)
    )
    row = cur.fetchone(); cur.close(); conn.close()
    if not row:
        raise HTTPException(404, "Job bulunamadı")
    status, roi_scores, n_timesteps, processing_seconds, error_message = row
    if isinstance(roi_scores, str):
        roi_scores = _json.loads(roi_scores)
    return {
        "job_id": job_id, "status": status, "roi_scores": roi_scores,
        "n_timesteps": n_timesteps,
        "processing_seconds": float(processing_seconds) if processing_seconds else None,
        "error_message": error_message,
    }

@web_app.get("/analyses")
async def get_analyses(limit: int = 50):
    import json as _json
    conn = db_connect()
    cur = conn.cursor()
    cur.execute(
        """SELECT id, created_at, job_id, creative_name, client_name,
                  notes, file_type, roi_scores, n_timesteps, processing_seconds, status
           FROM analyses ORDER BY created_at DESC LIMIT %s""", (limit,)
    )
    rows = cur.fetchall()
    cols = ["id","created_at","job_id","creative_name","client_name",
            "notes","file_type","roi_scores","n_timesteps","processing_seconds","status"]
    cur.close(); conn.close()
    result = []
    for row in rows:
        item = dict(zip(cols, row))
        item["id"] = str(item["id"])
        item["created_at"] = item["created_at"].isoformat() if item["created_at"] else None
        if isinstance(item["roi_scores"], str):
            item["roi_scores"] = _json.loads(item["roi_scores"])
        if item["processing_seconds"]:
            item["processing_seconds"] = float(item["processing_seconds"])
        result.append(item)
    return result

@web_app.get("/health")
async def health():
    return {"status": "ok"}
