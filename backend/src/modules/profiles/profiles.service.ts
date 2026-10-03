import {
  createProfile,
  findProfileByUserId,
  updateProfile,
  ProfileUpdateFields,
  findOrCreateSkillByName,
  addSkillToProfile,
  removeSkillFromProfile,
  listProfileSkills,
  listAllOpportunityTypes,
  setOpportunityTypePreferences,
  listProfileOpportunityTypePreferences,
  addCertification,
  listCertifications,
  deleteCertification,
  searchSkills,
} from "./profiles.repository.js";
import { NotFoundError } from "../../lib/errors.js";

export async function getOrCreateProfile(userId: string) {
  const existing = await findProfileByUserId(userId);
  if (existing) return existing;
  return createProfile(userId);
}

export async function updateMyProfile(userId: string, fields: ProfileUpdateFields) {
  await getOrCreateProfile(userId); // ensures a row exists before updating
  return updateProfile(userId, fields);
}

export async function getFullProfile(userId: string) {
  const profile = await getOrCreateProfile(userId);
  const skills = await listProfileSkills(userId);
  const opportunityTypePreferences = await listProfileOpportunityTypePreferences(userId);
  const certifications = await listCertifications(userId);

  return { profile, skills, opportunityTypePreferences, certifications };
}

export async function addSkill(
  userId: string,
  skillName: string,
  category: "programming_language" | "general_skill"
) {
  await getOrCreateProfile(userId);
  const skill = await findOrCreateSkillByName(skillName.trim());
  return addSkillToProfile(userId, skill.id, category);
}

export async function removeSkill(userId: string, skillId: string) {
  await removeSkillFromProfile(userId, skillId);
}

export async function searchAvailableSkills(query: string) {
  return searchSkills(query);
}

export async function getOpportunityTypeOptions() {
  return listAllOpportunityTypes();
}

export async function setMyOpportunityTypePreferences(userId: string, typeIds: string[]) {
  await getOrCreateProfile(userId);
  await setOpportunityTypePreferences(userId, typeIds);
  return listProfileOpportunityTypePreferences(userId);
}

export async function addMyCertification(
  userId: string,
  name: string,
  issuer: string | null,
  issuedDate: string | null
) {
  await getOrCreateProfile(userId);
  return addCertification(userId, name, issuer, issuedDate);
}

export async function removeMyCertification(userId: string, certificationId: string) {
  await deleteCertification(userId, certificationId);
}