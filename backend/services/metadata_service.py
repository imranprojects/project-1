import yt_dlp


def fetch_metadata(video_url: str):

    ydl_opts = {
        "quiet": True,
        "skip_download": True
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:

        info = ydl.extract_info(
            video_url,
            download=False
        )

    duration = info.get("duration", 0)

    minutes = duration // 60
    seconds = duration % 60

    metadata = {

        "title":
            info.get("title"),

        "channel":
            info.get("uploader"),

        "duration":
            f"{minutes}:{seconds:02d}",

        "thumbnail":
            info.get("thumbnail"),

        "views":
            info.get("view_count"),

        "upload_date":
            info.get("upload_date"),

        "description":
            info.get("description", "")[:500]
    }

    return metadata