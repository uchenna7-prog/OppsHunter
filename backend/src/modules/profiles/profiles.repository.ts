import { pool } from "../../db/pool.js";

export interface ProfileRow {
  user_id: string;
  education_level: string | null;
  field_of_study: string | null;
  location: string | null;
  years_of_experience: number | null;
  interests: string | null;
  career_goals: string | null;
  remote_preference: string | null;
  created_at: string;
  updated_at: string;
}

export interface SkillRow {
  id: string;
  name: string;
  created_at: string;
}

export interface ProfileSkillRow {
  id: string;
  user_id: string;
  skill_id: string;
  category: "programming_language" | "general_skill";
  created_at: string;
}

export interface OpportunityTypeRow {
  id: string;
  name: string;
}

export interface CertificationRow {
  id: string;
  user_id: string;
  name: string;
  issuer: string | null;
  issued_date: string | null;
  created_at: string;
}

export async function createProfile(userId: string): Promise<ProfileRow> {
  const result = await pool.query<ProfileRow>(
    `INSERT INTO profiles (user_id) VALUES ($1) RETURNING *`,
    [userId]
  );
  return result.rows[0]!;
}

export async function findProfileByUserId(userId: string): Promise<ProfileRow | null> {
  const result = await pool.query<ProfileRow>(
    `SELECT * FROM profiles WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] ?? null;
}

export interface ProfileUpdateFields {
  education_level?: string | null;
  field_of_study?: string | null;
  location?: string | null;
  years_of_experience?: number | null;
  interests?: string | null;
  career_goals?: string | null;
  remote_preference?: string | null;
}

export async function updateProfile(
  userId: string,
  fields: ProfileUpdateFields
): Promise<ProfileRow> {
  const columns = Object.keys(fields);
  const values = Object.values(fields);

  const setClause = columns.map((col, i) => `${col} = $${i + 2}`).join(", ");

  const result = await pool.query<ProfileRow>(
    `UPDATE profiles SET ${setClause} WHERE user_id = $1 RETURNING *`,
    [userId, ...values]
  );
  return result.rows[0]!;
}

export async function findOrCreateSkillByName(name: string): Promise<SkillRow> {
  const existing = await pool.query<SkillRow>(
    `SELECT * FROM skills WHERE name = $1`,
    [name]
  );
  if (existing.rows[0]) return existing.rows[0];

  const created = await pool.query<SkillRow>(
    `INSERT INTO skills (name) VALUES ($1) RETURNING *`,
    [name]
  );
  return created.rows[0]!;
}

export async function searchSkills(query: string, limit = 10): Promise<SkillRow[]> {
  const result = await pool.query<SkillRow>(
    `SELECT * FROM skills WHERE name ILIKE $1 ORDER BY name ASC LIMIT $2`,
    [`%${query}%`, limit]
  );
  return result.rows;
}

export interface ProfileSkillWithName extends ProfileSkillRow {
  skill_name: string;
}

export async function addSkillToProfile(
  userId: string,
  skillId: string,
  category: "programming_language" | "general_skill"
): Promise<ProfileSkillRow> {
  const result = await pool.query<ProfileSkillRow>(
    `INSERT INTO profile_skills (user_id, skill_id, category)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, skill_id) DO UPDATE SET category = EXCLUDED.category
     RETURNING *`,
    [userId, skillId, category]
  );
  return result.rows[0]!;
}

export async function removeSkillFromProfile(userId: string, skillId: string): Promise<void> {
  await pool.query(
    `DELETE FROM profile_skills WHERE user_id = $1 AND skill_id = $2`,
    [userId, skillId]
  );
}

export async function listProfileSkills(userId: string): Promise<ProfileSkillWithName[]> {
  const result = await pool.query<ProfileSkillWithName>(
    `SELECT ps.*, s.name AS skill_name
     FROM profile_skills ps
     JOIN skills s ON s.id = ps.skill_id
     WHERE ps.user_id = $1
     ORDER BY s.name ASC`,
    [userId]
  );
  return result.rows;
}

export async function listAllOpportunityTypes(): Promise<OpportunityTypeRow[]> {
  const result = await pool.query<OpportunityTypeRow>(
    `SELECT * FROM opportunity_types ORDER BY name ASC`
  );
  return result.rows;
}

export async function setOpportunityTypePreferences(
  userId: string,
  opportunityTypeIds: string[]
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM profile_opportunity_type_preferences WHERE user_id = $1`,
      [userId]
    );
    for (const typeId of opportunityTypeIds) {
      await client.query(
        `INSERT INTO profile_opportunity_type_preferences (user_id, opportunity_type_id)
         VALUES ($1, $2)`,
        [userId, typeId]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export interface OpportunityTypePreferenceRow extends OpportunityTypeRow {
  selected: boolean;
}

export async function listProfileOpportunityTypePreferences(
  userId: string
): Promise<OpportunityTypePreferenceRow[]> {
  const result = await pool.query<OpportunityTypePreferenceRow>(
    `SELECT ot.id, ot.name,
            (potp.user_id IS NOT NULL) AS selected
     FROM opportunity_types ot
     LEFT JOIN profile_opportunity_type_preferences potp
       ON potp.opportunity_type_id = ot.id AND potp.user_id = $1
     ORDER BY ot.name ASC`,
    [userId]
  );
  return result.rows;
}

export async function addCertification(
  userId: string,
  name: string,
  issuer: string | null,
  issuedDate: string | null
): Promise<CertificationRow> {
  const result = await pool.query<CertificationRow>(
    `INSERT INTO certifications (user_id, name, issuer, issued_date)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, name, issuer, issuedDate]
  );
  return result.rows[0]!;
}

export async function listCertifications(userId: string): Promise<CertificationRow[]> {
  const result = await pool.query<CertificationRow>(
    `SELECT * FROM certifications WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function deleteCertification(userId: string, certificationId: string): Promise<void> {
  await pool.query(
    `DELETE FROM certifications WHERE id = $1 AND user_id = $2`,
    [certificationId, userId]
  );
}