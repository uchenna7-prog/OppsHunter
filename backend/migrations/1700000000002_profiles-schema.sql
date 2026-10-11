-- Up Migration
CREATE TABLE profiles (
  user_id                 uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name            text CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 30),
  display_name_changed_at timestamptz,
  avatar_url              text CHECK (char_length(avatar_url) <= 500),
  headline                text CHECK (char_length(headline) <= 120),
  summary                 text CHECK (char_length(summary) <= 2000),
  phone                   text CHECK (char_length(phone) <= 30),
  country                 char(2) CHECK (country ~ '^[A-Z]{2}$'),
  nationality             char(2) CHECK (nationality ~ '^[A-Z]{2}$'),
  city                    text CHECK (char_length(city) <= 100),
  timezone                text CHECK (char_length(timezone) <= 64),
  current_status          text CHECK (current_status IN (
                            'student', 'employed', 'self_employed', 'unemployed',
                            'between_jobs', 'retired', 'other'
                          )),
  years_of_experience     smallint CHECK (years_of_experience BETWEEN 0 AND 80),
  interests               text CHECK (char_length(interests) <= 2000),
  career_goals            text CHECK (char_length(career_goals) <= 2000),
  onboarding_completed_at timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE profile_preferences (
  user_id                uuid PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
  remote_preference      text CHECK (remote_preference IN ('remote', 'onsite', 'hybrid', 'any')),
  willing_to_relocate    boolean,
  needs_visa_sponsorship boolean,
  available_from         date,
  employment_types       text[] NOT NULL DEFAULT '{}'
                         CHECK (employment_types <@ ARRAY[
                           'full_time', 'part_time', 'contract', 'freelance', 'internship', 'volunteer'
                         ]::text[]),
  salary_min             integer CHECK (salary_min >= 0),
  salary_max             integer CHECK (salary_max >= 0),
  salary_currency        char(3) CHECK (salary_currency ~ '^[A-Z]{3}$'),
  salary_period          text CHECK (salary_period IN ('hour', 'day', 'month', 'year')),
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_max >= salary_min),
  CHECK ((salary_min IS NULL AND salary_max IS NULL)
         OR (salary_currency IS NOT NULL AND salary_period IS NOT NULL))
);
CREATE TRIGGER profile_preferences_updated_at BEFORE UPDATE ON profile_preferences
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE profile_private_details (
  user_id           uuid PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
  date_of_birth     date CHECK (date_of_birth >= DATE '1900-01-01'),
  gender            text CHECK (gender IN ('female', 'male', 'non_binary', 'other', 'prefer_not_to_say')),
  disability_status text CHECK (disability_status IN ('yes', 'no', 'prefer_not_to_say')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER profile_private_details_updated_at BEFORE UPDATE ON profile_private_details
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE skills (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       citext NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 1 AND 60),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE profile_skills (
  user_id     uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  skill_id    uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency text CHECK (proficiency IN ('beginner', 'intermediate', 'advanced', 'expert')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, skill_id)
);
CREATE INDEX profile_skills_skill_idx ON profile_skills(skill_id);

CREATE TABLE profile_target_roles (
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  title   citext NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  PRIMARY KEY (user_id, title)
);

CREATE TABLE profile_preferred_locations (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  country char(2) NOT NULL CHECK (country ~ '^[A-Z]{2}$'),
  city    text CHECK (char_length(city) <= 100)
);
CREATE UNIQUE INDEX profile_preferred_locations_unique_idx
  ON profile_preferred_locations (user_id, country, (coalesce(lower(city), '')));

CREATE TABLE opportunity_types (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text NOT NULL UNIQUE,
  name       citext NOT NULL UNIQUE,
  sort_order smallint NOT NULL DEFAULT 100
);

INSERT INTO opportunity_types (slug, name, sort_order) VALUES
  ('job', 'Job', 1),
  ('internship', 'Internship', 2),
  ('scholarship', 'Scholarship', 3),
  ('grant', 'Grant', 4),
  ('fellowship', 'Fellowship', 5),
  ('apprenticeship', 'Apprenticeship', 6),
  ('industrial_training', 'Industrial Training / Placement', 7),
  ('graduate_programme', 'Graduate Programme', 8),
  ('competition', 'Competition', 9),
  ('hackathon', 'Hackathon', 10),
  ('accelerator', 'Accelerator / Incubator', 11),
  ('residency', 'Residency', 12),
  ('volunteering', 'Volunteering', 13),
  ('freelance', 'Freelance / Contract', 14),
  ('other', 'Other', 99);

CREATE TABLE profile_opportunity_type_preferences (
  user_id             uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  opportunity_type_id uuid NOT NULL REFERENCES opportunity_types(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, opportunity_type_id)
);

CREATE TABLE educations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  institution    text NOT NULL CHECK (char_length(institution) <= 200),
  level          text CHECK (level IN (
                   'secondary', 'vocational', 'diploma', 'bachelors',
                   'masters', 'doctorate', 'other'
                 )),
  field_of_study text CHECK (char_length(field_of_study) <= 200),
  start_date     date,
  end_date       date,
  grade          text CHECK (char_length(grade) <= 100),
  description    text CHECK (char_length(description) <= 2000),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);
CREATE INDEX educations_user_idx ON educations(user_id);
CREATE TRIGGER educations_updated_at BEFORE UPDATE ON educations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE work_experiences (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  title           text NOT NULL CHECK (char_length(title) <= 200),
  organization    text NOT NULL CHECK (char_length(organization) <= 200),
  location        text CHECK (char_length(location) <= 200),
  employment_type text CHECK (employment_type IN (
                    'full_time', 'part_time', 'contract', 'freelance',
                    'internship', 'volunteer', 'self_employed', 'other'
                  )),
  start_date      date NOT NULL,
  end_date        date,
  description     text CHECK (char_length(description) <= 4000),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR end_date >= start_date)
);
CREATE INDEX work_experiences_user_idx ON work_experiences(user_id);
CREATE TRIGGER work_experiences_updated_at BEFORE UPDATE ON work_experiences
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  name        text NOT NULL CHECK (char_length(name) <= 200),
  description text CHECK (char_length(description) <= 4000),
  url         text CHECK (char_length(url) <= 500),
  start_date  date,
  end_date    date,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);
CREATE INDEX projects_user_idx ON projects(user_id);
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE certifications (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  name           text NOT NULL CHECK (char_length(name) <= 200),
  issuer         text CHECK (char_length(issuer) <= 200),
  issued_date    date,
  expiry_date    date,
  credential_url text CHECK (char_length(credential_url) <= 500),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (expiry_date IS NULL OR issued_date IS NULL OR expiry_date >= issued_date)
);
CREATE INDEX certifications_user_idx ON certifications(user_id);
CREATE TRIGGER certifications_updated_at BEFORE UPDATE ON certifications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE achievements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  kind         text NOT NULL DEFAULT 'other'
               CHECK (kind IN ('award', 'publication', 'volunteering', 'leadership', 'other')),
  title        text NOT NULL CHECK (char_length(title) <= 200),
  organization text CHECK (char_length(organization) <= 200),
  achieved_on  date,
  description  text CHECK (char_length(description) <= 2000),
  url          text CHECK (char_length(url) <= 500),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX achievements_user_idx ON achievements(user_id);
CREATE TRIGGER achievements_updated_at BEFORE UPDATE ON achievements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE profile_languages (
  user_id     uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  language    citext NOT NULL CHECK (char_length(language) BETWEEN 1 AND 60),
  proficiency text NOT NULL DEFAULT 'conversational'
              CHECK (proficiency IN ('basic', 'conversational', 'fluent', 'native')),
  PRIMARY KEY (user_id, language)
);

CREATE TABLE profile_links (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  kind       text NOT NULL DEFAULT 'other'
             CHECK (kind IN ('linkedin', 'github', 'portfolio', 'website', 'twitter', 'other')),
  url        text NOT NULL CHECK (char_length(url) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, url)
);
CREATE INDEX profile_links_user_idx ON profile_links(user_id);

CREATE TABLE profile_documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  kind        text NOT NULL
              CHECK (kind IN ('cv', 'cover_letter', 'transcript', 'certificate', 'portfolio', 'other')),
  file_name   text NOT NULL CHECK (char_length(file_name) <= 255),
  mime_type   text NOT NULL CHECK (char_length(mime_type) <= 100),
  size_bytes  bigint NOT NULL CHECK (size_bytes > 0),
  storage_key text NOT NULL UNIQUE,
  parsed_text text,
  is_primary  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX profile_documents_user_idx ON profile_documents(user_id);
CREATE UNIQUE INDEX profile_documents_one_primary_idx
  ON profile_documents(user_id, kind) WHERE is_primary;

-- Down Migration
DROP TABLE profile_documents, profile_links, profile_languages, achievements,
           certifications, projects, work_experiences, educations,
           profile_opportunity_type_preferences, opportunity_types,
           profile_preferred_locations, profile_target_roles,
           profile_skills, skills, profile_private_details,
           profile_preferences, profiles;