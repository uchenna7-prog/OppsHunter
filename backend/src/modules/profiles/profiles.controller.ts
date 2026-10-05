import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import {
  updateProfileSchema,
  addSkillSchema,
  setOpportunityTypePreferencesSchema,
  addCertificationSchema,
} from "./profiles.schemas.js";
import * as profilesService from "./profiles.service.js";

function paramToString(value: string | string[] | undefined): string {
  const result = Array.isArray(value) ? value[0] : value;
  if (!result) {
    throw new Error("Missing route parameter");
  }
  return result;
}

export async function getMyProfileHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await profilesService.getFullProfile(req.userId!);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

export async function updateMyProfileHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const input = updateProfileSchema.parse(req.body);
    const profile = await profilesService.updateMyProfile(req.userId!, {
      education_level: input.educationLevel,
      field_of_study: input.fieldOfStudy,
      location: input.location,
      years_of_experience: input.yearsOfExperience,
      interests: input.interests,
      career_goals: input.careerGoals,
      remote_preference: input.remotePreference,
    });
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
}

export async function addSkillHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const input = addSkillSchema.parse(req.body);
    const result = await profilesService.addSkill(req.userId!, input.name, input.category);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function removeSkillHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const skillId = paramToString(req.params.skillId);
    await profilesService.removeSkill(req.userId!, skillId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function searchSkillsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const query = typeof req.query.q === "string" ? req.query.q : "";
    const skills = await profilesService.searchAvailableSkills(query);
    res.status(200).json(skills);
  } catch (err) {
    next(err);
  }
}

export async function getOpportunityTypesHandler(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const types = await profilesService.getOpportunityTypeOptions();
    res.status(200).json(types);
  } catch (err) {
    next(err);
  }
}

export async function setOpportunityTypePreferencesHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const input = setOpportunityTypePreferencesSchema.parse(req.body);
    const result = await profilesService.setMyOpportunityTypePreferences(
      req.userId!,
      input.opportunityTypeIds
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function addCertificationHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const input = addCertificationSchema.parse(req.body);
    const result = await profilesService.addMyCertification(
      req.userId!,
      input.name,
      input.issuer ?? null,
      input.issuedDate ?? null
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function removeCertificationHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const certificationId = paramToString(req.params.certificationId);
    await profilesService.removeMyCertification(req.userId!, certificationId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}