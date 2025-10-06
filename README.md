# Chicago Real‑Time Air Quality (Backend on Render, Frontend on Vercel)

This project collects hourly air‑quality measurements for Chicago, stores them in MongoDB Atlas, serves them via a Flask API deployed on Render, and visualizes them with a frontend deployed on Vercel. It also predicts the next hour’s PM2.5 using a RandomForest model saved as a pickle file.

- Backend repository (Render): [Chicago-Air-Quality-render](https://github.com/Tilak2203/Chicago-Air-Quality-render)
- Frontend repository (Vercel): [Chicago-air-quality-vercel](https://github.com/Tilak2203/Chicago-air-quality-vercel)

---

## Architecture

- Data source: OpenAQ API (sensor IDs for Chicago)
- Database: MongoDB Atlas (database `air_quality`, collection `measurements`)
- Model: RandomForestRegressor trained to predict PM2.5 for the next hour; stored as `RandForestModel.pkl`
- Backend API: Flask app on Render exposes endpoints to read data and get predictions
- Frontend: React (deployed on Vercel) calls the Render API

---

## Backend: File structure and purpose

Key backend files and what they do (links point to committed code):

- app.py  
  - Flask application and HTTP endpoints  
  - Loads the RandomForest model pickle at startup  
  - Endpoints:
    - `GET /api/status`: DB health
    - `GET /api/all-readings`: all measurements ordered by time
    - `POST /api/predict`: returns next-hour PM2.5 based on most recent row
    - `GET /api/prediction-history`: last 5 rows with actual vs predicted  
  - Link: [app.py](https://github.com/Tilak2203/Chicago-Air-Quality-render/blob/95bab1e14750050d54db8b6ddd81b46942d2417d/app.py#L1-L119)

- mongodb.py  
  - Mongo connection and helpers  
  - JSONEncoder to serialize ObjectId and datetime  
  - `get_all_readings`: returns all rows (oldest → newest)  
  - `get_recent_readings`: returns last N rows (for charts)  
  - Link: [mongodb.py](https://github.com/Tilak2203/Chicago-Air-Quality-render/blob/95bab1e14750050d54db8b6ddd81b46942d2417d/mongodb.py#L1-L115)

- config.py  
  - Reads configuration values like `MONGODB_URI`, `OPENAQ_API_KEY`, and `SENSOR_IDS` (IDs for pm1, pm25, RH, temperature, pm03)  
  - Do not commit real secrets; set them via environment variables in production  
  - Link: [config.py](https://github.com/Tilak2203/Chicago-Air-Quality-render/blob/95bab1e14750050d54db8b6ddd81b46942d2417d/config.py#L1-L34)

- fetch_data.py  
  - Interacts with OpenAQ to fetch locations and measurements  
  - `latest_hourly_measurement`: builds a one‑row DataFrame for the latest timestamp and features, including:
    - `timestamp`, `pm1`, `pm25`, `Relative Humidity`, `Temperature`, `pm03`
    - calendar features: `hour`, `day_of_week`, `month`  
  - Link: [fetch_data.py](https://github.com/Tilak2203/Chicago-Air-Quality-render/blob/95bab1e14750050d54db8b6ddd81b46942d2417d/fetch_data.py#L1-L103)

- update_and_push.py  
  - Periodic “updater” logic to fetch readings and (optionally) append to CSV or push to Mongo  
  - Compares against last DB timestamp to avoid duplicates  
  - Link: [update_and_push.py](https://github.com/Tilak2203/Chicago-Air-Quality-render/blob/95bab1e14750050d54db8b6ddd81b46942d2417d/update_and_push.py#L1-L120)

- train_model.py  
  - Trains the next‑hour PM2.5 model
  - Loads all measurements from Mongo, sorts chronologically
  - Creates target `pm25_next_hour` by shifting PM2.5 one step into the future
  - Time‑ordered train/test split (no shuffle), trains `RandomForestRegressor`
  - Saves model to `RandForestModel.pkl`  
  - Link: [train_model.py](https://github.com/Tilak2203/Chicago-Air-Quality-render/blob/95bab1e14750050d54db8b6ddd81b46942d2417d/train_model.py#L1-L96)

- predict.py  
  - Loads `RandForestModel.pkl` on demand
  - Reads the latest Mongo row, constructs the feature vector, predicts next‑hour PM2.5  
  - Used by `POST /api/predict` endpoint  
  - Link: [predict.py](https://github.com/Tilak2203/Chicago-Air-Quality-render/blob/95bab1e14750050d54db8b6ddd81b46942d2417d/predict.py#L1-L73)

- .github/workflows/updater.yml  
  - GitHub Actions workflow to run the updater on a schedule (UTC)  
  - Link: [updater.yml](https://github.com/Tilak2203/Chicago-Air-Quality-render/blob/95bab1e14750050d54db8b6ddd81b46942d2417d/.github/workflows/updater.yml#L1-L36)

> Scheduler note: GitHub Actions cron is best‑effort and may drift a few minutes. Keep ingest idempotent (insert only newer rows).

---

## Data preprocessing (preprocess_data.py)

Preprocessing utilities used to clean and enrich the time‑series sensor data.  
Source: [preprocess_data.py](https://github.com/Tilak2203/Chicago-Air-Quality-render/blob/95bab1e14750050d54db8b6ddd81b46942d2417d/preprocess_data.py#L1-L81)

- `load_data(path)`: CSV → DataFrame
- `convert_to_datetime(df, column='timestamp')`: derives `hour`, `day_of_week`, `month` from a datetime column (ensure `df['timestamp']` is pandas datetime first)
- `round_df_values(df, decimal_places=2)`: rounds numeric columns; presentation/consistency
- `remove_outliers_csv(df, column)`: IQR‑based row filter for one column (keep within Q1−1.5·IQR and Q3+1.5·IQR)
- `calculate_outlier_bounds(df, col)`: returns IQR lower/upper bounds without filtering
- `return_bounds(col)`: quick pre‑computed lower/upper bounds for known columns (`pm1`, `pm25`, `RH`, `Temp`, `pm03`)

Recommended training flow:
1) Ensure datetime dtype, then `convert_to_datetime`  
2) Optionally remove/clamp outliers (`calculate_outlier_bounds` or `return_bounds`)  
3) `round_df_values` for storage/UI

---

## Model: “Next hour” PM2.5 prediction (RandomForest + pickle)

- Training ([train_model.py](https://github.com/Tilak2203/Chicago-Air-Quality-render/blob/95bab1e14750050d54db8b6ddd81b46942d2417d/train_model.py#L1-L96)):
  - Target: `pm25_next_hour = pm25.shift(-1)`
  - Features: current readings (`pm1`, `RH`, `Temp`, `pm03`) + calendar (`hour`, `day_of_week`, `month`)
  - Time‑ordered split; RandomForestRegressor; saved as `RandForestModel.pkl`

- Serving ([predict.py](https://github.com/Tilak2203/Chicago-Air-Quality-render/blob/95bab1e14750050d54db8b6ddd81b46942d2417d/predict.py#L1-L73), [app.py](https://github.com/Tilak2203/Chicago-Air-Quality-render/blob/95bab1e14750050d54db8b6ddd81b46942d2417d/app.py#L1-L119)):
  - Read latest document, build feature vector, predict next‑hour PM2.5, return JSON

---

## API endpoints (backend)

Base URL: your Render service URL (e.g., `https://<your-backend>.onrender.com`)

- `GET /api/status` – Mongo connectivity status  
- `GET /api/all-readings` – all readings (oldest → newest) with count and date range  
- `POST /api/predict` – next‑hour PM2.5 prediction from the latest row  
- `GET /api/prediction-history` – last 5 rows with actual vs predicted

---

## Frontend (Vercel)

- Configure API base URL via env:
  - Vite: `VITE_API_BASE=https://<your-backend>.onrender.com`
  - CRA: `REACT_APP_API_BASE=https://<your-backend>.onrender.com`
- Typical calls: `/api/all-readings`, `/api/predict`, `/api/prediction-history`
- Ensure backend CORS allows your Vercel domain (and localhost during dev)

---

## AQI reference and color legend

This section explains the Air Quality Index categories and their colors, matching the legend you provided.

If your visualization shows AQI, use these categories to color the UI:

<img width="588" height="500" alt="image" src="https://github.com/user-attachments/assets/557dda2d-9a96-453e-bcc9-384cc7bb85d4" />
