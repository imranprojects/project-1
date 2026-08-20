import os
import json
import requests
from utils.text_cleaner import clean_transcript
from utils.env_loader import load_env

# Load environment variables
load_env()

def summarize_text(text: str) -> dict:
    """
    Summarize transcript using Gemini 3.5 Flash API.
    Returns a dictionary with 'summary', 'key_takeaways', and 'topics'.
    """
    text = clean_transcript(text)
    
    # If the text is very short, return simple values
    words = text.split()
    if len(words) < 20:
        return {
            "summary": text,
            "key_takeaways": [],
            "topics": []
        }

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[WARNING] GEMINI_API_KEY not found in environment.")
        return {
            "summary": "Gemini API key is missing. Please configure GEMINI_API_KEY in .env.",
            "key_takeaways": ["Please add your Gemini API key."],
            "topics": ["Configuration Required"]
        }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    prompt = (
        "You are an expert content analyzer. Analyze the following YouTube video transcript and generate "
        "a cohesive executive summary (80-180 words), a list of up to 5 key takeaways, and a list of up to 5 "
        "relevant topics (technologies or concepts). Return the response strictly as a JSON object matching this schema:\n\n"
        "{\n"
        "  \"summary\": \"A high-quality paragraph summarizing the video content.\",\n"
        "  \"key_takeaways\": [\"Takeaway 1\", \"Takeaway 2\", ...],\n"
        "  \"topics\": [\"Topic 1\", \"Topic 2\", ...]\n"
        "}\n\n"
        f"Transcript:\n{text}"
    )

    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            res_json = response.json()
            content_text = res_json["candidates"][0]["content"]["parts"][0]["text"]
            data = json.loads(content_text.strip())
            return {
                "summary": data.get("summary", ""),
                "key_takeaways": data.get("key_takeaways", []),
                "topics": data.get("topics", [])
            }
        else:
            raise Exception(f"Gemini API returned status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"[ERROR] Gemini summarization failed: {e}")
        return {
            "summary": "Failed to generate summary using Gemini API.",
            "key_takeaways": [f"Error details: {str(e)}"],
            "topics": ["Error"]
        }