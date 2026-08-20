import re


TECHNOLOGY_PATTERNS = {

    "HTML": [
        "html"
    ],

    "CSS": [
        "css"
    ],

    "JavaScript": [
        "javascript",
        "java script",
        "js"
    ],

    "TypeScript": [
        "typescript",
        "type script",
        "ts"
    ],

    "React": [
        "react",
        "reactjs",
        "react js"
    ],

    "Node.js": [
        "node",
        "nodejs",
        "node js",
        "node.js"
    ],

    "Express.js": [
        "express",
        "expressjs"
    ],

    "Python": [
        "python"
    ],

    "Java": [
        "java"
    ],

    "C++": [
        "c++"
    ],

    "C#": [
        "c#"
    ],

    "Git": [
        "git"
    ],

    "GitHub": [
        "github",
        "git hub",
        "gid up",
        "git up"
    ],

    "Docker": [
        "docker",
        "dockerfile",
        "docker compose"
    ],

    "Kubernetes": [
        "kubernetes",
        "k8s"
    ],

    "MongoDB": [
        "mongodb",
        "mongo db"
    ],

    "MySQL": [
        "mysql"
    ],

    "PostgreSQL": [
        "postgresql",
        "postgres"
    ],

    "REST API": [
        "rest api",
        "rest apis"
    ],

    "GraphQL": [
        "graphql"
    ],

    "JWT": [
        "jwt"
    ],

    "OAuth": [
        "oauth"
    ],

    "Redis": [
        "redis"
    ],

    "Firebase": [
        "firebase"
    ],

    "FastAPI": [
        "fastapi"
    ],

    "Flask": [
        "flask"
    ],

    "AWS": [
        "aws",
        "amazon web services"
    ],

    "Google Cloud": [
        "google cloud",
        "gcp"
    ],

    "Azure": [
        "azure"
    ],

    "CI/CD": [
        "ci/cd",
        "ci cd"
    ],

    "Linux": [
        "linux"
    ]
}


def detect_technologies(text: str):

    if not text:

        return []

    text = text.lower()

    detected = []

    for technology, aliases in TECHNOLOGY_PATTERNS.items():

        for alias in aliases:

            pattern = rf"\b{re.escape(alias.lower())}\b"

            if re.search(pattern, text):

                detected.append(technology)

                break

    return detected