import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { createRateLimiter } from "../../middleware/rateLimit.js";
import {
  getMyProfileHandler,
  updateMyProfileHandler,
  updateMyPreferencesHandler,
  getMyPrivateDetailsHandler,
  updateMyPrivateDetailsHandler,
  searchSkillsHandler,
  setMySkillsHandler,
  setMyTargetRolesHandler,
  setMyPreferredLocationsHandler,
  setMyLanguagesHandler,
  getOpportunityTypesHandler,
  setOpportunityTypePreferencesHandler,
  createItemHandler,
  updateItemHandler,
  deleteItemHandler,
} from "./profiles.controller.js";

export const profilesRouter = Router();

profilesRouter.use(authenticate);
profilesRouter.use(createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 200, perUser: true }));

profilesRouter.get("/me", getMyProfileHandler);
profilesRouter.patch("/me", updateMyProfileHandler);
profilesRouter.patch("/me/preferences", updateMyPreferencesHandler);
profilesRouter.get("/me/private", getMyPrivateDetailsHandler);
profilesRouter.put("/me/private", updateMyPrivateDetailsHandler);

profilesRouter.put("/me/skills", setMySkillsHandler);
profilesRouter.put("/me/target-roles", setMyTargetRolesHandler);
profilesRouter.put("/me/preferred-locations", setMyPreferredLocationsHandler);
profilesRouter.put("/me/languages", setMyLanguagesHandler);
profilesRouter.put("/me/opportunity-type-preferences", setOpportunityTypePreferencesHandler);

profilesRouter.get("/skills/search", searchSkillsHandler);
profilesRouter.get("/opportunity-types", getOpportunityTypesHandler);

profilesRouter.post("/me/:section", createItemHandler);
profilesRouter.patch("/me/:section/:itemId", updateItemHandler);
profilesRouter.delete("/me/:section/:itemId", deleteItemHandler);