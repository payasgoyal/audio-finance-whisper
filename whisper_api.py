import os
import time
import whisper
from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse
import uuid

app = FastAPI()

# Load model globally for reuse
model = whisper.load_model("base")
print("Whisper model loaded and ready!")

# Store results
transcriptions = {}

@app.post("/transcribe/")
async def transcribe_audio(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    # Generate a unique ID for this transcription
    job_id = str(uuid.uuid4())
    
    # Save the uploaded file temporarily
    temp_file = f"temp_{job_id}.{file.filename.split('.')[-1]}"
    with open(temp_file, "wb") as buffer:
        buffer.write(await file.read())
    
    # Add the job to processing queue
    background_tasks.add_task(process_audio, temp_file, job_id)
    
    return {"job_id": job_id, "status": "processing"}

def process_audio(filename, job_id):
    try:
        # Transcribe the audio
        start_time = time.time()
        result = model.transcribe(filename)
        processing_time = time.time() - start_time
        
        # Store result
        transcriptions[job_id] = {
            "text": result["text"],
            "segments": result["segments"],
            "processing_time": processing_time
        }
        
        # Clean up
        os.remove(filename)
    except Exception as e:
        transcriptions[job_id] = {"error": str(e)}

@app.get("/result/{job_id}")
async def get_result(job_id: str):
    if job_id not in transcriptions:
        return JSONResponse(status_code=404, content={"error": "Job not found"})
    
    return transcriptions[job_id]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)