import { z } from "zod";

export const updateProfileSchema = z.object({
  educationLevel: z
    .enum(["secondary", "undergraduate", "graduate", "postgraduate", "doctorate", "other"])
    .optional(),
  fieldOfStudy: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  yearsOfExperience: z.number().int().min(0).max(80).optional(),
  interests: z.string().max(1000).optional(),
  careerGoals: z.string().max(1000).optional(),
  remotePreference: z.enum(["remote", "onsite", "hybrid", "any"]).optional(),
});

export const addSkillSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(["programming_language", "general_skill"]).default("general_skill"),
});

export const setOpportunityTypePreferencesSchema = z.object({
  opportunityTypeIds: z.array(z.string().uuid()),
});

export const addCertificationSchema = z.object({
  name: z.string().min(1).max(200),
  issuer: z.string().max(200).optional(),
  issuedDate: z.string().date().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddSkillInput = z.infer<typeof addSkillSchema>;
export type SetOpportunityTypePreferencesInput = z.infer<typeof setOpportunityTypePreferencesSchema>;
export type AddCertificationInput = z.infer<typeof addCertificationSchema>;