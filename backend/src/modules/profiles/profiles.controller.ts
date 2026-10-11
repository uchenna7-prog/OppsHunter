import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../middleware/authenticate.js";
import { NotFoundError } from "../../lib/errors.js";
import {
  idSchema,
  updateProfileSchema,
  updatePreferencesSchema,
  updatePrivateDetailsSchema,
  setSkillsSchema,
  setTargetRolesSchema,
  setPreferredLocationsSchema,
  setLanguagesSchema,
  setOpportunityTypePreferencesSchema,
  SECTION_SCHEMAS,
} from "./profiles.schemas.js";
import { isSectionName } from "./profiles.repository.js";
import type { Row, SectionName } from "./profiles.repository.js";
import * as profilesService from "./profiles.service.js";

function paramToString(value: string | string[] | undefined): string {
  const result = Array.isArray(value) ? value[0] : value;
  if (!result) {
    throw new Error("Missing route parameter");
  }
  return result;
}

function sectionFromParams(req: AuthenticatedRequest): SectionName {
  const value = paramToString(req.params.section);
  if (!isSectionName(value)) throw new NotFoundError("Unknown profile section");
  return value;
}

export async function getMyProfileHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    res.status(200).json(await profilesService.getFullProfile(req.userId!));
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
    res.status(200).json(await profilesService.updateMyProfile(req.userId!, input));
  } catch (err) {
    next(err);
  }
}

export async function updateMyPreferencesHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const input = updatePreferencesSchema.parse(req.body);
    res.status(200).json(await profilesService.updateMyPreferences(req.userId!, input));
  } catch (err) {
    next(err);
  }
}

export async function getMyPrivateDetailsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    res.status(200).json(await profilesService.getMyPrivateDetails(req.userId!));
  } catch (err) {
    next(err);
  }
}

export async function updateMyPrivateDetailsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const input = updatePrivateDetailsSchema.parse(req.body);
    res.status(200).json(await profilesService.updateMyPrivateDetails(req.userId!, input));
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
    res.status(200).json(await profilesService.searchAvailableSkills(query));
  } catch (err) {
    next(err);
  }
}

export async function setMySkillsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const input = setSkillsSchema.parse(req.body);
    res.status(200).json(await profilesService.setMySkills(req.userId!, input));
  } catch (err) {
    next(err);
  }
}

export async function setMyTargetRolesHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const input = setTargetRolesSchema.parse(req.body);
    res.status(200).json(await profilesService.setMyTargetRoles(req.userId!, input));
  } catch (err) {
    next(err);
  }
}

export async function setMyPreferredLocationsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const input = setPreferredLocationsSchema.parse(req.body);
    res.status(200).json(await profilesService.setMyPreferredLocations(req.userId!, input));
  } catch (err) {
    next(err);
  }
}

export async function setMyLanguagesHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const input = setLanguagesSchema.parse(req.body);
    res.status(200).json(await profilesService.setMyLanguages(req.userId!, input));
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
    res.status(200).json(await profilesService.getOpportunityTypeOptions());
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
    res
      .status(200)
      .json(await profilesService.setMyOpportunityTypePreferences(req.userId!, input.opportunityTypeIds));
  } catch (err) {
    next(err);
  }
}

export async function createItemHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const section = sectionFromParams(req);
    const input = SECTION_SCHEMAS[section].create.parse(req.body) as Row;
    res.status(201).json(await profilesService.createMyItem(req.userId!, section, input));
  } catch (err) {
    next(err);
  }
}

export async function updateItemHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const section = sectionFromParams(req);
    const itemId = idSchema.parse(paramToString(req.params.itemId));
    const input = SECTION_SCHEMAS[section].update.parse(req.body) as Row;
    res.status(200).json(await profilesService.updateMyItem(req.userId!, section, itemId, input));
  } catch (err) {
    next(err);
  }
}

export async function deleteItemHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const section = sectionFromParams(req);
    const itemId = idSchema.parse(paramToString(req.params.itemId));
    await profilesService.deleteMyItem(req.userId!, section, itemId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}