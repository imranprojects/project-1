import re

from youtube_transcript_api import YouTubeTranscriptApi
from services.whisper_service import transcribe_with_whisper


def extract_video_id(url: str):
    """
    Extract YouTube video ID from common URL formats.
    """

    patterns = [
        r"(?:v=)([a-zA-Z0-9_-]{11})",
        r"youtu\.be/([a-zA-Z0-9_-]{11})",
        r"shorts/([a-zA-Z0-9_-]{11})",
    ]

    for pattern in patterns:
        match = re.search(pattern, url)

        if match:
            return match.group(1)

    return None


def fetch_transcript(url: str):
    """
    First tries YouTube captions.

    If captions are unavailable, automatically
    falls back to Whisper transcription.
    """

    video_id = extract_video_id(url)

    if not video_id:
        raise Exception("Invalid YouTube URL")

    # FAST PATH: YouTube captions
    try:
        print("[INFO] Trying YouTube captions...")

        api = YouTubeTranscriptApi()

        transcript = api.fetch(video_id)

        text = " ".join(
            snippet.text
            for snippet in transcript
        )

        if text.strip():
            print("[INFO] YouTube captions found.")

            return {
                "text": text,
                "source": "youtube_captions"
            }

    except Exception as e:
        print(
            f"[INFO] YouTube captions unavailable: {str(e)}"
        )

    # FALLBACK: Whisper
    print("[INFO] Falling back to Whisper...")

    text = transcribe_with_whisper(url)

    return {
        "text": text,
        "source": "whisper"
    }