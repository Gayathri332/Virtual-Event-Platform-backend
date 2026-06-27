import mongoose, { Schema, Document } from "mongoose";
import { CONSTANTS } from "../../utils/v1/constants";

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "665f1a2b3c4d5e6f7a8b9c1a"
 *         title:
 *           type: string
 *           example: "TypeScript Workshop 2025"
 *         description:
 *           type: string
 *           example: "A hands-on workshop covering TypeScript fundamentals"
 *         date:
 *           type: string
 *           format: date
 *           example: "2025-08-15"
 *         startTime:
 *           type: string
 *           example: "10:00"
 *         endTime:
 *           type: string
 *           example: "12:00"
 *         meetLink:
 *           type: string
 *           example: "https://meet.google.com/abc-defg-hij"
 *         organizerId:
 *           type: string
 *           example: "665f1a2b3c4d5e6f7a8b9c0d"
 *         participants:
 *           type: array
 *           items:
 *             type: string
 *           example: ["665f1a2b3c4d5e6f7a8b9c0e", "665f1a2b3c4d5e6f7a8b9c0f"]
 *         maxCapacity:
 *           type: integer
 *           example: 100
 *         status:
 *           type: string
 *           enum: [upcoming, ongoing, completed]
 *           example: "upcoming"
 *         isDeleted:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export interface IEvent extends Document {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  meetLink: string;
  organizerId: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  maxCapacity: number;
  status: string;
  isDeleted: boolean;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    meetLink: { type: String, required: true },
    organizerId: { type: Schema.Types.ObjectId, ref: CONSTANTS.COLLECTIONS.USER_COLLECTION, required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: CONSTANTS.COLLECTIONS.USER_COLLECTION }],
    maxCapacity: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: Object.values(CONSTANTS.ENUM.EVENT_STATUS),
      default: CONSTANTS.ENUM.EVENT_STATUS.UPCOMING,
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

EventSchema.set("toObject", { virtuals: true });
EventSchema.set("toJSON", { virtuals: true });

export const EventModel = mongoose.model<IEvent>(CONSTANTS.COLLECTIONS.EVENT_COLLECTION, EventSchema);
