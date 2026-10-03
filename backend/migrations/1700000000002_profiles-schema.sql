-- Up Migration
CREATE TYPE education_level AS ENUM (
  'secondary', 'undergraduate', 'graduate', 'postgraduate', 'doctorate', 'other'
);

CREATE TYPE remote_preference AS ENUM ('remote', 'onsite', 'hybrid', 'any');

CREATE TYPE skill_category AS ENUM ('programming_language', 'general_skill');

CREATE TABLE profiles (
  user_id             uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  education_level     education_level,
  field_of_study      text,
  location            text,
  years_of_experience integer,
  interests           text,
  career_goals        text,
  remote_preference   remote_preference,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE skills (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       citext NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE profile_skills (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  skill_id   uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  category   skill_category NOT NULL DEFAULT 'general_skill',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_id)
);
CREATE INDEX profile_skills_user_idx ON profile_skills(user_id);
CREATE INDEX profile_skills_skill_idx ON profile_skills(skill_id);

CREATE TABLE opportunity_types (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name citext NOT NULL UNIQUE
);

INSERT INTO opportunity_types (name) VALUES
  ('Job'), ('Internship'), ('SIWES/IT Placement'), ('Hackathon'),
  ('Scholarship'), ('Fellowship'), ('Grant'), ('Competition'),
  ('Developer Program'), ('Graduate Opportunity'), ('Freelance'), ('Other');

CREATE TABLE profile_opportunity_type_preferences (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  opportunity_type_id uuid NOT NULL REFERENCES opportunity_types(id) ON DELETE CASCADE,
  UNIQUE (user_id, opportunity_type_id)
);
CREATE INDEX profile_opp_prefs_user_idx ON profile_opportunity_type_preferences(user_id);

CREATE TABLE certifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  name        text NOT NULL,
  issuer      text,
  issued_date date,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX certifications_user_idx ON certifications(user_id);

-- Down Migration
DROP TABLE certifications, profile_opportunity_type_preferences, opportunity_types,
           profile_skills, skills, profiles;
DROP TYPE skill_category, remote_preference, education_level;