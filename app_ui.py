# import requests
# import streamlit as st

# # Page Configuration
# st.set_page_config(
#     page_title="Smart Attendance AI Tester", page_icon="🏫", layout="wide"
# )

# # App Title & Description
# st.title("🏫 Smart Attendance - AI Service Tester")
# st.markdown(
#     "Use this interactive Streamlit dashboard to test your FastAPI AI endpoints"
#     " and view student risk profiles, anomalies, and rules."
# )

# # Sidebar Configuration for API Endpoint
# st.sidebar.header("Configuration")
# API_URL = st.sidebar.text_input(
#     "FastAPI Base URL", value="http://127.0.0.1:8000"
# )

# # Main Input Section
# st.divider()
# student_id = st.number_input(
#     "Enter Student ID to Analyze:", min_value=1, step=1, value=1
# )

# if st.button("Run AI Analysis", type="primary"):
#   with st.spinner("Fetching data from FastAPI service..."):
#     try:
#       # 1. Fetch Student Features & General Metrics
#       res_features = requests.get(f"{API_URL}/ai/student/{student_id}")

#       # 2. Fetch Risk Prediction (matching your documentation/architecture)
#       # Note: Adjust paths if your specific endpoints differ slightly in main.py
#       res_risk = requests.get(f"{API_URL}/risk/predict/{student_id}")
#       res_anomaly = requests.get(f"{API_URL}/anomaly/student/{student_id}")
#       res_flags = requests.get(f"{API_URL}/flags/student/{student_id}")

#       # Check if main features endpoint succeeded
#       if res_features.status_code == 200:
#         data = res_features.json()
#         st.success(
#             f"Successfully retrieved analysis for Student ID: {student_id}"
#         )

#         # Metrics Display Layout
#         col1, col2, col3, col4 = st.columns(4)
#         col1.metric("Attendance Rate", f"{data.get('attendance_rate', 0)}%")
#         col2.metric("Absence Rate", f"{data.get('absence_rate', 0)}%")
#         col3.metric("Late Rate", f"{data.get('late_rate', 0)}%")
#         col4.metric("Course Load", data.get("course_load", 0))

#         st.divider()

#         # Detailed Tabs for AI Models
#         tab1, tab2, tab3, tab4 = st.tabs([
#             "📊 Raw Features",
#             "⚠️ Risk Prediction",
#             "🔍 Anomalies",
#             "🚩 Red Flags",
#         ])

#         with tab1:
#           st.subheader("Extracted Student Features")
#           st.json(data)

#         with tab2:
#           st.subheader("Attendance Risk Model Output")
#           if res_risk.status_code == 200:
#             st.json(res_risk.json())
#           else:
#             st.info(
#                 "Risk endpoint not currently active or returned no data yet."
#             )

#         with tab3:
#           st.subheader("Anomaly Detection Output")
#           if res_anomaly.status_code == 200:
#             st.json(res_anomaly.json())
#           else:
#             st.info("No anomaly data available for this student.")

#         with tab4:
#           st.subheader("Rule-Based Red Flags")
#           if res_flags.status_code == 200:
#             st.json(res_flags.json())
#           else:
#             st.info("No red flags recorded.")

#       else:
#         st.error(
#             f"Student not found or API error (Status Code:"
#             f" {res_features.status_code}). Please verify the Student ID exists"
#             " in your database."
#         )

#     except requests.exceptions.ConnectionError:
#       st.error(
#           "Connection Refused! Please make sure your FastAPI uvicorn server is"
#           f" running at {API_URL}."
#       )
#     except Exception as e:
#       st.error(f"An unexpected error occurred: {e}")
import requests
import streamlit as st

# Page Configuration
st.set_page_config(
    page_title="Smart Attendance AI Tester", page_icon="🏫", layout="wide"
)

# App Title & Description
st.title("🏫 Smart Attendance - AI Service Tester")
st.markdown(
    "Use this interactive Streamlit dashboard to test your FastAPI AI endpoints"
    " and view student risk profiles, anomalies, and rules."
)

# Sidebar Configuration for API Endpoint
st.sidebar.header("Configuration")
API_URL = st.sidebar.text_input(
    "FastAPI Base URL", value="http://127.0.0.1:8000"
)

# Main Input Section
st.divider()
student_id = st.number_input(
    "Enter Student ID to Analyze:", min_value=1, step=1, value=1
)

if st.button("Run AI Analysis", type="primary"):
  with st.spinner("Fetching data from FastAPI service..."):
    try:
      # The single /ai/student/{id} endpoint already returns raw features,
      # risk, anomaly, analytics, and flags all in one response — no need
      # to call separate /risk, /anomaly, /flags endpoints (they don't
      # exist in main.py and were always 404ing silently).
      res_features = requests.get(f"{API_URL}/ai/student/{student_id}")

      if res_features.status_code == 200:
        data = res_features.json()
        st.success(
            f"Successfully retrieved analysis for Student ID: {student_id}"
        )

        # Metrics Display Layout
        # attendance_rate/absence_rate/late_rate are stored as 0-1 fractions,
        # so multiply by 100 to show a real percentage.
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Attendance Rate", f"{data.get('attendance_rate', 0) * 100:.1f}%")
        col2.metric("Absence Rate", f"{data.get('absence_rate', 0) * 100:.1f}%")
        col3.metric("Late Rate", f"{data.get('late_rate', 0) * 100:.1f}%")
        col4.metric("Course Load", data.get("course_load", 0))

        st.divider()

        # Detailed Tabs for AI Models
        tab1, tab2, tab3, tab4 = st.tabs([
            "📊 Raw Features",
            "⚠️ Risk Prediction",
            "🔍 Anomalies",
            "🚩 Red Flags",
        ])

        with tab1:
          st.subheader("Extracted Student Features")
          st.json(data)

        with tab2:
          st.subheader("Attendance Risk Model Output")
          risk = data.get("risk")
          if risk:
            st.json(risk)
          else:
            st.info("Risk data not available for this student.")

        with tab3:
          st.subheader("Anomaly Detection Output")
          anomaly = data.get("anomaly")
          if anomaly:
            st.json(anomaly)
          else:
            st.info("No anomaly data available for this student.")

        with tab4:
          st.subheader("Rule-Based Red Flags")
          flags = data.get("flags")
          if flags:
            st.json(flags)
          else:
            st.info("No red flags recorded.")

      else:
        st.error(
            f"Student not found or API error (Status Code:"
            f" {res_features.status_code}). Please verify the Student ID exists"
            " in your database."
        )

    except requests.exceptions.ConnectionError:
      st.error(
          "Connection Refused! Please make sure your FastAPI uvicorn server is"
          f" running at {API_URL}."
      )
    except Exception as e:
      st.error(f"An unexpected error occurred: {e}")