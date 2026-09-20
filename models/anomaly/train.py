import os
import joblib

from sklearn.ensemble import IsolationForest

from database.features import get_student_features
from database.features import prepare_features


FEATURES = [
    "attendance_rate",
    "late_rate",
    "absence_rate",
    "course_load",
    "failed_qr_attempts",
    "correction_count"
]


def train():

    print("Loading data...")

    df = get_student_features()

    df = prepare_features(df)

    if len(df) < 10:
        print("Not enough data to train anomaly model.")
        return

    X = df[FEATURES]

    X = X.fillna(0)

    model = IsolationForest(
        n_estimators=200,
        contamination=0.05,
        random_state=42
    )

    model.fit(X)

    model_dir = os.path.dirname(
        os.path.abspath(__file__)
    )

    model_path = os.path.join(
        model_dir,
        "model.pkl"
    )

    joblib.dump(
        model,
        model_path
    )

    print()
    print("Anomaly model saved:")
    print(model_path)


if __name__ == "__main__":
    train()