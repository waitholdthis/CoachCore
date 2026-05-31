"""
Embedding service using OpenAI text-embedding-3-large (1536 dims).
Handles batch processing and rate limiting.
"""
from __future__ import annotations
import asyncio
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from models.rule import Rule
from config import get_settings

settings = get_settings()
_client: AsyncOpenAI | None = None

BATCH_SIZE = 100  # embeddings per API call
RATE_LIMIT_SLEEP = 0.5  # seconds between batches


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a list of texts. Returns parallel list of embedding vectors."""
    if not texts:
        return []

    response = await get_client().embeddings.create(
        model=settings.embedding_model,
        input=texts,
        dimensions=settings.embedding_dimensions,
    )
    return [item.embedding for item in sorted(response.data, key=lambda x: x.index)]


async def embed_single(text: str) -> list[float]:
    result = await embed_texts([text])
    return result[0] if result else []


async def batch_embed_rules(session: AsyncSession) -> int:
    """Generate and store embeddings for all rules that don't have one yet."""
    result = await session.execute(select(Rule).where(Rule.embedding.is_(None)))
    rules_without_embeddings: list[Rule] = list(result.scalars().all())

    if not rules_without_embeddings:
        return 0

    total = 0
    for i in range(0, len(rules_without_embeddings), BATCH_SIZE):
        batch = rules_without_embeddings[i : i + BATCH_SIZE]
        texts = [_rule_to_embed_text(r) for r in batch]
        vectors = await embed_texts(texts)

        for rule, vector in zip(batch, vectors):
            rule.embedding = vector
            session.add(rule)

        await session.commit()
        total += len(batch)

        if i + BATCH_SIZE < len(rules_without_embeddings):
            await asyncio.sleep(RATE_LIMIT_SLEEP)

    return total


def _rule_to_embed_text(rule: Rule) -> str:
    """Construct a rich text representation of a rule for embedding."""
    parts = [
        f"Sport: {rule.sport}",
        f"Category: {rule.category}",
    ]
    if rule.subcategory:
        parts.append(f"Subcategory: {rule.subcategory}")

    scope = rule.scope or {}
    age_brackets = scope.get("age_brackets", ["all"])
    division_types = scope.get("division_types", ["all"])
    if age_brackets != ["all"]:
        parts.append(f"Age brackets: {', '.join(age_brackets)}")
    if division_types != ["all"]:
        parts.append(f"Division types: {', '.join(division_types)}")

    parts.append(f"Rule: {rule.canonical_text}")
    if rule.plain_language_text:
        parts.append(f"Plain language: {rule.plain_language_text}")

    return "\n".join(parts)
