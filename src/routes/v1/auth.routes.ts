import express from "express";
import { entryPoint } from "../../middlewares/entryPoint";
import { exitPoint } from "../../middlewares/exitPoint";
import * as auth from "../../controllers/v1/auth.controller";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: User registration and login
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jane Smith"
 *               email:
 *                 type: string
 *                 example: "jane@example.com"
 *               password:
 *                 type: string
 *                 example: "Secret@123"
 *               role:
 *                 type: string
 *                 enum: [organizer, attendee]
 *                 example: "attendee"
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               message: "User registered successfully"
 *               data:
 *                 _id: "665f1a2b3c4d5e6f7a8b9c0d"
 *                 name: "Jane Smith"
 *                 email: "jane@example.com"
 *                 role: "attendee"
 *               toastMessage: "Registration successful"
 *       400:
 *         description: Validation error or email already in use
 */
router.post("/register", entryPoint, auth.register, exitPoint);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and receive JWT tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "jane@example.com"
 *               password:
 *                 type: string
 *                 example: "Secret@123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               message: "Login successful"
 *               data:
 *                 _id: "665f1a2b3c4d5e6f7a8b9c0d"
 *                 name: "Jane Smith"
 *                 email: "jane@example.com"
 *                 role: "attendee"
 *                 access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 tokenExpiresAt: "2025-06-22T10:00:00.000Z"
 *               toastMessage: "Welcome back!"
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", entryPoint, auth.login, exitPoint);

export default router;
