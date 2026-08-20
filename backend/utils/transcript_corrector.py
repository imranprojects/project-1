import re


COMMON_CORRECTIONS = {

    # General
    "road map": "roadmap",
    "road map sec": "roadmap",
    "road map easy": "roadmap",

    "anton ship": "internship",
    "inter ship": "internship",
    "intern ship": "internship",

    "git up": "GitHub",
    "gid up": "GitHub",
    "git hub": "GitHub",

    "rest api's": "REST APIs",
    "rest api": "REST API",

    "java script": "JavaScript",
    "type script": "TypeScript",

    "node js": "Node.js",
    "react js": "React",

    "mongo db": "MongoDB",

    "ci cd": "CI/CD",

    "full stackum": "full stack",

    "job google": "job at Google",

    "amazon jasi": "Amazon",

    "google microsoft amazon":
        "Google, Microsoft and Amazon",

    "html css":
        "HTML CSS",

    "docker compose":
        "Docker Compose",

    "docker file":
        "Dockerfile"
}


FILLER_PATTERNS = [

    r">>\s*\[.*?\]",
    r"\buh\b",
    r"\bumm\b",
    r"\bhmm\b",
    r"\bah\b",
    r"\bokay guys\b",
    r"\byou know\b",
    r"\bbasically\b",
    r"\bactually\b",
    r"\bkind of\b",
    r"\bsort of\b",
    r"\s+"
]


def correct_transcript(text: str) -> str:

    if not text:

        return ""

    cleaned = text

    for pattern in FILLER_PATTERNS:

        cleaned = re.sub(
            pattern,
            " ",
            cleaned,
            flags=re.IGNORECASE
        )

    for wrong, correct in COMMON_CORRECTIONS.items():

        cleaned = re.sub(
            rf"\b{re.escape(wrong)}\b",
            correct,
            cleaned,
            flags=re.IGNORECASE
        )

    cleaned = re.sub(
        r"\s+",
        " ",
        cleaned
    )

    cleaned = re.sub(
        r"\.\.+",
        ".",
        cleaned
    )

    cleaned = re.sub(
        r",,+",
        ",",
        cleaned
    )

    return cleaned.strip()