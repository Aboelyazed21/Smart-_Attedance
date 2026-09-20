import os
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import precision_score
from sklearn.metrics import recall_score
from sklearn.metrics import f1_score
from sklearn.metrics import accuracy_score

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


def create_target(df):

    df = df.copy()

    df["target_low_attendance"] = (
        df["attendance_rate"] < 0.70
    ).astype(int)

    return df


def train():

    print("Loading data...")

    df = get_student_features()

    df = prepare_features(df)

    df = create_target(df)

    print("Number of students:", len(df))

    if len(df) < 10:
        print("Not enough data to train the model.")
        return

    if df["target_low_attendance"].nunique() < 2:
        print("Only one target class exists.")
        print("You need students with both low and normal attendance.")
        return

    X = df[FEATURES]
    y = df["target_low_attendance"]

    X = X.fillna(0)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    scaler = StandardScaler()

    X_train = scaler.fit_transform(X_train)

    X_test = scaler.transform(X_test)

    model = LogisticRegression(
        max_iter=1000,
        random_state=42
    )

    model.fit(
        X_train,
        y_train
    )

    predictions = model.predict(X_test)

    accuracy = accuracy_score(
        y_test,
        predictions
    )

    precision = precision_score(
        y_test,
        predictions,
        zero_division=0
    )

    recall = recall_score(
        y_test,
        predictions,
        zero_division=0
    )

    f1 = f1_score(
        y_test,
        predictions,
        zero_division=0
    )

    print()
    print("Model Results")
    print("--------------------")
    print("Accuracy :", round(accuracy, 4))
    print("Precision:", round(precision, 4))
    print("Recall   :", round(recall, 4))
    print("F1 Score :", round(f1, 4))

    model_dir = os.path.dirname(
        os.path.abspath(__file__)
    )

    model_path = os.path.join(
        model_dir,
        "model.pkl"
    )

    scaler_path = os.path.join(
        model_dir,
        "scaler.pkl"
    )

    joblib.dump(
        model,
        model_path
    )

    joblib.dump(
        scaler,
        scaler_path
    )

    print()
    print("Model saved:")
    print(model_path)

    print("Scaler saved:")
    print(scaler_path)


if __name__ == "__main__":
    train()