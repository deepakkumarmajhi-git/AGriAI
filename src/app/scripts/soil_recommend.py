import json, sys
import numpy as np
import joblib
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE / "models" / "crop_model.pkl"              # <-- your trained model file goes here
ENCODER_PATH = BASE / "models" / "crop_label_encoder.pkl"    # uploaded
FEATURES_PATH = BASE / "models" / "crop_feature_list.pkl"    # uploaded

def safe_float(x, default=0.0):
    try:
        return float(x)
    except:
        return default

def main():
    payload = json.loads(sys.stdin.read() or "{}")

    # REQUIRED inputs
    N = safe_float(payload.get("N"))
    P = safe_float(payload.get("P"))
    K = safe_float(payload.get("K"))
    temperature = safe_float(payload.get("temperature"))
    humidity = safe_float(payload.get("humidity"))
    ph = safe_float(payload.get("ph"))
    rainfall = safe_float(payload.get("rainfall"))

    # ---- engineered features based on your feature list file ----
    eps = 1e-6
    N_P_ratio = N / (P + eps)
    N_K_ratio = N / (K + eps)
    P_K_ratio = P / (K + eps)

    # Simple soil health index (MVP heuristic)
    soil_health_index = (N + P + K) / 3.0

    # ph_type categorical mapping (simple)
    # 0: acidic, 1: neutral, 2: alkaline
    if ph < 6.0:
        ph_type = 0
    elif ph <= 7.5:
        ph_type = 1
    else:
        ph_type = 2

    if not MODEL_PATH.exists():
        print(json.dumps({
            "error": "Model file missing",
            "hint": "Place your trained model at models/crop_model.pkl"
        }))
        return

    model = joblib.load(MODEL_PATH)
    encoder = joblib.load(ENCODER_PATH)

    # Make the feature vector in correct order:
    # ['N','P','K','temperature','humidity','ph','rainfall','N_P_ratio','N_K_ratio','P_K_ratio','soil_health_index','ph_type']
    X = np.array([[
        N, P, K, temperature, humidity, ph, rainfall,
        N_P_ratio, N_K_ratio, P_K_ratio,
        soil_health_index, ph_type
    ]], dtype=float)

    # Predict
    pred = model.predict(X)

    # If model outputs numeric label -> decode
    try:
        crop = encoder.inverse_transform(pred)[0]
    except Exception:
        crop = str(pred[0])

    crops = [str(crop)]

    # Optional: top-k if predict_proba available
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X)[0]
        top_idx = np.argsort(proba)[::-1][:5]
        try:
            crops = encoder.inverse_transform(top_idx).tolist()
        except Exception:
            crops = [str(i) for i in top_idx]

    print(json.dumps({"crops": crops}))

if __name__ == "__main__":
    main()