from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
from spark_cleaner import clean_csv



app = FastAPI()

UPLOAD_FOLDER = "uploads"
CLEANED_FOLDER = "cleaned"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CLEANED_FOLDER, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:5173"] to restrict
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    # Save uploaded file
    raw_path = os.path.join(UPLOAD_FOLDER, file.filename)
    with open(raw_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Process with Spark
    clean_csv(raw_path, CLEANED_FOLDER)

    # Find output CSV (Spark saves as part-*.csv)
    cleaned_files = os.listdir(CLEANED_FOLDER + "/")
    part_file = [f for f in os.listdir(CLEANED_FOLDER) if f.endswith(".csv") or f.startswith("part-")]

    if part_file:
        part_path = os.path.join(CLEANED_FOLDER, part_file[0])
        output_path = os.path.join(CLEANED_FOLDER, "cleaned_output.csv")
        os.rename(part_path, output_path)
        return FileResponse(output_path, media_type='text/csv', filename="cleaned_output.csv")

    return {"error": "Cleaned file not found"}
