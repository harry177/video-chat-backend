import "./config/load-env";

import app from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";

app.listen(env.PORT, "0.0.0.0", () => {
  logger.info(`API listening on port ${env.PORT}`);
});
