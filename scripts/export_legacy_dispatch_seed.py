from __future__ import annotations

import json
import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = Path(r"c:\Users\Main User\Desktop\PROJECTS (V)\BACKUP FILES - Dispatch Tool\activity_logs.db")
OUTPUT_SQL = ROOT / "supabase" / "migrations" / "20260427170100_import_legacy_dispatch_seed.sql"

DSP_CODE_MAP = {
    "armm": "ARMM",
    "tlc": "TLC",
    "portkey": "PORTKEY",
    "mstar": "MSTAR",
}

PAYLOAD_TABLES = {
    "associate_data_entries": "associate_data",
    "vehicle_data_entries": "vehicle_data",
}


def sql_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def json_sql(value: str) -> str:
    return sql_quote(value) + "::jsonb"


def fetch_phone_rows(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    return conn.execute(
        """
        SELECT dsp_key, label, last_name, work_phone, home_phone, mobile_phone, updated_at
        FROM phone_list_entries
        WHERE dsp_key IN ('armm', 'tlc', 'portkey', 'mstar')
        ORDER BY dsp_key, label, id
        """
    ).fetchall()


def fetch_payload_rows(conn: sqlite3.Connection, table_name: str) -> list[sqlite3.Row]:
    return conn.execute(
        f"""
        SELECT dsp_key, raw_payload, updated_at
        FROM {table_name}
        WHERE dsp_key IN ('armm', 'tlc', 'portkey', 'mstar')
        ORDER BY dsp_key
        """
    ).fetchall()


def build_sql(db_path: Path) -> str:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    phone_rows = fetch_phone_rows(conn)
    payload_rows = {
        table_name: fetch_payload_rows(conn, table_name)
        for table_name in PAYLOAD_TABLES
    }

    lines: list[str] = [
        "-- Generated from legacy SQLite backup on 2026-04-27.",
        "DO $$",
        "DECLARE",
        "  dsp_map JSONB := jsonb_build_object(",
        "    'armm', (SELECT id FROM public.dsps WHERE code = 'ARMM'),",
        "    'tlc', (SELECT id FROM public.dsps WHERE code = 'TLC'),",
        "    'portkey', (SELECT id FROM public.dsps WHERE code = 'PORTKEY'),",
        "    'mstar', (SELECT id FROM public.dsps WHERE code = 'MSTAR')",
        "  );",
        "BEGIN",
        "  DELETE FROM public.legacy_phone_list_entries;",
        "  DELETE FROM public.legacy_dsp_payloads;",
    ]

    dsp_sort_orders: dict[str, int] = {}
    for row in phone_rows:
        dsp_key = row["dsp_key"]
        dsp_sort_orders[dsp_key] = dsp_sort_orders.get(dsp_key, 0) + 1
        sort_order = dsp_sort_orders[dsp_key]
        lines.append(
            "  INSERT INTO public.legacy_phone_list_entries "
            "(dsp_id, sort_order, label, last_name, work_phone, home_phone, mobile_phone, updated_at) "
            "VALUES ("
            f"(dsp_map ->> {sql_quote(dsp_key)})::uuid, "
            f"{sort_order}, "
            f"{sql_quote(row['label'] or '')}, "
            f"{sql_quote(row['last_name'] or '')}, "
            f"{sql_quote(row['work_phone'] or '')}, "
            f"{sql_quote(row['home_phone'] or '')}, "
            f"{sql_quote(row['mobile_phone'] or '')}, "
            f"{sql_quote(row['updated_at'] or '')}::timestamptz"
            ");"
        )

    for table_name, payload_key in PAYLOAD_TABLES.items():
        for row in payload_rows[table_name]:
            raw_payload = row["raw_payload"] or "[]"
            json.loads(raw_payload)
            lines.append(
                "  INSERT INTO public.legacy_dsp_payloads "
                "(dsp_id, payload_key, raw_payload, updated_at) "
                "VALUES ("
                f"(dsp_map ->> {sql_quote(row['dsp_key'])})::uuid, "
                f"{sql_quote(payload_key)}, "
                f"{json_sql(raw_payload)}, "
                f"{sql_quote(row['updated_at'] or '')}::timestamptz"
                ") "
                "ON CONFLICT (dsp_id, payload_key) DO UPDATE SET "
                "raw_payload = EXCLUDED.raw_payload, "
                "updated_at = EXCLUDED.updated_at;"
            )

    lines.extend(["END $$;"])
    return "\n".join(lines) + "\n"


def main() -> None:
    sql = build_sql(DEFAULT_DB)
    OUTPUT_SQL.write_text(sql, encoding="utf-8")
    print(f"Wrote {OUTPUT_SQL}")


if __name__ == "__main__":
    main()
