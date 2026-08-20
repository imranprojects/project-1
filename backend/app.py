from fastapi import FastAPI
from pydantic import BaseModel
from services.metadata_service import fetch_metadata
from utils.env_loader import load_env

# Load environment variables from .env
load_env()



from services.transcript_service import fetch_transcript
from services.summarizer_service import summarize_text
from utils.analysis_helper import (
    estimate_reading_time,
    detect_difficulty,
    extract_technologies
)
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="TubeMind AI",
    description="AI-powered YouTube Content Analysis Platform",
    version="2.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



class VideoRequest(BaseModel):
    video_url: str


@app.get("/")
def home():
    return {
        "success": True,
        "message": "TubeMind AI Backend Running 🚀",
        "version": "2.0.0"
    }


@app.post("/transcript")
def transcript(request: VideoRequest):

    try:
        transcript_result = fetch_transcript(request.video_url)

        return {
            "success": True,
            "source": transcript_result["source"],
            "transcript": transcript_result["text"]
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.post("/summarize")
def summarize(request: VideoRequest):

    try:
        # Step 1: Fetch transcript
        transcript_result = fetch_transcript(request.video_url)
        metadata = fetch_metadata(request.video_url)
        transcript_text = transcript_result["text"]

        # Step 2: Generate AI analysis
        ai_response = summarize_text(transcript_text)
        reading_time = estimate_reading_time(
        ai_response["summary"]
        )

        difficulty = detect_difficulty(
         transcript_text
        )

        technologies = extract_technologies(
         transcript_text
        )
        # Step 3: Return response
        return {

    "success": True,

    "video": metadata,

    "source": transcript_result["source"],

    "analysis": {

        "summary": ai_response["summary"],

        "key_takeaways": ai_response["key_takeaways"],

        "topics": ai_response["topics"],

        "difficulty": difficulty,

        "reading_time": reading_time,

        "technologies": technologies

    },

    "transcript": transcript_text
}

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }