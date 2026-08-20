import re


def clean_transcript(text: str) -> str:
    """
    Cleans raw transcript before summarization.
    """

    if not text:
        return ""

    # Remove music tags
    text = re.sub(r">>\s*\[.*?\]", " ", text)

    # Remove timestamps
    text = re.sub(
        r"\b\d{1,2}:\d{2}(?::\d{2})?\b",
        " ",
        text
    )

    # Remove URLs
    text = re.sub(
        r"http\S+",
        " ",
        text
    )

    # Remove repeated punctuation
    text = re.sub(
        r"([.,!?])\1+",
        r"\1",
        text
    )

    # Remove multiple spaces
    text = re.sub(
        r"\s+",
        " ",
        text
    )

    # Remove filler words
    fillers = [
        "uh",
        "umm",
        "hmm",
        "ah",
        "okay guys",
        "guys",
        "you know",
        "basically",
        "actually"
    ]

    for word in fillers:

        text = re.sub(
            rf"\b{word}\b",
            " ",
            text,
            flags=re.IGNORECASE
        )

    # Remove duplicate spaces again
    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()