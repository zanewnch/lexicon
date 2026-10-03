from __future__ import annotations

import argparse
import hashlib
import json
import sqlite3
from pathlib import Path
from urllib.parse import quote

DATASET_URL = "https://rajpurkar.github.io/SQuAD-explorer/dataset/dev-v2.0.json"
LICENSE_URL = "https://creativecommons.org/licenses/by-sa/4.0/"
LICENSE = "CC BY-SA 4.0"


def import_dataset(source: Path, database: Path, force: bool) -> tuple[int, int, int]:
    if not source.is_file():
        raise FileNotFoundError(f"Dataset file not found: {source}")
    if database.exists() and not force:
        raise FileExistsError(f"Database already exists; pass --force to replace: {database}")

    raw = source.read_bytes()
    payload = json.loads(raw.decode("utf-8"))
    if payload.get("version") != "v2.0":
        raise ValueError(f"Expected SQuAD v2.0, got {payload.get('version')!r}")

    database.parent.mkdir(parents=True, exist_ok=True)
    if database.exists():
        database.unlink()

    document_count = chunk_count = question_count = 0
    with sqlite3.connect(database) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        connection.executescript("""
            CREATE TABLE dataset_metadata (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            CREATE TABLE documents (
                document_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                source_url TEXT NOT NULL,
                attribution TEXT NOT NULL,
                license TEXT NOT NULL
            );
            CREATE TABLE chunks (
                chunk_id TEXT PRIMARY KEY,
                document_id TEXT NOT NULL REFERENCES documents(document_id),
                chunk_index INTEGER NOT NULL,
                content TEXT NOT NULL,
                UNIQUE(document_id, chunk_index)
            );
            CREATE TABLE questions (
                question_id TEXT PRIMARY KEY,
                chunk_id TEXT NOT NULL REFERENCES chunks(chunk_id),
                question TEXT NOT NULL,
                is_answerable INTEGER NOT NULL CHECK (is_answerable IN (0, 1))
            );
            CREATE TABLE answers (
                answer_id INTEGER PRIMARY KEY,
                question_id TEXT NOT NULL REFERENCES questions(question_id),
                answer_text TEXT NOT NULL,
                answer_start INTEGER NOT NULL
            );
            CREATE INDEX idx_chunks_document_id ON chunks(document_id);
            CREATE INDEX idx_questions_chunk_id ON questions(chunk_id);
            CREATE INDEX idx_questions_answerable ON questions(is_answerable);
        """)

        metadata = {
            "dataset": "Stanford Question Answering Dataset (SQuAD) v2.0",
            "split": "dev",
            "source_url": DATASET_URL,
            "source_sha256": hashlib.sha256(raw).hexdigest(),
            "license": LICENSE,
            "license_url": LICENSE_URL,
            "attribution": "Rajpurkar et al., Stanford Question Answering Dataset; source passages are Wikipedia articles",
            "transformation": "Each SQuAD paragraph is stored as one chunk; questions and answer spans remain linked to that chunk.",
        }
        connection.executemany(
            "INSERT INTO dataset_metadata(key, value) VALUES (?, ?)", metadata.items()
        )

        for article_index, article in enumerate(payload["data"]):
            document_id = f"squad-v2-dev-{article_index:03d}"
            title = article["title"]
            source_url = "https://en.wikipedia.org/wiki/" + quote(title.replace(" ", "_"), safe="()_,")
            connection.execute(
                "INSERT INTO documents VALUES (?, ?, ?, ?, ?)",
                (document_id, title, source_url, metadata["attribution"], LICENSE),
            )
            document_count += 1

            for chunk_index, paragraph in enumerate(article["paragraphs"]):
                chunk_id = f"{document_id}-p{chunk_index:04d}"
                connection.execute(
                    "INSERT INTO chunks VALUES (?, ?, ?, ?)",
                    (chunk_id, document_id, chunk_index, paragraph["context"]),
                )
                chunk_count += 1

                for item in paragraph["qas"]:
                    is_answerable = not item["is_impossible"]
                    connection.execute(
                        "INSERT INTO questions VALUES (?, ?, ?, ?)",
                        (item["id"], chunk_id, item["question"], int(is_answerable)),
                    )
                    question_count += 1
                    if is_answerable:
                        connection.executemany(
                            "INSERT INTO answers(question_id, answer_text, answer_start) VALUES (?, ?, ?)",
                            [(item["id"], answer["text"], answer["answer_start"])
                             for answer in item["answers"]],
                        )

        connection.commit()
        integrity = connection.execute("PRAGMA integrity_check").fetchone()[0]
        if integrity != "ok":
            raise sqlite3.DatabaseError(f"SQLite integrity check failed: {integrity}")

    return document_count, chunk_count, question_count


def main() -> None:
    parser = argparse.ArgumentParser(description="Import the official SQuAD v2.0 dev split into the RAG demo SQLite database.")
    parser.add_argument("--source", type=Path, default=Path("data/source/squad-dev-v2.0.json"))
    parser.add_argument("--database", type=Path, default=Path("data/squad-demo.sqlite3"))
    parser.add_argument("--force", action="store_true", help="Replace an existing output database.")
    args = parser.parse_args()
    counts = import_dataset(args.source, args.database, args.force)
    print(f"Imported {counts[0]} documents, {counts[1]} chunks, {counts[2]} questions into {args.database}")


if __name__ == "__main__":
    main()
