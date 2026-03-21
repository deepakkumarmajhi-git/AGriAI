from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
import io
import random

from pathlib import Path
import numpy as np
import joblib
from pydantic import BaseModel

# ✅ TensorFlow for .h5
import json
import traceback

app = FastAPI()

# -------------------------
# Paths
# -------------------------
BASE = Path(__file__).resolve().parent
MODEL_DIR = BASE / "models"

# -------------------------
# Soil Analysis (Crop Recommendation)
# -------------------------
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

# -------------------------
# ✅ Leaf Disease Detection (.h5)
# -------------------------
LEAF_MODEL_PATH = MODEL_DIR / "leaf_model.h5"
LEAF_LABELS_PATH = MODEL_DIR / "leaf_labels.json"

_leaf_model = None
_leaf_labels = None
_tf = None


def _get_tensorflow():
    global _tf
    if _tf is None:
        import tensorflow as tf

        _tf = tf
    return _tf

def _load_leaf_assets():
    global _leaf_model, _leaf_labels

    if _leaf_labels is None:
        if not LEAF_LABELS_PATH.exists():
            raise FileNotFoundError(f"Missing labels: {LEAF_LABELS_PATH}")
        with open(LEAF_LABELS_PATH, "r", encoding="utf-8") as f:
            _leaf_labels = json.load(f)
        if not isinstance(_leaf_labels, list) or len(_leaf_labels) == 0:
            raise ValueError("leaf_labels.json must be a non-empty JSON array of strings")

    if _leaf_model is None:
        if not LEAF_MODEL_PATH.exists():
            raise FileNotFoundError(f"Missing model: {LEAF_MODEL_PATH}")
        tf = _get_tensorflow()
        _leaf_model = tf.keras.models.load_model(str(LEAF_MODEL_PATH))

def _leaf_input_size() -> int:
    """
    Auto-detect input size from the model.
    Usually (None, 224, 224, 3) or (None, 256, 256, 3)
    """
    _load_leaf_assets()
    shape = _leaf_model.input_shape
    if isinstance(shape, list):
        shape = shape[0]
    # shape: (None, H, W, C)
    h = int(shape[1]) if shape and len(shape) > 2 and shape[1] else 224
    return h

def _preprocess_leaf_image(img: Image.Image) -> np.ndarray:
    size = _leaf_input_size()
    img = img.convert("RGB")
    img = img.resize((size, size))
    arr = np.asarray(img).astype(np.float32) / 255.0
    arr = np.expand_dims(arr, axis=0)
    return arr

def _predict_leaf_from_bytes(content: bytes):
    _load_leaf_assets()

    img = Image.open(io.BytesIO(content)).convert("RGB")
    x = _preprocess_leaf_image(img)

    preds = _leaf_model.predict(x)
    if preds is None or len(preds) == 0:
        raise RuntimeError("Model returned empty prediction")

    probs = preds[0].astype(float)
    idx = int(np.argmax(probs))
    conf = float(probs[idx])

    # top-3 helpful info
    top_idx = probs.argsort()[-3:][::-1]
    top3 = [{
        "label": _leaf_labels[int(i)] if int(i) < len(_leaf_labels) else f"class_{int(i)}",
        "confidence": float(probs[int(i)])
    } for i in top_idx]

    label = _leaf_labels[idx] if idx < len(_leaf_labels) else f"class_{idx}"

    return label, conf, top3

@app.post("/predict-leaf")
async def predict_leaf(image: UploadFile = File(...)):
    try:
        content = await image.read()

        # validate image early
        try:
            img = Image.open(io.BytesIO(content)).convert("RGB")
            _ = img.size
        except Exception:
            return JSONResponse(status_code=400, content={"ok": False, "error": "Invalid image"})

        label, confidence, top3 = _predict_leaf_from_bytes(content)

        return {
            "ok": True,
            "label": label,
            "confidence": confidence,
            "top3": top3
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "ok": False,
                "error": "Leaf prediction failed",
                "details": str(e),
                "trace": traceback.format_exc()
            }
        )

# -------------------------
# CORS (keep your existing)
# -------------------------
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

# -------------------------
# ✅ Backward compatible endpoint used by your Next.js scan UI
# `/predict` now returns "result" like before, but based on real model output.
# -------------------------
@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    content = await image.read()

    # validate image
    try:
        img = Image.open(io.BytesIO(content)).convert("RGB")
        _ = img.size
    except Exception:
        return {"ok": False, "error": "Invalid image"}

    try:
        label, confidence, top3 = _predict_leaf_from_bytes(content)

        # Basic recommendation placeholder (you can replace with your own mapping)
        recommendation = (
            "Use organic neem spray + remove infected leaves. "
            "If severe, consult local agri officer for recommended fungicide."
        )

        return {
            "ok": True,
            "result": {
                "disease": label,
                "confidence": float(confidence),
                "recommendation": recommendation,
                "top3": top3
            }
        }

    except Exception as e:
        # fallback to your old mock if model missing (so app never breaks)
        preds = [
            {"disease": "Healthy", "confidence": 0.93, "recommendation": "No action needed."},
            {"disease": "Leaf Spot", "confidence": 0.78, "recommendation": "Remove affected leaves and avoid overhead watering."},
            {"disease": "Early Blight", "confidence": 0.74, "recommendation": "Improve airflow and treat as per guidance."},
        ]
        result = random.choice(preds)

        return {
            "ok": False,
            "error": "Real model failed. Using fallback mock.",
            "details": str(e),
            "result": result
        }

# start ML server
# uvicorn main:app --reload --port 8000
