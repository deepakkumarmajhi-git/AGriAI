from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import random

from pathlib import Path
import numpy as np
import joblib
from pydantic import BaseModel

app = FastAPI()

# -------------------------
# Soil Analysis (Crop Recommendation) - NEW
# -------------------------

BASE = Path(__file__).resolve().parent
MODEL_DIR = BASE / "models"

CROP_MODEL_PATH = MODEL_DIR / "soil_model.pkl"
CROP_ENCODER_PATH = MODEL_DIR / "label_encoder.pkl"

crop_model = None
crop_encoder = None

class SoilInput(BaseModel):
    N: float
    P: float
    K: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float

def _load_crop_assets():
    global crop_model, crop_encoder
    if crop_model is None or crop_encoder is None:
        if not CROP_MODEL_PATH.exists():
            raise FileNotFoundError(f"Missing model: {CROP_MODEL_PATH}")
        if not CROP_ENCODER_PATH.exists():
            raise FileNotFoundError(f"Missing encoder: {CROP_ENCODER_PATH}")

        crop_model = joblib.load(CROP_MODEL_PATH)
        crop_encoder = joblib.load(CROP_ENCODER_PATH)

def _build_features(inp: SoilInput):
    eps = 1e-6
    N, P, K = inp.N, inp.P, inp.K

    N_P_ratio = N / (P + eps)
    N_K_ratio = N / (K + eps)
    P_K_ratio = P / (K + eps)

    soil_health_index = (N + P + K) / 3.0

    # ph_type: 0 acidic, 1 neutral, 2 alkaline
    if inp.ph < 6.0:
        ph_type = 0
    elif inp.ph <= 7.5:
        ph_type = 1
    else:
        ph_type = 2

    # IMPORTANT: This matches your feature list you shared:
    # ['N','P','K','temperature','humidity','ph','rainfall','N_P_ratio','N_K_ratio','P_K_ratio','soil_health_index','ph_type']
    X = np.array([[
        inp.N, inp.P, inp.K,
        inp.temperature, inp.humidity,
        inp.ph, inp.rainfall,
        N_P_ratio, N_K_ratio, P_K_ratio,
        soil_health_index, ph_type
    ]], dtype=float)

    return X

@app.post("/predict-crop")
def predict_crop(inp: SoilInput):
    """
    Input: N, P, K, temperature, humidity, ph, rainfall
    Output: top crops (top-5 if model supports predict_proba)
    """
    _load_crop_assets()
    X = _build_features(inp)

    crops = []
    confidences = []

    if hasattr(crop_model, "predict_proba"):
        proba = crop_model.predict_proba(X)[0]
        top_idx = np.argsort(proba)[::-1][:5]
        crops = crop_encoder.inverse_transform(top_idx).tolist()
        confidences = [float(proba[i]) for i in top_idx]
    else:
        pred = crop_model.predict(X)
        try:
            crops = [crop_encoder.inverse_transform(pred)[0]]
        except Exception:
            crops = [str(pred[0])]

    return {"crops": crops, "confidences": confidences}

# allow your Next.js app to call this
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for MVP; tighten later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True, "service": "ml-server"}

@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    content = await image.read()

    # validate image (prevents random file crash)
    try:
        img = Image.open(io.BytesIO(content)).convert("RGB")
        _ = img.size
    except Exception:
        return {"ok": False, "error": "Invalid image"}

    # ✅ MVP mock (replace with real model later)
    preds = [
        {"disease": "Healthy", "confidence": 0.93, "recommendation": "No action needed."},
        {"disease": "Leaf Spot", "confidence": 0.78, "recommendation": "Remove affected leaves and avoid overhead watering."},
        {"disease": "Early Blight", "confidence": 0.74, "recommendation": "Improve airflow and treat as per guidance."},
    ]
    result = random.choice(preds)

    return {"ok": True, "result": result}

# start ML server
# uvicorn main:app --reload --port 8000
