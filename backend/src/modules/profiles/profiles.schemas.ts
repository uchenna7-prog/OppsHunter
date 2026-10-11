import { z } from "zod";
import type { SectionName } from "./profiles.repository.js";

const MIN_AGE = 13;

const clearableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters`)
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional();

const requiredText = (max: number) =>
  z.string().trim().min(1, "This field is required").max(max, `Must be at most ${max} characters`);

const clearableDate = z.string().date("Use the format YYYY-MM-DD").nullable().optional();

const countryCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, "Use a 2-letter country code");

const clearableUrl = z.string().trim().url("Enter a valid link").max(500).nullable().optional();

const PREFERRED_EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "freelance",
  "internship",
  "volunteer",
] as const;

const WORK_EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "freelance",
  "internship",
  "volunteer",
  "self_employed",
  "other",
] as const;

function isReasonableBirthDate(value: string): boolean {
  const birth = new Date(`${value}T00:00:00Z`);
  const now = new Date();

  if (Number.isNaN(birth.getTime()) || birth > now) return false;

  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age -= 1;

  return age >= MIN_AGE && age <= 120;
}

export const idSchema = z.string().uuid("Invalid id");

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(30, "Name must be at most 30 characters")
    .optional(),
  headline: clearableText(120),
  summary: clearableText(2000),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{6,30}$/, "Enter a valid phone number")
    .nullable()
    .optional(),
  country: countryCode.nullable().optional(),
  nationality: countryCode.nullable().optional(),
  city: clearableText(100),
  timezone: clearableText(64),
  currentStatus: z
    .enum(["student", "employed", "self_employed", "unemployed", "between_jobs", "retired", "other"])
    .nullable()
    .optional(),
  yearsOfExperience: z.number().int().min(0).max(80).nullable().optional(),
  interests: clearableText(2000),
  careerGoals: clearableText(2000),
  completeOnboarding: z.boolean().optional(),
});

export const updatePreferencesSchema = z
  .object({
    remotePreference: z.enum(["remote", "onsite", "hybrid", "any"]).nullable().optional(),
    willingToRelocate: z.boolean().nullable().optional(),
    needsVisaSponsorship: z.boolean().nullable().optional(),
    availableFrom: clearableDate,
    employmentTypes: z.array(z.enum(PREFERRED_EMPLOYMENT_TYPES)).max(6).optional(),
    salaryMin: z.number().int().min(0).nullable().optional(),
    salaryMax: z.number().int().min(0).nullable().optional(),
    salaryCurrency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code")
      .nullable()
      .optional(),
    salaryPeriod: z.enum(["hour", "day", "month", "year"]).nullable().optional(),
  })
  .refine(
    (value) =>
      value.salaryMin == null || value.salaryMax == null || value.salaryMax >= value.salaryMin,
    { message: "Maximum salary must be at least the minimum", path: ["salaryMax"] }
  );

export const updatePrivateDetailsSchema = z.object({
  dateOfBirth: z
    .string()
    .date("Use the format YYYY-MM-DD")
    .refine(isReasonableBirthDate, "Enter a valid date of birth")
    .nullable()
    .optional(),
  gender: z
    .enum(["female", "male", "non_binary", "other", "prefer_not_to_say"])
    .nullable()
    .optional(),
  disabilityStatus: z.enum(["yes", "no", "prefer_not_to_say"]).nullable().optional(),
});

export const setSkillsSchema = z.object({
  skills: z
    .array(
      z.object({
        name: requiredText(60),
        proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]).nullable().optional(),
      })
    )
    .max(100),
});

export const setTargetRolesSchema = z.object({
  roles: z.array(requiredText(100)).max(20),
});

export const setPreferredLocationsSchema = z.object({
  locations: z
    .array(
      z.object({
        country: countryCode,
        city: z.string().trim().max(100).optional(),
      })
    )
    .max(20),
});

export const setLanguagesSchema = z.object({
  languages: z
    .array(
      z.object({
        language: requiredText(60),
        proficiency: z.enum(["basic", "conversational", "fluent", "native"]),
      })
    )
    .max(20),
});

export const setOpportunityTypePreferencesSchema = z.object({
  opportunityTypeIds: z.array(z.string().uuid()).max(20),
});

function withOrderedDates(
  base: z.ZodObject<z.ZodRawShape>,
  startKey: string,
  endKey: string
): { create: z.ZodTypeAny; update: z.ZodTypeAny } {
  const check = (value: Record<string, unknown>) => {
    const start = value[startKey];
    const end = value[endKey];
    return typeof start !== "string" || typeof end !== "string" || end >= start;
  };
  const error = { message: "The end date can't be before the start date", path: [endKey] };

  return {
    create: base.refine(check, error),
    update: base.partial().refine(check, error),
  };
}

const educationBase = z.object({
  institution: requiredText(200),
  level: z
    .enum(["secondary", "vocational", "diploma", "bachelors", "masters", "doctorate", "other"])
    .nullable()
    .optional(),
  fieldOfStudy: clearableText(200),
  startDate: clearableDate,
  endDate: clearableDate,
  grade: clearableText(100),
  description: clearableText(2000),
});

const workExperienceBase = z.object({
  title: requiredText(200),
  organization: requiredText(200),
  location: clearableText(200),
  employmentType: z.enum(WORK_EMPLOYMENT_TYPES).nullable().optional(),
  startDate: z.string().date("Use the format YYYY-MM-DD"),
  endDate: clearableDate,
  description: clearableText(4000),
});

const projectBase = z.object({
  name: requiredText(200),
  description: clearableText(4000),
  url: clearableUrl,
  startDate: clearableDate,
  endDate: clearableDate,
});

const certificationBase = z.object({
  name: requiredText(200),
  issuer: clearableText(200),
  issuedDate: clearableDate,
  expiryDate: clearableDate,
  credentialUrl: clearableUrl,
});

const achievementBase = z.object({
  kind: z.enum(["award", "publication", "volunteering", "leadership", "other"]),
  title: requiredText(200),
  organization: clearableText(200),
  achievedOn: clearableDate,
  description: clearableText(2000),
  url: clearableUrl,
});

const linkBase = z.object({
  kind: z.enum(["linkedin", "github", "portfolio", "website", "twitter", "other"]).default("other"),
  url: z.string().trim().url("Enter a valid link").max(500),
});

export const SECTION_SCHEMAS: Record<SectionName, { create: z.ZodTypeAny; update: z.ZodTypeAny }> = {
  educations: withOrderedDates(educationBase, "startDate", "endDate"),
  "work-experiences": withOrderedDates(workExperienceBase, "startDate", "endDate"),
  projects: withOrderedDates(projectBase, "startDate", "endDate"),
  certifications: withOrderedDates(certificationBase, "issuedDate", "expiryDate"),
  achievements: { create: achievementBase, update: achievementBase.partial() },
  links: { create: linkBase, update: linkBase.partial() },
};

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type UpdatePrivateDetailsInput = z.infer<typeof updatePrivateDetailsSchema>;
export type SetSkillsInput = z.infer<typeof setSkillsSchema>;
export type SetTargetRolesInput = z.infer<typeof setTargetRolesSchema>;
export type SetPreferredLocationsInput = z.infer<typeof setPreferredLocationsSchema>;
export type SetLanguagesInput = z.infer<typeof setLanguagesSchema>;
export type SetOpportunityTypePreferencesInput = z.infer<typeof setOpportunityTypePreferencesSchema>;