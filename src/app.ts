import express from "express";
import { swaggerUi, swaggerSpec } from "./swagger";
import authRoutes from "./routes/v1/auth.routes";
import userRoutes from "./routes/v1/users.routes";
import eventRoutes from "./routes/v1/events.routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "Virtual Event Platform API",
}));

// Routes
app.use("/v1/auth", authRoutes);
app.use("/v1/users", userRoutes);
app.use("/v1/events", eventRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ status: 404, message: "Route not found" });
});

export default app;
