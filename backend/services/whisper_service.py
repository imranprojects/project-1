import os
import uuid
import tempfile

import whisper
import yt_dlp


FFMPEG_BIN = (
    r"C:\Users\Imran\AppData\Local\Microsoft\WinGet\Packages"
    r"\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe"
    r"\ffmpeg-8.1.2-full_build\bin"
)

# Make FFmpeg available to this Python process.
# Whisper internally calls the "ffmpeg" command.
os.environ["PATH"] = FFMPEG_BIN + os.pathsep + os.environ.get("PATH", "")


whisper_model = None

def get_whisper_model():
    global whisper_model
    if whisper_model is None:
        print("[INFO] Loading Whisper model...")
        whisper_model = whisper.load_model("small")
        print("[INFO] Whisper model loaded.")
    return whisper_model



def transcribe_with_whisper(youtube_url: str) -> str:

    unique_id = str(uuid.uuid4())
    temp_dir = tempfile.gettempdir()

    output_template = os.path.join(
        temp_dir,
        f"{unique_id}.%(ext)s"
    )

    audio_file = os.path.join(
        temp_dir,
        f"{unique_id}.mp3"
    )

    ydl_options = {
        "format": "bestaudio/best",
        "outtmpl": output_template,
        "quiet": False,
        "no_warnings": False,

        # Used by yt-dlp
        "ffmpeg_location": FFMPEG_BIN,

        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }
        ],
    }

    try:
        print("[INFO] Downloading YouTube audio...")

        with yt_dlp.YoutubeDL(ydl_options) as ydl:
            ydl.download([youtube_url])

        if not os.path.exists(audio_file):
            raise Exception(
                f"Audio file was not created: {audio_file}"
            )

        print(
            f"[INFO] Audio downloaded: {audio_file}"
        )

        print("[INFO] Transcribing audio with Whisper...")

        model = get_whisper_model()
        result = model.transcribe(
         audio_file,
         language="en",
         fp16=False,
         temperature=0,
         condition_on_previous_text=True,
         verbose=False
   )

        transcript = result.get(
            "text",
            ""
        ).strip()

        if not transcript:
            raise Exception(
                "Whisper could not generate a transcript."
            )

        print("[INFO] Whisper transcription completed.")

        return transcript

    except Exception as e:

        print(
            f"[ERROR] Whisper transcription error: {e}"
        )

        raise Exception(
            f"Whisper transcription failed: {str(e)}"
        )

    finally:

        if os.path.exists(audio_file):

            try:
                os.remove(audio_file)

                print(
                    "[INFO] Temporary audio deleted."
                )

            except OSError:
                pass