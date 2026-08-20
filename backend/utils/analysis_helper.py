import math

from utils.technology_detector import detect_technologies


def estimate_reading_time(summary: str):
    """
    Estimate reading time assuming
    200 words per minute.
    """

    if not summary:
        return "0 min"

    words = len(summary.split())

    minutes = max(
        1,
        math.ceil(words / 200)
    )

    return f"{minutes} min"


def detect_difficulty(transcript: str):
    """
    Estimate difficulty based on detected technologies.
    """

    technologies = detect_technologies(transcript)

    beginner = {
        "HTML",
        "CSS",
        "JavaScript",
        "Git",
        "GitHub"
    }

    intermediate = {
        "React",
        "Node.js",
        "Express.js",
        "MongoDB",
        "MySQL",
        "REST API",
        "FastAPI",
        "Flask",
        "Docker",
        "Firebase"
    }

    advanced = {
        "Kubernetes",
        "Redis",
        "CI/CD",
        "OAuth",
        "JWT",
        "GraphQL",
        "Google Cloud",
        "AWS",
        "Azure"
    }

    score = 0

    for tech in technologies:

        if tech in beginner:
            score += 1

        elif tech in intermediate:
            score += 2

        elif tech in advanced:
            score += 3

    if score >= 18:
        return "Advanced"

    if score >= 8:
        return "Intermediate"

    return "Beginner"


def extract_technologies(text: str):
    """
    Wrapper for the new Technology Detector.
    """

    return detect_technologies(text)