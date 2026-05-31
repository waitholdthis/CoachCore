"""
Seed the database with baseline rules for all four sports.
Run: python -m seed.run_seed
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select, text
from models.rule import Rule
from seed.soccer import SOCCER_RULES
from seed.baseball import BASEBALL_RULES
from seed.basketball import BASKETBALL_RULES
from seed.football import FOOTBALL_RULES
from config import get_settings

settings = get_settings()

ALL_RULES = SOCCER_RULES + BASEBALL_RULES + BASKETBALL_RULES + FOOTBALL_RULES


async def seed_rules(session: AsyncSession) -> None:
    existing = await session.scalar(select(Rule).limit(1))
    if existing:
        print("Baseline rules already seeded. Skipping.")
        return

    print(f"Seeding {len(ALL_RULES)} baseline rules...")
    rules_created = 0

    for rule_data in ALL_RULES:
        scope = rule_data.pop("scope", {})
        # Normalize scope to JSON-serializable dict
        rule = Rule(
            **rule_data,
            scope={
                "age_brackets": scope.get("age_brackets", ["all"]),
                "division_types": scope.get("division_types", ["all"]),
                "league_levels": scope.get("league_levels", ["all"]),
            },
        )
        session.add(rule)
        rules_created += 1

    await session.commit()
    print(f"✓ Seeded {rules_created} baseline rules.")

    # Now generate embeddings for all rules
    from services.ingestion.embedder import batch_embed_rules
    print("Generating embeddings for baseline rules...")
    await batch_embed_rules(session)
    print("✓ Embeddings generated.")

    # Create IVFFlat index after data is loaded
    await session.execute(text(
        "CREATE INDEX IF NOT EXISTS rules_embedding_idx ON rules "
        "USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)"
    ))
    await session.commit()
    print("✓ Vector index created.")


async def main() -> None:
    engine = create_async_engine(settings.database_url, echo=False)
    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with SessionLocal() as session:
        await seed_rules(session)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
