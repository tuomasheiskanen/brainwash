// Applies Brainwash' migrations to the shared hosted Supabase project.
//
// The hosted project is shared with other personal apps (one schema each), and
// the Supabase CLI's own migration history there belongs to the project hub.
// So Brainwash can't use `supabase db push`. Instead this script keeps its own
// history in `brainwash.schema_migrations` and runs each pending file,
// together with its history row, in one transaction through
// `supabase db query --remote`.
//
//   npm run db:push              lists the migrations that would be applied
//   npm run db:push -- --apply   applies them
//
// GitHub Actions runs it with --apply on every push to main that touches
// supabase/migrations (.github/workflows/deploy-migrations.yml).

import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PROJECT_REF = "rgwyvoatqhkvejgeewqi"; // the shared Supabase project
const MIGRATIONS_DIR = "supabase/migrations";
const apply = process.argv.includes("--apply");

function query(args) {
  const out = execFileSync(
    "npx",
    ["supabase", "db", "query", `--remote=${PROJECT_REF}`, "--output-format", "json", ...args],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  );
  const result = JSON.parse(out);
  if (result.error) throw new Error(result.error.message ?? JSON.stringify(result.error));
  return result.rows ?? [];
}

const [{ exists }] = query([
  "--read-only",
  "select to_regclass('brainwash.schema_migrations') is not null as exists",
]);
const applied = new Set(
  exists
    ? query(["--read-only", "select version from brainwash.schema_migrations"]).map((row) => row.version)
    : [],
);

const pending = readdirSync(MIGRATIONS_DIR)
  .filter((name) => name.endsWith(".sql"))
  .sort()
  .map((name) => ({ name, version: name.split("_")[0] }))
  .filter((m) => !applied.has(m.version));

if (pending.length === 0) {
  console.log("The shared project is up to date.");
  process.exit(0);
}

console.log(`${pending.length} migration(s) not yet applied to the shared project:`);
for (const m of pending) console.log(`  ${m.name}`);

if (!apply) {
  console.log("\nRun `npm run db:push -- --apply` to apply them.");
  process.exit(0);
}

const dir = mkdtempSync(join(tmpdir(), "brainwash-migrate-"));
try {
  for (const m of pending) {
    const sql = readFileSync(join(MIGRATIONS_DIR, m.name), "utf8");
    const file = join(dir, m.name);
    writeFileSync(
      file,
      `begin;
create schema if not exists brainwash;
create table if not exists brainwash.schema_migrations (
  version text primary key,
  name text not null,
  applied_at timestamptz not null default now()
);
-- The brainwash schema is exposed through the Data API: keep this table out of it.
alter table brainwash.schema_migrations enable row level security;
revoke all on brainwash.schema_migrations from anon, authenticated;

${sql}

insert into brainwash.schema_migrations (version, name) values ('${m.version}', '${m.name}');
commit;
`,
    );
    query(["--yes", "-f", file]);
    console.log(`Applied ${m.name}`);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
