import { app } from "./app.js";
import { env } from "./config/env.js";
import { startScheduledJobs } from "./jobs/scheduler.js";

app.listen(env.PORT, () => {
  console.log(`OppsHunter API listening on port ${env.PORT}`);
  startScheduledJobs();
});