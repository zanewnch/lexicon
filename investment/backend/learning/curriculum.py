import json
from functools import lru_cache
from pathlib import Path


@lru_cache(maxsize=1)
def get_curriculum() -> dict:
    path = Path(__file__).resolve().parent / 'data' / 'curriculum.json'
    with path.open(encoding='utf-8') as file:
        return json.load(file)


def get_node_ids() -> set[str]:
    return {node['id'] for node in get_curriculum()['nodes']}
