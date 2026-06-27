import { config } from "./config/v1/config";
import { DB } from "./db/connection";
import app from "./app";

async function bootstrap() {
  const db = new DB();
  await db.connectWithRetry(config.MONGO_URI);

  app.listen(config.PORT, () => {
    console.info(`Server running on http://localhost:${config.PORT}`);
    console.info(`Swagger docs: http://localhost:${config.PORT}/api-docs`);
  });
}

bootstrap().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
