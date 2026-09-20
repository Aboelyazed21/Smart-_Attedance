import os
import joblib
import pandas as pd


FEATURES = [
    "attendance_rate",
    "late_rate",
    "absence_rate",
    "course_load",
    "failed_qr_attempts",
    "correction_count"
]


BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "model.pkl"
)

SCALER_PATH = os.path.join(
    BASE_DIR,
    "scaler.pkl"
)


model = None
scaler = None


def load_model():

    global model
    global scaler

    if model is None:

        model = joblib.load(
            MODEL_PATH
        )

    if scaler is None:

        scaler = joblib.load(
            SCALER_PATH
        )


def predict_risk(data):

    load_model()

    values = {
        feature: data.get(feature, 0)
        for feature in FEATURES
    }

    X = pd.DataFrame([values])

    X = X.fillna(0)

    X_scaled = scaler.transform(X)

    probability = model.predict_proba(
        X_scaled
    )[0][1]

    prediction = model.predict(
        X_scaled
    )[0]

    if probability >= 0.75:
        risk_level = "high"

    elif probability >= 0.50:
        risk_level = "medium"

    else:
        risk_level = "low"

    return {
        "prediction": int(prediction),
        "probability": round(
            float(probability),
            4
        ),
        "risk_level": risk_level
    }