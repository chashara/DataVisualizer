from fastapi import FastAPI, File, UploadFile, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import json
from spark_cleaner import clean_csv, clean_json
import pandas as pd

app = FastAPI()

UPLOAD_FOLDER = "uploads"
CLEANED_FOLDER = "cleaned"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CLEANED_FOLDER, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    raw_path = os.path.join(UPLOAD_FOLDER, file.filename)
    with open(raw_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    if file.filename.endswith(".json"):
        cleaned_data = clean_json(raw_path)
        return JSONResponse(content=cleaned_data)

    else:
        clean_csv(raw_path, CLEANED_FOLDER)
        part_file = [f for f in os.listdir(CLEANED_FOLDER) if f.endswith(".csv") or f.startswith("part-")]
        if part_file:
            part_path = os.path.join(CLEANED_FOLDER, part_file[0])
            output_path = os.path.join(CLEANED_FOLDER, "cleaned_output.csv")
            os.rename(part_path, output_path)
            return FileResponse(output_path, media_type='text/csv', filename="cleaned_output.csv")

    return {"error": "Cleaned file not found"}

@app.post("/descriptive-stats")
async def descriptive_stats(request: Request):
    body = await request.json()
    data = body.get("data")

    if not data:
        return {"error": "No data provided."}

    try:
        df = pd.DataFrame(data)

        numeric_df = df.select_dtypes(include='number')
        stats = {
            "mean": numeric_df.mean().to_dict(),
            "median": numeric_df.median().to_dict(),
            "std_dev": numeric_df.std().to_dict(),
            "correlation": numeric_df.corr().to_dict()
        }

        return JSONResponse(content=stats)
    except Exception as e:
        return {"error": str(e)}