import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import { config } from "./config/v1/config";

const pJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));

// Explicit file list — avoids Windows glob/backslash issues with swagger-jsdoc
const apiPaths = [
  path.join(process.cwd(), "src/routes/v1/auth.routes.ts"),
  path.join(process.cwd(), "src/routes/v1/users.routes.ts"),
  path.join(process.cwd(), "src/routes/v1/events.routes.ts"),
  path.join(process.cwd(), "src/db/models/user.model.ts"),
  path.join(process.cwd(), "src/db/models/event.model.ts"),
];
console.log("[Swagger] Scanning files:", apiPaths);

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Virtual Event Management Platform",
      version: pJson.version,
      description: "REST API for user registration, authentication, and event management",
    },
    servers: [
      { url: `http://localhost:${config.PORT}/v1`, description: "Local" },
      ...(config.SWAGGER_URLS
        ? config.SWAGGER_URLS.split(",").map((url: string) => ({ url: url.trim() }))
        : []
      ),
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Paste the access_token from /auth/login",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: apiPaths,
};

const swaggerSpec = swaggerJSDoc(options);

const specOutputPath = path.join(process.cwd(), "public/swagger/main.js");
fs.mkdirSync(path.dirname(specOutputPath), { recursive: true });
fs.writeFileSync(
  specOutputPath,
  `(async () => {
  const docs = document.getElementById('docs');
  const apiDescriptionDocument = ${JSON.stringify(swaggerSpec)};
  docs.apiDescriptionDocument = apiDescriptionDocument;
})();`,
  "utf8"
);

export { swaggerUi, swaggerSpec };
