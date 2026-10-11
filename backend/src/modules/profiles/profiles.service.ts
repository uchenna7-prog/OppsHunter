import { AppError, NotFoundError } from "../../lib/errors.js";
import {
  createProfileIfMissing,
  findProfile,
  updateProfileRow,
  findPreferences,
  upsertPreferences,
  findPrivateDetails,
  upsertPrivateDetails,
  searchSkills,
  listProfileSkills,
  replaceProfileSkills,
  listTargetRoles,
  replaceTargetRoles,
  listPreferredLocations,
  replacePreferredLocations,
  listLanguages,
  replaceLanguages,
  listAllOpportunityTypes,
  listOpportunityTypePreferences,
  replaceOpportunityTypePreferences,
  listSection,
  createSectionItem,
  updateSectionItem,
  deleteSectionItem,
  listDocuments,
} from "./profiles.repository.js";
import type { Row, SectionName } from "./profiles.repository.js";
import type {
  UpdateProfileInput,
  UpdatePreferencesInput,
  UpdatePrivateDetailsInput,
  SetSkillsInput,
  SetTargetRolesInput,
  SetPreferredLocationsInput,
  SetLanguagesInput,
} from "./profiles.schemas.js";

const NAME_CHANGE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

interface ProfileSeed {
  displayName?: string | null;
  avatarUrl?: string | null;
}

export async function ensureProfile(userId: string, seed: ProfileSeed = {}): Promise<Row> {
  const existing = await findProfile(userId);
  if (existing) return existing;

  const displayName = seed.displayName?.trim().slice(0, 30) || null;
  const avatarUrl = seed.avatarUrl && seed.avatarUrl.length <= 500 ? seed.avatarUrl : null;

  await createProfileIfMissing(userId, displayName, avatarUrl);

  const created = await findProfile(userId);
  return created!;
}

export async function getFullProfile(userId: string) {
  const profile = await ensureProfile(userId);

  const [
    preferences,
    skills,
    targetRoles,
    preferredLocations,
    languages,
    opportunityTypePreferences,
    educations,
    workExperiences,
    projects,
    certifications,
    achievements,
    links,
    documents,
  ] = await Promise.all([
    findPreferences(userId),
    listProfileSkills(userId),
    listTargetRoles(userId),
    listPreferredLocations(userId),
    listLanguages(userId),
    listOpportunityTypePreferences(userId),
    listSection("educations", userId),
    listSection("work-experiences", userId),
    listSection("projects", userId),
    listSection("certifications", userId),
    listSection("achievements", userId),
    listSection("links", userId),
    listDocuments(userId),
  ]);

  return {
    profile,
    preferences,
    skills,
    targetRoles,
    preferredLocations,
    languages,
    opportunityTypePreferences,
    educations,
    workExperiences,
    projects,
    certifications,
    achievements,
    links,
    documents,
  };
}

export async function updateMyProfile(userId: string, input: UpdateProfileInput): Promise<Row> {
  const current = await ensureProfile(userId);
  const { displayName, completeOnboarding, ...rest } = input;
  const fields: Row = { ...rest };

  const currentName = (current.displayName as string | null) ?? null;

  if (displayName !== undefined && displayName !== currentName) {
    const changedAt = (current.displayNameChangedAt as Date | null) ?? null;

    if (changedAt && Date.now() - changedAt.getTime() < NAME_CHANGE_COOLDOWN_MS) {
      const nextAllowed = new Date(changedAt.getTime() + NAME_CHANGE_COOLDOWN_MS);
      throw new AppError(
        400,
        "DISPLAY_NAME_COOLDOWN",
        `You can change your name again on ${nextAllowed.toISOString().slice(0, 10)}`
      );
    }

    fields.displayName = displayName;
    if (currentName !== null) fields.displayNameChangedAt = new Date();
  }

  if (completeOnboarding && !current.onboardingCompletedAt) {
    fields.onboardingCompletedAt = new Date();
  }

  return updateProfileRow(userId, fields);
}

export async function updateMyPreferences(
  userId: string,
  input: UpdatePreferencesInput
): Promise<Row> {
  await ensureProfile(userId);
  return upsertPreferences(userId, input);
}

export async function getMyPrivateDetails(userId: string): Promise<Row> {
  const row = await findPrivateDetails(userId);
  return row ?? { dateOfBirth: null, gender: null, disabilityStatus: null };
}

export async function updateMyPrivateDetails(
  userId: string,
  input: UpdatePrivateDetailsInput
): Promise<Row> {
  await ensureProfile(userId);
  return upsertPrivateDetails(userId, input);
}

export async function searchAvailableSkills(query: string): Promise<Row[]> {
  return searchSkills(query.trim());
}

export async function setMySkills(userId: string, input: SetSkillsInput): Promise<Row[]> {
  await ensureProfile(userId);

  const unique = new Map<string, { name: string; proficiency: string | null }>();
  for (const skill of input.skills) {
    const key = skill.name.toLowerCase();
    if (!unique.has(key)) {
      unique.set(key, { name: skill.name, proficiency: skill.proficiency ?? null });
    }
  }

  await replaceProfileSkills(userId, Array.from(unique.values()));
  return listProfileSkills(userId);
}

export async function setMyTargetRoles(
  userId: string,
  input: SetTargetRolesInput
): Promise<string[]> {
  await ensureProfile(userId);

  const unique = new Map<string, string>();
  for (const role of input.roles) {
    const key = role.toLowerCase();
    if (!unique.has(key)) unique.set(key, role);
  }

  await replaceTargetRoles(userId, Array.from(unique.values()));
  return listTargetRoles(userId);
}

export async function setMyPreferredLocations(
  userId: string,
  input: SetPreferredLocationsInput
): Promise<Row[]> {
  await ensureProfile(userId);

  const unique = new Map<string, { country: string; city: string }>();
  for (const location of input.locations) {
    const city = location.city?.trim() ?? "";
    const key = `${location.country}|${city.toLowerCase()}`;
    if (!unique.has(key)) unique.set(key, { country: location.country, city });
  }

  await replacePreferredLocations(userId, Array.from(unique.values()));
  return listPreferredLocations(userId);
}

export async function setMyLanguages(userId: string, input: SetLanguagesInput): Promise<Row[]> {
  await ensureProfile(userId);

  const unique = new Map<string, { language: string; proficiency: string }>();
  for (const entry of input.languages) {
    const key = entry.language.toLowerCase();
    if (!unique.has(key)) unique.set(key, entry);
  }

  await replaceLanguages(userId, Array.from(unique.values()));
  return listLanguages(userId);
}

export async function getOpportunityTypeOptions(): Promise<Row[]> {
  return listAllOpportunityTypes();
}

export async function setMyOpportunityTypePreferences(
  userId: string,
  typeIds: string[]
): Promise<Row[]> {
  await ensureProfile(userId);
  await replaceOpportunityTypePreferences(userId, Array.from(new Set(typeIds)));
  return listOpportunityTypePreferences(userId);
}

export async function createMyItem(
  userId: string,
  section: SectionName,
  input: Row
): Promise<Row> {
  await ensureProfile(userId);
  return createSectionItem(section, userId, input);
}

export async function updateMyItem(
  userId: string,
  section: SectionName,
  itemId: string,
  input: Row
): Promise<Row> {
  const updated = await updateSectionItem(section, userId, itemId, input);
  if (!updated) throw new NotFoundError("Item not found");
  return updated;
}

export async function deleteMyItem(
  userId: string,
  section: SectionName,
  itemId: string
): Promise<void> {
  const deleted = await deleteSectionItem(section, userId, itemId);
  if (!deleted) throw new NotFoundError("Item not found");
}