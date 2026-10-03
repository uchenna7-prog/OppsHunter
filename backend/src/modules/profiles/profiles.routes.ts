import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import {
  getMyProfileHandler,
  updateMyProfileHandler,
  addSkillHandler,
  removeSkillHandler,
  searchSkillsHandler,
  getOpportunityTypesHandler,
  setOpportunityTypePreferencesHandler,
  addCertificationHandler,
  removeCertificationHandler,
} from "./profiles.controller.js";

export const profilesRouter = Router();

profilesRouter.use(authenticate);

profilesRouter.get("/me", getMyProfileHandler);
profilesRouter.patch("/me", updateMyProfileHandler);

profilesRouter.get("/skills/search", searchSkillsHandler);
profilesRouter.post("/skills", addSkillHandler);
profilesRouter.delete("/skills/:skillId", removeSkillHandler);

profilesRouter.get("/opportunity-types", getOpportunityTypesHandler);
profilesRouter.put("/opportunity-type-preferences", setOpportunityTypePreferencesHandler);

profilesRouter.post("/certifications", addCertificationHandler);
profilesRouter.delete("/certifications/:certificationId", removeCertificationHandler);