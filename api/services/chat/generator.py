"""
RAG answer generator with hard citation enforcement.
Grounded responses only — no hallucinations.
"""
from __future__ import annotations
from datetime import datetime
from uuid import UUID
from anthropic import AsyncAnthropic
from sqlalchemy.ext.asyncio import AsyncSession
from models.rule import Rule
from models.enums import RuleTier, SAFETY_CRITICAL_CATEGORIES, Sport
from schemas.chat import ChatQuery, ChatResponse, ChatSource
from services.chat.query_rewriter import rewrite_query
from services.chat.retriever import hybrid_retrieve
from config import get_settings

settings = get_settings()
_client: AsyncAnthropic | None = None


def get_client() -> AsyncAnthropic:
    global _client
    if _client is None:
        _client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


_SYSTEM_PROMPT = """You are CoachCore, a youth sports rules assistant. You help coaches and parents understand the rules that apply to their specific team.

CRITICAL RULES:
1. ONLY answer using the retrieved rules provided in the context. NEVER invent or assume rules.
2. If the context does not contain enough information to answer confidently, say exactly: "I don't have enough information in your league's rulebook to answer this definitively. Please check with your league administrator."
3. ALWAYS cite the source for every factual claim using [Source N] notation.
4. If a rule has safety implications, add a brief safety note.
5. Keep answers concise and practical — coaches read this on the sideline.
6. Never answer questions outside of the four supported sports (soccer, baseball, basketball, football).

FORMAT: Plain prose. Cite sources as [Source 1], [Source 2], etc. List exceptions and edge cases as bullet points."""

_USER_PROMPT_TEMPLATE = """ACTIVE RULE CONTEXT:
Sport: {sport} | Age: {age_bracket} | Division: {division_type} | League: {league_label}

RETRIEVED RULES (priority order):
{rules_context}

USER QUESTION: {question}

Answer the question using ONLY the rules above. Cite every fact."""


def _format_rule_context(rules: list[tuple[Rule, float]]) -> tuple[str, list[ChatSource]]:
    """Format retrieved rules into a prompt context block and source list."""
    context_parts = []
    sources: list[ChatSource] = []

    for i, (rule, score) in enumerate(rules, start=1):
        source_label = _build_source_label(rule)
        tier_label = rule.rule_tier.value if hasattr(rule.rule_tier, 'value') else str(rule.rule_tier)

        context_parts.append(
            f"[Source {i}] {source_label} (confidence: {score:.2f}):\n"
            f"\"{rule.canonical_text}\""
        )
        if rule.plain_language_text:
            context_parts.append(f"  Plain: {rule.plain_language_text}")

        sources.append(ChatSource(
            rule_id=rule.id,
            canonical_text=rule.canonical_text,
            source_label=source_label,
            rule_tier=tier_label,
            confidence=score,
        ))

    return "\n\n".join(context_parts), sources


def _build_source_label(rule: Rule) -> str:
    tier = rule.rule_tier.value if hasattr(rule.rule_tier, 'value') else str(rule.rule_tier)
    if tier == "local":
        label = "Local Rulebook"
        if rule.source_page:
            label += f" p.{rule.source_page}"
        if rule.source_paragraph:
            label += f", §{rule.source_paragraph}"
        return label
    return rule.governing_body_source or "Standard Baseline"


async def answer_question(
    query: ChatQuery,
    session: AsyncSession,
) -> ChatResponse:
    """Generate a grounded, cited answer to a rules question."""
    # Rewrite query to extract structured parameters
    params = await rewrite_query(query)

    sport = params.get("sport") or (query.sport.value if query.sport else None)
    age_bracket = params.get("age_bracket") or query.age_bracket or "all"
    division_type = params.get("division_type") or query.division_type or "recreational"
    categories = params.get("rule_categories")

    if not sport:
        return ChatResponse(
            answer="I need to know which sport you're asking about. Could you specify soccer, baseball, basketball, or football?",
            sources=[],
            scope_used={"sport": None},
            generated_at=datetime.utcnow(),
        )

    # Retrieve relevant rules
    retrieved = await hybrid_retrieve(
        session=session,
        query_text=query.question,
        sport=sport,
        age_bracket=age_bracket,
        division_type=division_type,
        league_id=query.league_id,
        categories=categories,
        top_k=5,
    )

    if not retrieved:
        return ChatResponse(
            answer="I don't have enough information in your league's rulebook to answer this definitively. Please check with your league administrator.",
            sources=[],
            scope_used={"sport": sport, "age_bracket": age_bracket, "division_type": division_type},
            generated_at=datetime.utcnow(),
        )

    rules_context, sources = _format_rule_context(retrieved)
    league_label = f"League {query.league_id}" if query.league_id else "Standard (no league selected)"

    user_prompt = _USER_PROMPT_TEMPLATE.format(
        sport=sport,
        age_bracket=age_bracket,
        division_type=division_type,
        league_label=league_label,
        rules_context=rules_context,
        question=query.question,
    )

    # Build conversation history for multi-turn
    messages = []
    for msg in query.conversation_history[-6:]:  # last 3 turns
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": user_prompt})

    response = await get_client().messages.create(
        model=settings.llm_model,
        max_tokens=1024,
        temperature=0.1,
        system=_SYSTEM_PROMPT,
        messages=messages,
    )

    answer_text = response.content[0].text

    # Build safety notice if query is safety-relevant
    safety_notice: str | None = None
    if params.get("safety_relevant") or any(s.rule_tier == "local" for s in sources):
        sport_enum = Sport(sport) if isinstance(sport, str) else sport
        safety_cats = SAFETY_CRITICAL_CATEGORIES.get(sport_enum, [])
        if any(r.category in safety_cats for r, _ in retrieved):
            safety_notice = (
                "⚠ This involves a safety-critical rule. Always verify with your "
                "official league documentation and a qualified official."
            )

    # Ambiguity notice if retrieved rules have low certainty
    ambiguity_notice: str | None = None
    low_certainty_rules = [r for r, _ in retrieved if r.normative_certainty and r.normative_certainty < 0.65]
    if low_certainty_rules:
        ambiguity_notice = (
            "Note: Some retrieved rules use ambiguous language (e.g., 'should' or 'generally'). "
            "Confirm enforcement intent with your league."
        )

    return ChatResponse(
        answer=answer_text,
        sources=sources,
        safety_notice=safety_notice,
        ambiguity_notice=ambiguity_notice,
        scope_used={
            "sport": sport,
            "age_bracket": age_bracket,
            "division_type": division_type,
            "league_id": str(query.league_id) if query.league_id else None,
        },
        generated_at=datetime.utcnow(),
    )
