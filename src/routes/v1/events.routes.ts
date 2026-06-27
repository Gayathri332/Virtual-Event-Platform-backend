import express from "express";
import { entryPoint } from "../../middlewares/entryPoint";
import { exitPoint } from "../../middlewares/exitPoint";
import { authenticate, requireRole } from "../../middlewares/auth.middleware";
import { guardChain } from "../../middlewares/guardChain";
import * as events from "../../controllers/v1/events.controller";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Events
 *     description: Event scheduling and management
 */

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event (organizer only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, date, startTime, endTime, maxCapacity]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "TypeScript Workshop 2025"
 *               description:
 *                 type: string
 *                 example: "A hands-on workshop covering TypeScript fundamentals"
 *               date:
 *                 type: string
 *                 example: "2025-08-15"
 *               startTime:
 *                 type: string
 *                 example: "10:00"
 *               endTime:
 *                 type: string
 *                 example: "12:00"
 *               maxCapacity:
 *                 type: integer
 *                 example: 100
 *     responses:
 *       200:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               message: "Event created successfully"
 *               data:
 *                 _id: "665f1a2b3c4d5e6f7a8b9c1a"
 *                 title: "TypeScript Workshop 2025"
 *                 description: "A hands-on workshop covering TypeScript fundamentals"
 *                 date: "2025-08-15"
 *                 startTime: "10:00"
 *                 endTime: "12:00"
 *                 meetLink: "https://meet.google.com/abc-defg-hij"
 *                 maxCapacity: 100
 *                 participants: []
 *                 status: "upcoming"
 *                 organizerId: "665f1a2b3c4d5e6f7a8b9c0d"
 *                 createdAt: "2025-06-01T08:00:00.000Z"
 *               toastMessage: "Event created"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/", entryPoint, authenticate, requireRole("organizer"), guardChain, events.create, exitPoint);

/**
 * @swagger
 * /events/getAll:
 *   post:
 *     summary: Get all events with optional filtering and pagination
 *     tags: [Events]
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
 *                 example: "typescript"
 *               status:
 *                 type: string
 *                 enum: [upcoming, ongoing, completed]
 *                 example: "upcoming"
 *               organizerId:
 *                 type: string
 *                 example: "665f1a2b3c4d5e6f7a8b9c0d"
 *               page:
 *                 type: integer
 *                 example: 1
 *               itemsPerPage:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Events fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               message: "Success"
 *               data:
 *                 totalCount: 1
 *                 tableData:
 *                   - _id: "665f1a2b3c4d5e6f7a8b9c1a"
 *                     title: "TypeScript Workshop 2025"
 *                     date: "2025-08-15"
 *                     startTime: "10:00"
 *                     endTime: "12:00"
 *                     meetLink: "https://meet.google.com/abc-defg-hij"
 *                     maxCapacity: 100
 *                     participants: []
 *                     status: "upcoming"
 *       401:
 *         description: Unauthorized
 */
router.post("/getAll", entryPoint, authenticate, guardChain, events.getAll, exitPoint);

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get a single event by ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "665f1a2b3c4d5e6f7a8b9c1a"
 *     responses:
 *       200:
 *         description: Event fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               message: "Success"
 *               data:
 *                 _id: "665f1a2b3c4d5e6f7a8b9c1a"
 *                 title: "TypeScript Workshop 2025"
 *                 date: "2025-08-15"
 *                 startTime: "10:00"
 *                 endTime: "12:00"
 *                 meetLink: "https://meet.google.com/abc-defg-hij"
 *                 maxCapacity: 100
 *                 status: "upcoming"
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", entryPoint, authenticate, guardChain, events.getOne, exitPoint);

/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Update an event (organizer only, own events)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "665f1a2b3c4d5e6f7a8b9c1a"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "TypeScript Workshop 2025 — Updated"
 *               description:
 *                 type: string
 *                 example: "Updated description"
 *               date:
 *                 type: string
 *                 example: "2025-08-20"
 *               startTime:
 *                 type: string
 *                 example: "11:00"
 *               endTime:
 *                 type: string
 *                 example: "13:00"
 *               maxCapacity:
 *                 type: integer
 *                 example: 150
 *               status:
 *                 type: string
 *                 enum: [upcoming, ongoing, completed]
 *                 example: "ongoing"
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               message: "Event updated successfully"
 *               data:
 *                 _id: "665f1a2b3c4d5e6f7a8b9c1a"
 *                 title: "TypeScript Workshop 2025 — Updated"
 *                 startTime: "11:00"
 *                 endTime: "13:00"
 *                 meetLink: "https://meet.google.com/abc-defg-hij"
 *                 maxCapacity: 150
 *                 status: "ongoing"
 *               toastMessage: "Event updated"
 *       401:
 *         description: Unauthorized or not the event owner
 */
router.put("/:id", entryPoint, authenticate, requireRole("organizer"), guardChain, events.update, exitPoint);

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Soft-delete an event (organizer only, own events)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "665f1a2b3c4d5e6f7a8b9c1a"
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               message: "Event deleted successfully"
 *               data: "Event deleted successfully"
 *               toastMessage: "Event deleted"
 *       401:
 *         description: Unauthorized or not the event owner
 */
router.delete("/:id", entryPoint, authenticate, requireRole("organizer"), guardChain, events.deleteEvent, exitPoint);

/**
 * @swagger
 * /events/{id}/register:
 *   post:
 *     summary: Register the authenticated user for an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "665f1a2b3c4d5e6f7a8b9c1a"
 *     responses:
 *       200:
 *         description: Registered for event successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               message: "Registration successful"
 *               data:
 *                 message: "Successfully registered for the event"
 *                 meetLink: "https://meet.google.com/abc-defg-hij"
 *               toastMessage: "You are registered!"
 *       401:
 *         description: Unauthorized
 */
router.post("/:id/register", entryPoint, authenticate, guardChain, events.registerForEvent, exitPoint);

/**
 * @swagger
 * /events/{id}/participants:
 *   get:
 *     summary: Get participant list for an event (organizer only, own events)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "665f1a2b3c4d5e6f7a8b9c1a"
 *     responses:
 *       200:
 *         description: Participants fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               status: 200
 *               message: "Success"
 *               data:
 *                 eventId: "665f1a2b3c4d5e6f7a8b9c1a"
 *                 title: "TypeScript Workshop 2025"
 *                 totalParticipants: 2
 *                 maxCapacity: 100
 *                 participants:
 *                   - _id: "665f1a2b3c4d5e6f7a8b9c0e"
 *                     name: "Bob Attendee"
 *                     email: "bob@example.com"
 *                     role: "attendee"
 *       401:
 *         description: Unauthorized or not the event owner
 */
router.get("/:id/participants", entryPoint, authenticate, requireRole("organizer"), guardChain, events.getParticipants, exitPoint);

export default router;
