import mongoose, { Schema, Document } from "mongoose";
import { CONSTANTS } from "../../utils/v1/constants";

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "665f1a2b3c4d5e6f7a8b9c0d"
 *         name:
 *           type: string
 *           example: "Jane Smith"
 *         email:
 *           type: string
 *           example: "jane@example.com"
 *         role:
 *           type: string
 *           enum: [organizer, attendee]
 *           example: "attendee"
 *         isEnabled:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  isEnabled: boolean;
  isDeleted: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(CONSTANTS.ENUM.ROLES),
      required: true,
      default: CONSTANTS.ENUM.ROLES.ATTENDEE,
    },
    isEnabled: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

UserSchema.set("toObject", { virtuals: true });
UserSchema.set("toJSON", { virtuals: true });

export const UserModel = mongoose.model<IUser>(CONSTANTS.COLLECTIONS.USER_COLLECTION, UserSchema);
