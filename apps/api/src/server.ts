import "./config/load-env";

import app from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { cleanupStaleRooms } from "./services/room.service";

app.listen(env.PORT, "0.0.0.0", () => {
  logger.info(`API listening on port ${env.PORT}`);

  setInterval(() => {
    cleanupStaleRooms().catch((error) => {
      logger.error("Failed to cleanup stale rooms", error);
    });
  }, 30_000);
});
