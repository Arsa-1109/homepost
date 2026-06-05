import asyncio
import os
import urllib.parse

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Load from .env if present
env_path = os.path.join(os.path.dirname(__file__), ".env")
DB_URL = "postgresql+psycopg://postgres:REPLACED_SECRET@acela.proxy.rlwy.net:50955/railway"
if os.path.exists(env_path):
    with open(env_path, "r") as f:
        for line in f:
            if line.startswith("DATABASE_URL="):
                DB_URL = line.strip().split("=")[1].strip('"').strip("'")
                # Ensure it uses psycopg
                if DB_URL.startswith("postgresql://"):
                    DB_URL = DB_URL.replace("postgresql://", "postgresql+psycopg://")
                elif DB_URL.startswith("postgres://"):
                    DB_URL = DB_URL.replace("postgres://", "postgresql+psycopg://")
                break

async def migrate():
    engine = create_async_engine(DB_URL)
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS unit_id UUID NULL;"))
            await conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_documents_unit_id_units') THEN
                    ALTER TABLE documents ADD CONSTRAINT fk_documents_unit_id_units FOREIGN KEY (unit_id) REFERENCES units(id);
                END IF;
            END;
            $$;
            """))
            print("Successfully added unit_id to documents table.")
        except Exception as e:
            print("Error migrating:", e)
    await engine.dispose()

if __name__ == "__main__":
    import sys
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(migrate())
