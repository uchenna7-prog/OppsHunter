import type { PoolClient } from "pg";
import { pool } from "../../db/pool.js";
import { ConflictError, ValidationError } from "../../lib/errors.js";

export type Row = Record<string, unknown>;

export type SectionName =
  | "educations"
  | "work-experiences"
  | "projects"
  | "certifications"
  | "achievements"
  | "links";

interface SectionConfig {
  table: string;
  columns: readonly string[];
  orderBy: string;
}

const SECTIONS: Record<SectionName, SectionConfig> = {
  educations: {
    table: "educations",
    columns: ["institution", "level", "field_of_study", "start_date", "end_date", "grade", "description"],
    orderBy: "end_date DESC NULLS FIRST, start_date DESC NULLS LAST, created_at DESC",
  },
  "work-experiences": {
    table: "work_experiences",
    columns: [
      "title",
      "organization",
      "location",
      "employment_type",
      "start_date",
      "end_date",
      "description",
    ],
    orderBy: "end_date DESC NULLS FIRST, start_date DESC, created_at DESC",
  },
  projects: {
    table: "projects",
    columns: ["name", "description", "url", "start_date", "end_date"],
    orderBy: "end_date DESC NULLS FIRST, start_date DESC NULLS LAST, created_at DESC",
  },
  certifications: {
    table: "certifications",
    columns: ["name", "issuer", "issued_date", "expiry_date", "credential_url"],
    orderBy: "issued_date DESC NULLS LAST, created_at DESC",
  },
  achievements: {
    table: "achievements",
    columns: ["kind", "title", "organization", "achieved_on", "description", "url"],
    orderBy: "achieved_on DESC NULLS LAST, created_at DESC",
  },
  links: {
    table: "profile_links",
    columns: ["kind", "url"],
    orderBy: "created_at ASC",
  },
};

const PROFILE_COLUMNS: readonly string[] = [
  "display_name",
  "display_name_changed_at",
  "avatar_url",
  "headline",
  "summary",
  "phone",
  "country",
  "nationality",
  "city",
  "timezone",
  "current_status",
  "years_of_experience",
  "interests",
  "career_goals",
  "onboarding_completed_at",
];

const PREFERENCE_COLUMNS: readonly string[] = [
  "remote_preference",
  "willing_to_relocate",
  "needs_visa_sponsorship",
  "available_from",
  "employment_types",
  "salary_min",
  "salary_max",
  "salary_currency",
  "salary_period",
];

const PRIVATE_COLUMNS: readonly string[] = ["date_of_birth", "gender", "disability_status"];

export function isSectionName(value: string): value is SectionName {
  return Object.prototype.hasOwnProperty.call(SECTIONS, value);
}

function toCamelKey(key: string): string {
  return key.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

function toSnakeKey(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function camelizeRow(row: Row): Row {
  const result: Row = {};
  for (const [key, value] of Object.entries(row)) {
    result[toCamelKey(key)] = value;
  }
  return result;
}

function pickColumns(allowed: readonly string[], fields: Row): [string, unknown][] {
  const picked: [string, unknown][] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    const column = toSnakeKey(key);
    if (allowed.includes(column)) picked.push([column, value]);
  }
  return picked;
}

function mapDbError(err: unknown): never {
  const code =
    typeof err === "object" && err !== null ? (err as { code?: string }).code : undefined;

  if (code === "23514") throw new ValidationError("Some of the values are not allowed");
  if (code === "23505") throw new ConflictError("This item already exists");
  if (code === "23503") throw new ValidationError("Something you referenced does not exist");
  throw err;
}

async function inTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    return mapDbError(err);
  } finally {
    client.release();
  }
}

export async function createProfileIfMissing(
  userId: string,
  displayName: string | null,
  avatarUrl: string | null
): Promise<void> {
  await pool.query(
    `INSERT INTO profiles (user_id, display_name, avatar_url)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, displayName, avatarUrl]
  );
}

export async function findProfile(userId: string): Promise<Row | null> {
  const result = await pool.query(`SELECT * FROM profiles WHERE user_id = $1`, [userId]);
  return result.rows[0] ? camelizeRow(result.rows[0]) : null;
}

export async function updateProfileRow(userId: string, fields: Row): Promise<Row> {
  const entries = pickColumns(PROFILE_COLUMNS, fields);

  if (entries.length === 0) {
    const current = await findProfile(userId);
    return current!;
  }

  const setClause = entries.map(([column], index) => `${column} = $${index + 2}`).join(", ");

  try {
    const result = await pool.query(
      `UPDATE profiles SET ${setClause} WHERE user_id = $1 RETURNING *`,
      [userId, ...entries.map(([, value]) => value)]
    );
    return camelizeRow(result.rows[0]);
  } catch (err) {
    return mapDbError(err);
  }
}

async function upsertOneToOne(
  table: string,
  allowed: readonly string[],
  userId: string,
  fields: Row
): Promise<Row> {
  const entries = pickColumns(allowed, fields);
  const columns = ["user_id", ...entries.map(([column]) => column)];
  const values = [userId, ...entries.map(([, value]) => value)];
  const placeholders = columns.map((_column, index) => `$${index + 1}`).join(", ");
  const updates =
    entries.length > 0
      ? entries.map(([column]) => `${column} = EXCLUDED.${column}`).join(", ")
      : "user_id = EXCLUDED.user_id";

  try {
    const result = await pool.query(
      `INSERT INTO ${table} (${columns.join(", ")})
       VALUES (${placeholders})
       ON CONFLICT (user_id) DO UPDATE SET ${updates}
       RETURNING *`,
      values
    );
    return camelizeRow(result.rows[0]);
  } catch (err) {
    return mapDbError(err);
  }
}

export async function findPreferences(userId: string): Promise<Row | null> {
  const result = await pool.query(`SELECT * FROM profile_preferences WHERE user_id = $1`, [userId]);
  return result.rows[0] ? camelizeRow(result.rows[0]) : null;
}

export async function upsertPreferences(userId: string, fields: Row): Promise<Row> {
  return upsertOneToOne("profile_preferences", PREFERENCE_COLUMNS, userId, fields);
}

export async function findPrivateDetails(userId: string): Promise<Row | null> {
  const result = await pool.query(`SELECT * FROM profile_private_details WHERE user_id = $1`, [
    userId,
  ]);
  return result.rows[0] ? camelizeRow(result.rows[0]) : null;
}

export async function upsertPrivateDetails(userId: string, fields: Row): Promise<Row> {
  return upsertOneToOne("profile_private_details", PRIVATE_COLUMNS, userId, fields);
}

export async function searchSkills(query: string, limit = 10): Promise<Row[]> {
  const escaped = query.replace(/[\\%_]/g, "\\$&");
  const result = await pool.query(
    `SELECT id, name FROM skills WHERE name ILIKE $1 ORDER BY name ASC LIMIT $2`,
    [`%${escaped}%`, limit]
  );
  return result.rows.map(camelizeRow);
}

export async function listProfileSkills(userId: string): Promise<Row[]> {
  const result = await pool.query(
    `SELECT s.id, s.name, ps.proficiency
     FROM profile_skills ps
     JOIN skills s ON s.id = ps.skill_id
     WHERE ps.user_id = $1
     ORDER BY s.name ASC`,
    [userId]
  );
  return result.rows.map(camelizeRow);
}

export async function replaceProfileSkills(
  userId: string,
  skills: { name: string; proficiency: string | null }[]
): Promise<void> {
  await inTransaction(async (client) => {
    await client.query(`DELETE FROM profile_skills WHERE user_id = $1`, [userId]);

    for (const skill of skills) {
      const created = await client.query(
        `INSERT INTO skills (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [skill.name]
      );
      await client.query(
        `INSERT INTO profile_skills (user_id, skill_id, proficiency)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, skill_id) DO NOTHING`,
        [userId, created.rows[0].id, skill.proficiency]
      );
    }
  });
}

export async function listTargetRoles(userId: string): Promise<string[]> {
  const result = await pool.query(
    `SELECT title FROM profile_target_roles WHERE user_id = $1 ORDER BY title ASC`,
    [userId]
  );
  return result.rows.map((row) => row.title as string);
}

export async function replaceTargetRoles(userId: string, roles: string[]): Promise<void> {
  await inTransaction(async (client) => {
    await client.query(`DELETE FROM profile_target_roles WHERE user_id = $1`, [userId]);
    if (roles.length > 0) {
      await client.query(
        `INSERT INTO profile_target_roles (user_id, title)
         SELECT $1::uuid, unnest($2::text[])
         ON CONFLICT DO NOTHING`,
        [userId, roles]
      );
    }
  });
}

export async function listPreferredLocations(userId: string): Promise<Row[]> {
  const result = await pool.query(
    `SELECT country, city FROM profile_preferred_locations
     WHERE user_id = $1
     ORDER BY country ASC, city ASC NULLS FIRST`,
    [userId]
  );
  return result.rows.map(camelizeRow);
}

export async function replacePreferredLocations(
  userId: string,
  locations: { country: string; city: string }[]
): Promise<void> {
  await inTransaction(async (client) => {
    await client.query(`DELETE FROM profile_preferred_locations WHERE user_id = $1`, [userId]);
    if (locations.length > 0) {
      await client.query(
        `INSERT INTO profile_preferred_locations (user_id, country, city)
         SELECT $1::uuid, l.country, NULLIF(l.city, '')
         FROM unnest($2::text[], $3::text[]) AS l(country, city)
         ON CONFLICT DO NOTHING`,
        [userId, locations.map((l) => l.country), locations.map((l) => l.city)]
      );
    }
  });
}

export async function listLanguages(userId: string): Promise<Row[]> {
  const result = await pool.query(
    `SELECT language, proficiency FROM profile_languages WHERE user_id = $1 ORDER BY language ASC`,
    [userId]
  );
  return result.rows.map(camelizeRow);
}

export async function replaceLanguages(
  userId: string,
  languages: { language: string; proficiency: string }[]
): Promise<void> {
  await inTransaction(async (client) => {
    await client.query(`DELETE FROM profile_languages WHERE user_id = $1`, [userId]);
    if (languages.length > 0) {
      await client.query(
        `INSERT INTO profile_languages (user_id, language, proficiency)
         SELECT $1::uuid, l.language, l.proficiency
         FROM unnest($2::text[], $3::text[]) AS l(language, proficiency)
         ON CONFLICT DO NOTHING`,
        [userId, languages.map((l) => l.language), languages.map((l) => l.proficiency)]
      );
    }
  });
}

export async function listAllOpportunityTypes(): Promise<Row[]> {
  const result = await pool.query(
    `SELECT id, slug, name FROM opportunity_types ORDER BY sort_order ASC, name ASC`
  );
  return result.rows.map(camelizeRow);
}

export async function listOpportunityTypePreferences(userId: string): Promise<Row[]> {
  const result = await pool.query(
    `SELECT ot.id, ot.slug, ot.name, (p.user_id IS NOT NULL) AS selected
     FROM opportunity_types ot
     LEFT JOIN profile_opportunity_type_preferences p
       ON p.opportunity_type_id = ot.id AND p.user_id = $1
     ORDER BY ot.sort_order ASC, ot.name ASC`,
    [userId]
  );
  return result.rows.map(camelizeRow);
}

export async function replaceOpportunityTypePreferences(
  userId: string,
  typeIds: string[]
): Promise<void> {
  await inTransaction(async (client) => {
    await client.query(`DELETE FROM profile_opportunity_type_preferences WHERE user_id = $1`, [
      userId,
    ]);
    if (typeIds.length > 0) {
      await client.query(
        `INSERT INTO profile_opportunity_type_preferences (user_id, opportunity_type_id)
         SELECT $1::uuid, unnest($2::uuid[])
         ON CONFLICT DO NOTHING`,
        [userId, typeIds]
      );
    }
  });
}

export async function listSection(section: SectionName, userId: string): Promise<Row[]> {
  const config = SECTIONS[section];
  const result = await pool.query(
    `SELECT * FROM ${config.table} WHERE user_id = $1 ORDER BY ${config.orderBy}`,
    [userId]
  );
  return result.rows.map(camelizeRow);
}

export async function createSectionItem(
  section: SectionName,
  userId: string,
  fields: Row
): Promise<Row> {
  const config = SECTIONS[section];
  const entries = pickColumns(config.columns, fields);
  const columns = ["user_id", ...entries.map(([column]) => column)];
  const values = [userId, ...entries.map(([, value]) => value)];
  const placeholders = columns.map((_column, index) => `$${index + 1}`).join(", ");

  try {
    const result = await pool.query(
      `INSERT INTO ${config.table} (${columns.join(", ")})
       VALUES (${placeholders})
       RETURNING *`,
      values
    );
    return camelizeRow(result.rows[0]);
  } catch (err) {
    return mapDbError(err);
  }
}

export async function updateSectionItem(
  section: SectionName,
  userId: string,
  itemId: string,
  fields: Row
): Promise<Row | null> {
  const config = SECTIONS[section];
  const entries = pickColumns(config.columns, fields);

  try {
    if (entries.length === 0) {
      const current = await pool.query(
        `SELECT * FROM ${config.table} WHERE id = $1 AND user_id = $2`,
        [itemId, userId]
      );
      return current.rows[0] ? camelizeRow(current.rows[0]) : null;
    }

    const setClause = entries.map(([column], index) => `${column} = $${index + 3}`).join(", ");
    const result = await pool.query(
      `UPDATE ${config.table} SET ${setClause}
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [itemId, userId, ...entries.map(([, value]) => value)]
    );
    return result.rows[0] ? camelizeRow(result.rows[0]) : null;
  } catch (err) {
    return mapDbError(err);
  }
}

export async function deleteSectionItem(
  section: SectionName,
  userId: string,
  itemId: string
): Promise<boolean> {
  const config = SECTIONS[section];
  const result = await pool.query(`DELETE FROM ${config.table} WHERE id = $1 AND user_id = $2`, [
    itemId,
    userId,
  ]);
  return (result.rowCount ?? 0) > 0;
}

export async function listDocuments(userId: string): Promise<Row[]> {
  const result = await pool.query(
    `SELECT id, kind, file_name, mime_type, size_bytes, is_primary, created_at
     FROM profile_documents
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows.map(camelizeRow);
}