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


model = None


def load_model():

    global model

    if model is None:

        model = joblib.load(
            MODEL_PATH
        )


def detect_anomaly(data):

    load_model()

    values = {
        feature: data.get(feature, 0)
        for feature in FEATURES
    }

    X = pd.DataFrame([values])

    X = X.fillna(0)

    prediction = model.predict(X)[0]

    score = model.decision_function(X)[0]

    is_anomaly = prediction == -1

    return {
        "is_anomaly": bool(is_anomaly),
        "anomaly_score": round(
            float(score),
            4
        )
    }