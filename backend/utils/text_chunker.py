import re


def split_into_sentences(text: str):

    sentences = re.split(
        r'(?<=[.!?])\s+',
        text
    )

    return [
        sentence.strip()
        for sentence in sentences
        if sentence.strip()
    ]


def chunk_text(
    text: str,
    max_words: int = 350
):

    sentences = split_into_sentences(text)

    chunks = []

    current_chunk = []

    current_words = 0

    for sentence in sentences:

        words = sentence.split()

        if current_words + len(words) > max_words:

            chunks.append(
                " ".join(current_chunk)
            )

            current_chunk = []

            current_words = 0

        current_chunk.append(sentence)

        current_words += len(words)

    if current_chunk:

        chunks.append(
            " ".join(current_chunk)
        )

    return chunks