import dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/virtual-event-platform",
  JWT_SECRET: process.env.JWT_SECRET || "fallback_secret_change_in_production",
  JWT_ACCESS_EXPIRY: Number(process.env.JWT_ACCESS_EXPIRY) || 60,
  JWT_REFRESH_EXPIRY: Number(process.env.JWT_REFRESH_EXPIRY) || 10080,
  SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  FROM_EMAIL: process.env.FROM_EMAIL || "noreply@virtualevent.com",
  SWAGGER_URLS: process.env.SWAGGER_URLS || "",
};
