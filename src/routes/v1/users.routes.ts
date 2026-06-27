import express from "express";
import { entryPoint } from "../../middlewares/entryPoint";
import { exitPoint } from "../../middlewares/exitPoint";
import { authenticate, requireRole } from "../../middlewares/auth.middleware";
import { guardChain } from "../../middlewares/guardChain";
import * as users from "../../controllers/v1/users.controller";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User management
 */

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get the currently authenticated user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               message: "Success"
 *               data:
 *                 _id: "665f1a2b3c4d5e6f7a8b9c0d"
 *                 name: "Jane Smith"
 *                 email: "jane@example.com"
 *                 role: "attendee"
 *                 isEnabled: true
 *                 createdAt: "2025-06-01T08:00:00.000Z"
 *       401:
 *         description: Unauthorized
 */
router.get("/profile", entryPoint, authenticate, guardChain, users.getProfile, exitPoint);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update the currently authenticated user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jane Doe"
 *               password:
 *                 type: string
 *                 example: "NewSecret@456"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               message: "Profile updated successfully"
 *               data:
 *                 _id: "665f1a2b3c4d5e6f7a8b9c0d"
 *                 name: "Jane Doe"
 *                 email: "jane@example.com"
 *                 role: "attendee"
 *               toastMessage: "Profile updated"
 *       401:
 *         description: Unauthorized
 */
router.put("/profile", entryPoint, authenticate, guardChain, users.updateProfile, exitPoint);

/**
 * @swagger
 * /users/getAll:
 *   post:
 *     summary: Get all users with optional filtering and pagination (organizer only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               search:
 *                 type: string
 *                 example: "jane"
 *               role:
 *                 type: string
 *                 enum: [organizer, attendee]
 *                 example: "attendee"
 *               isEnabled:
 *                 type: boolean
 *                 example: true
 *               page:
 *                 type: integer
 *                 example: 1
 *               itemsPerPage:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Users fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               message: "Success"
 *               data:
 *                 totalCount: 2
 *                 tableData:
 *                   - _id: "665f1a2b3c4d5e6f7a8b9c0d"
 *                     name: "Jane Smith"
 *                     email: "jane@example.com"
 *                     role: "attendee"
 *                     isEnabled: true
 *                   - _id: "665f1a2b3c4d5e6f7a8b9c0e"
 *                     name: "Bob Organizer"
 *                     email: "bob@example.com"
 *                     role: "organizer"
 *                     isEnabled: true
 *       401:
 *         description: Unauthorized
 */
router.post("/getAll", entryPoint, authenticate, requireRole("organizer"), guardChain, users.getAll, exitPoint);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID (organizer only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "665f1a2b3c4d5e6f7a8b9c0d"
 *     responses:
 *       200:
 *         description: User fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               message: "Success"
 *               data:
 *                 _id: "665f1a2b3c4d5e6f7a8b9c0d"
 *                 name: "Jane Smith"
 *                 email: "jane@example.com"
 *                 role: "attendee"
 *                 isEnabled: true
 *                 createdAt: "2025-06-01T08:00:00.000Z"
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", entryPoint, authenticate, requireRole("organizer"), guardChain, users.getOne, exitPoint);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user by ID (organizer only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "665f1a2b3c4d5e6f7a8b9c0d"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Name"
 *               role:
 *                 type: string
 *                 enum: [organizer, attendee]
 *                 example: "organizer"
 *               isEnabled:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               message: "User updated successfully"
 *               data:
 *                 _id: "665f1a2b3c4d5e6f7a8b9c0d"
 *                 name: "Updated Name"
 *                 email: "jane@example.com"
 *                 role: "organizer"
 *                 isEnabled: false
 *               toastMessage: "User updated"
 *       401:
 *         description: Unauthorized
 */
router.put("/:id", entryPoint, authenticate, requireRole("organizer"), guardChain, users.update, exitPoint);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Soft-delete a user by ID (organizer only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "665f1a2b3c4d5e6f7a8b9c0d"
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               message: "User deleted successfully"
 *               data: "User deleted successfully"
 *               toastMessage: "User deleted"
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", entryPoint, authenticate, requireRole("organizer"), guardChain, users.deleteUser, exitPoint);

export default router;
