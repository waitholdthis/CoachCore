"""
Hybrid retrieval: dense vector search + BM25 keyword search, merged via RRF.
"""
from __future__ import annotations
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, text
from rank_bm25 import BM25Okapi
from models.rule import Rule
from services.ingestion.embedder import embed_single


async def hybrid_retrieve(
    session: AsyncSession,
    query_text: str,
    sport: str | None = None,
    age_bracket: str | None = None,
    division_type: str | None = None,
    league_id: UUID | None = None,
    categories: list[str] | None = None,
    top_k: int = 5,
) -> list[tuple[Rule, float]]:
    """
    Hybrid retrieval combining dense and keyword search with RRF fusion.
    Returns top_k (rule, score) pairs.
    """
    # Fetch candidate rules for keyword search
    stmt = select(Rule).where(Rule.embedding.is_not(None))
    filters = []
    if sport:
        filters.append(Rule.sport == sport)
    if filters:
        stmt = stmt.where(and_(*filters))

    result = await session.execute(stmt)
    candidates: list[Rule] = list(result.scalars().all())

    if not candidates:
        return []

    # BM25 keyword search
    keyword_ranks = _bm25_rank(query_text, candidates)

    # Dense vector search
    query_vector = await embed_single(
        f"Sport: {sport or 'unknown'} | Age: {age_bracket or 'unknown'} | Query: {query_text}"
    )
    dense_ranks = await _dense_rank(session, query_vector, sport, top_k * 3)

    # Reciprocal Rank Fusion
    rrf_scores = _reciprocal_rank_fusion(keyword_ranks, dense_ranks)

    # Filter by age_bracket and division_type
    filtered = []
    for rule_id, score in sorted(rrf_scores.items(), key=lambda x: -x[1])[:top_k * 2]:
        rule = next((r for r in candidates if str(r.id) == rule_id), None)
        if not rule:
            continue
        if age_bracket and not _scope_matches(rule, age_bracket, division_type or "all"):
            continue
        if league_id and rule.league_id and rule.league_id != league_id:
            continue
        if categories and rule.category not in categories:
            continue
        filtered.append((rule, score))
        if len(filtered) >= top_k:
            break

    return filtered


def _bm25_rank(query: str, rules: list[Rule]) -> dict[str, int]:
    """BM25 ranking over rule texts. Returns {rule_id: rank}."""
    tokenized_corpus = [
        (r.canonical_text + " " + (r.plain_language_text or "") + " " + r.category).lower().split()
        for r in rules
    ]
    bm25 = BM25Okapi(tokenized_corpus)
    query_tokens = query.lower().split()
    scores = bm25.get_scores(query_tokens)

    ranked = sorted(enumerate(scores), key=lambda x: -x[1])
    return {str(rules[i].id): rank + 1 for rank, (i, _) in enumerate(ranked)}


async def _dense_rank(
    session: AsyncSession,
    query_vector: list[float],
    sport: str | None,
    limit: int,
) -> dict[str, int]:
    """ANN search against pgvector. Returns {rule_id: rank}."""
    query = text("""
        SELECT id, 1 - (embedding <=> CAST(:embedding AS vector)) AS similarity
        FROM rules
        WHERE embedding IS NOT NULL
          {sport_filter}
        ORDER BY embedding <=> CAST(:embedding AS vector)
        LIMIT :limit
    """.format(sport_filter="AND sport = :sport" if sport else ""))

    params: dict = {"embedding": str(query_vector), "limit": limit}
    if sport:
        params["sport"] = sport

    result = await session.execute(query, params)
    rows = result.fetchall()
    return {str(row.id): rank + 1 for rank, row in enumerate(rows)}


def _reciprocal_rank_fusion(
    ranks1: dict[str, int],
    ranks2: dict[str, int],
    k: int = 60,
) -> dict[str, float]:
    """Merge two rank dicts using RRF: score = Σ 1/(k + rank)."""
    all_ids = set(ranks1) | set(ranks2)
    rrf: dict[str, float] = {}
    for rule_id in all_ids:
        score = 0.0
        if rule_id in ranks1:
            score += 1.0 / (k + ranks1[rule_id])
        if rule_id in ranks2:
            score += 1.0 / (k + ranks2[rule_id])
        rrf[rule_id] = score
    return rrf


def _scope_matches(rule: Rule, age_bracket: str, division_type: str) -> bool:
    scope = rule.scope or {}
    age_brackets = scope.get("age_brackets", ["all"])
    division_types = scope.get("division_types", ["all"])
    age_match = "all" in age_brackets or age_bracket in age_brackets
    div_match = "all" in division_types or division_type in division_types or division_type == "all"
    return age_match and div_match
