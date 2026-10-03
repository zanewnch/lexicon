# RAG Demo Data

The SQLite demo database is generated from the official SQuAD 2.0 development split.

- Dataset: [Stanford Question Answering Dataset (SQuAD)](https://rajpurkar.github.io/SQuAD-explorer/)
- Source JSON: [dev-v2.0.json](https://rajpurkar.github.io/SQuAD-explorer/dataset/dev-v2.0.json)
- License: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- Attribution: Rajpurkar et al., Stanford Question Answering Dataset; source passages are Wikipedia articles.

This project stores each source paragraph as a chunk and keeps its questions and answer spans linked to that chunk. SQuAD 2.0 includes questions that cannot be answered from the paragraph, which is useful for demonstrating retrieval and abstention. The dataset is shared under CC BY-SA 4.0; preserve attribution and the license when redistributing the dataset or adapted data.

## Rebuild the database

From `resume/one`:

```powershell
python scripts/import_squad_demo.py
```

The importer uses Python's built-in `sqlite3` module and refuses to overwrite an existing database unless `--force` is supplied.
