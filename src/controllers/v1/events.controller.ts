import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { EventModel, ErrorCodes, IEvent } from "../../db/models";
import { CONSTANTS } from "../../utils/v1/constants";
import { generateMeetLink } from "../../utils/v1/helpers";
import {
  sendEventRegistrationEmail,
  scheduleReminderEmail,
} from "../../services/email.service";

/* ------------------------------------------------------------------ */
/*  POST /events  — create event (organizer only)                      */
/* ------------------------------------------------------------------ */
export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  const txId = req.txId;

  try {
    const { title, description, date, startTime, endTime, maxCapacity } = req.body;

    if (!title?.trim()) {
      req.apiStatus = { isSuccess: false, error: ErrorCodes[1001], data: "title is required", toastMessage: "Validation error" };
      return next();
    }
    if (!description?.trim()) {
      req.apiStatus = { isSuccess: false, error: ErrorCodes[1001], data: "description is required", toastMessage: "Validation error" };
      return next();
    }
    if (!date?.trim()) {
      req.apiStatus = { isSuccess: false, error: ErrorCodes[1001], data: "date is required (YYYY-MM-DD)", toastMessage: "Validation error" };
      return next();
    }
    if (!startTime?.trim()) {
      req.apiStatus = { isSuccess: false, error: ErrorCodes[1001], data: "startTime is required (HH:MM)", toastMessage: "Validation error" };
      return next();
    }
    if (!endTime?.trim()) {
      req.apiStatus = { isSuccess: false, error: ErrorCodes[1001], data: "endTime is required (HH:MM)", toastMessage: "Validation error" };
      return next();
    }
    if (endTime <= startTime) {
      req.apiStatus = { isSuccess: false, error: ErrorCodes[1001], data: "endTime must be after startTime", toastMessage: "Validation error" };
      return next();
    }
    if (!maxCapacity || Number(maxCapacity) < 1) {
      req.apiStatus = { isSuccess: false, error: ErrorCodes[1001], data: "maxCapacity must be at least 1", toastMessage: "Validation error" };
      return next();
    }

    const meetLink = generateMeetLink();

    const event = await EventModel.create({
      title: title.trim(),
      description: description.trim(),
      date,
      startTime,
      endTime,
      meetLink,
      maxCapacity: Number(maxCapacity),
      organizerId: req.user._id,
      participants: [],
      status: CONSTANTS.ENUM.EVENT_STATUS.UPCOMING,
    });

    req.apiStatus = {
      isSuccess: true,
      data: event,
      message: "Event created successfully",
      toastMessage: "Event created",
    };
    return next();
  } catch (error: unknown) {
    console.error(`create event error txId:${txId}`, error);
    req.apiStatus = {
      isSuccess: false,
      error: ErrorCodes[1010],
      data: error instanceof Error ? error.message : "Failed to create event",
      toastMessage: "Failed to create event",
    };
    return next();
  }
}

/* ------------------------------------------------------------------ */
/*  POST /events/getAll  — list all events                             */
/* ------------------------------------------------------------------ */
export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  const txId = req.txId;

  try {
    const { search, status, organizerId, page = 1, itemsPerPage = 10 } = req.body;

    const filter: Record<string, any> = { isDeleted: false };

    if (status) filter.status = status;
    if (organizerId && ObjectId.isValid(organizerId)) filter.organizerId = new ObjectId(organizerId);
    if (search?.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(itemsPerPage);

    const [events, totalCount] = await Promise.all([
      EventModel.find(filter)
        .populate("organizerId", "name email")
        .skip(skip)
        .limit(Number(itemsPerPage))
        .sort({ createdAt: -1 }),
      EventModel.countDocuments(filter),
    ]);

    req.apiStatus = { isSuccess: true, data: { totalCount, tableData: events } };
    return next();
  } catch (error: unknown) {
    console.error(`getAll events error txId:${txId}`, error);
    req.apiStatus = {
      isSuccess: false,
      error: ErrorCodes[1010],
      data: error instanceof Error ? error.message : "Failed to fetch events",
      toastMessage: "Failed to fetch events",
    };
    return next();
  }
}

/* ------------------------------------------------------------------ */
/*  GET /events/:id  — get one event                                   */
/* ------------------------------------------------------------------ */
export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  const txId = req.txId;

  try {
    if (!ObjectId.isValid(req.params.id)) {
      req.apiStatus = { isSuccess: false, error: ErrorCodes[1002], data: "Invalid event ID", toastMessage: "Invalid ID" };
      return next();
    }

    const event = await EventModel.findOne({ _id: new ObjectId(req.params.id), isDeleted: false })
      .populate("organizerId", "name email")
      .populate("participants", "name email");

    if (!event) {
      req.apiStatus = { isSuccess: false, error: ErrorCodes[1006], data: "Event not found", toastMessage: "Event not found" };
      return next();
    }

    req.apiStatus = { isSuccess: true, data: event };
    return next();
  } catch (error: unknown) {
    console.error(`getOne event error txId:${txId}`, error);
    req.apiStatus = {
      isSuccess: false,
      error: ErrorCodes[1010],
      data: error instanceof Error ? error.message : "Failed to fetch event",
      toastMessage: "Failed to fetch event",
    };
    return next();
  }
}

/* ------------------------------------------------------------------ */
/*  PUT /events/:id  — update event (organizer only, own events)       */
/* ------------------------------------------------------------------ */
export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  const txId = req.txId;

  try {
    if (!ObjectId.isValid(req.params.id)) {
      req.apiStatus = { isSuccess: false, error: ErrorCodes[1002], data: "Invalid event ID", toastMessage: "Invalid ID" };
      return next();
    }

    const event = await EventModel.findOne({ _id: new ObjectId(req.params.id), isDeleted: false });

    if (!event) {
      req.apiStatus = { isSuccess: false, error: ErrorCodes[1006], data: "Event not found", toastMessage: "Event not found" };
      return next();
    }

    if (String(event.organizerId) !== String(req.user._id)) {
      req.apiStatus = { isSuccess: false, error: ErrorCodes[1012], data: "You can only update your own events", toastMessage: "Forbidden" };
      return next();
    }

    const { title, description, date, startTime, endTime, maxCapacity, status } = req.body;
    const updatePayload: Partial<IEvent> = {};

    if (title !== undefined) {
      if (!title.trim()) { req.apiStatus = { isSuccess: false, error: ErrorCodes[1001], data: "title cannot be empty", toastMessage: "Validation error" }; return next(); }
      updatePayload.title = title.trim();
    }
    if (description !== undefined) {
      if (!description.trim()) { req.apiStatus = { isSuccess: false, error: ErrorCodes[1001], data: "description cannot be empty", toastMessage: "Validation error" }; return next(); }
      updatePayload.description = description.trim();
    }
    if (date !== undefined) updatePayload.date = date;
    if (startTime !== undefined) updatePayload.startTime = startTime;
    if (endTime !== undefined) updatePayload.endTime = endTime;

    const resolvedStart = startTime ?? event.startTime;
    const resolvedEnd = endTime ?? event.endTime;
    if (resolvedEnd <= resolvedStart) {
      req.apiStatus = { isSuccess: false, error: ErrorCodes[1001], data: "endTime must be after startTime", toastMessage: "Validation error" };
      return next();
    }

    if (maxCapacity !== undefined) {
      if (Number(maxCapacity) < event.participants.length) {
        req.apiStatus = { isSuccess: false, error: ErrorCodes[1001], data: `maxCapacity cannot be less than current participant count (${event.participants.length})`, toastMessage: "Validation error" };
        return next();
      }
      updatePayload.maxCapacity = Number(maxCapacity);
    }

    if (status !== undefined) {
      const validStatuses = Object.values(CONSTANTS.ENUM.EVENT_STATUS);
      if (!validStatuses.includes(status)) {
        req.apiStatus = { isSuccess: false, error: ErrorCodes[1001], data: `status must be one of: ${validStatuses.join(", ")}`, toastMessage: "Invalid status" };
        return next();
      }
      updatePayload.status = status;
    }

    const updated = await EventModel.findByIdAndUpdate(
      event._id,
      { $set: updatePayload },
      { new: true }
    ).populate("organizerId", "name email");

    req.apiStatus = { isSuccess: true, data: updated, message: "Event updated successfully", toastMessage: "Event updated" };
    return next();
  } catch (error: unknown) {
    console.error(`update event error txId:${txId}`, error);
    req.apiStatus = { isSuccess: false, error: ErrorCodes[1010], data: error instanceof Error ? error.message : "Failed to update event", toastMessage: "Failed to update event" };
    return next();
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /events/:id  — soft delete (organizer only, own events)     */
/* ------------------------------------------------------------------ */
export async function deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  const txId = req.txId;

  try {
    if (!ObjectId.isValid(req.params.id)) {
      req.apiStatus = { isSuccess: false, error: ErrorCodes[1002], data: "Invalid event ID", toastMessage: "Invalid ID" };
      return next();
    }

    const event = await EventModel.findOne({ _id: new ObjectId(req.params.id), isDeleted: false });

    if (!event) {
      req.apiStatus = { isSuccess: false, error: ErrorCodes[1006], data: "Event not found", toastMessage: "Event not found" };
      return next();
    }

    if (String(event.organizerId) !== String(req.user._id)) {
      req.apiStatus = { isSuccess: false, error: ErrorCodes[1012], data: "You can only delete your own events", toastMessage: "Forbidden" };
      return next();
    }

    await EventModel.findByIdAndUpdate(event._id, { $set: { isDeleted: true } });

    req.apiStatus = { isSuccess: true, data: "Event deleted successfully", message: "Event deleted successfully", toastMessage: "Event deleted" };
    return next();
  } catch (error: unknown) {
    console.error(`delete event error txId:${txId}`, error);
    req.apiStatus = { isSuccess: false, error: ErrorCodes[1010], data: error instanceof Error ? error.message : "Failed to delete event", toastMessage: "Failed to delete event" };
    return next();
  }
}

/* ------------------------------------------------------------------ */
/*  POST /events/:id/register  — attendee registers for an event       */
/* ------------------------------------------------------------------ */
export async function registerForEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  const txId = req.txId;

  try {
    if (!ObjectId.isValid(req.params.id)) {
      req.apiStatus = { isSuccess: false, error: ErrorCodes[1002], data: "Invalid event ID", toastMessage: "Invalid ID" };
      return next();
    }

    const event = await EventModel.findOne({ _id: new ObjectId(req.params.id), isDeleted: false });

    if (!event) {
      req.apiStatus = { isSuccess: false, error: ErrorCodes[1006], data: "Event not found", toastMessage: "Event not found" };
      return next();
    }

    if (event.status !== CONSTANTS.ENUM.EVENT_STATUS.UPCOMING) {
      req.apiStatus = { isSuccess: false, error: ErrorCodes[1006], data: "Registration is only open for upcoming events", toastMessage: "Registration closed" };
      return next();
    }

    const alreadyRegistered = event.participants.some((p) => String(p) === String(req.user._id));
    if (alreadyRegistered) {
      req.apiStatus = { isSuccess: false, error: ErrorCodes[1006], data: "You are already registered for this event", toastMessage: "Already registered" };
      return next();
    }

    if (event.participants.length >= event.maxCapacity) {
      req.apiStatus = { isSuccess: false, error: ErrorCodes[1006], data: "Event has reached maximum capacity", toastMessage: "Event is full" };
      return next();
    }

    await EventModel.findByIdAndUpdate(event._id, { $push: { participants: req.user._id } });

    // Fire-and-forget: confirmation email with .ics + Meet link
    sendEventRegistrationEmail({
      to: req.user.email,
      name: req.user.name,
      eventTitle: event.title,
      eventDate: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      description: event.description,
      meetLink: event.meetLink,
      eventId: String(event._id),
    });

    // Schedule 30-min reminder email
    scheduleReminderEmail({
      to: req.user.email,
      name: req.user.name,
      eventTitle: event.title,
      eventDate: event.date,
      startTime: event.startTime,
      meetLink: event.meetLink,
    });

    req.apiStatus = {
      isSuccess: true,
      data: {
        message: "Successfully registered for the event",
        meetLink: event.meetLink,
      },
      message: "Registration successful",
      toastMessage: "You are registered!",
    };
    return next();
  } catch (error: unknown) {
    console.error(`registerForEvent error txId:${txId}`, error);
    req.apiStatus = { isSuccess: false, error: ErrorCodes[1010], data: error instanceof Error ? error.message : "Registration failed", toastMessage: "Registration failed" };
    return next();
  }
}

/* ------------------------------------------------------------------ */
/*  GET /events/:id/participants  — list participants (organizer only)  */
/* ------------------------------------------------------------------ */
export async function getParticipants(req: Request, res: Response, next: NextFunction): Promise<void> {
  const txId = req.txId;

  try {
    if (!ObjectId.isValid(req.params.id)) {
      req.apiStatus = { isSuccess: false, error: ErrorCodes[1002], data: "Invalid event ID", toastMessage: "Invalid ID" };
      return next();
    }

    const event = await EventModel.findOne({ _id: new ObjectId(req.params.id), isDeleted: false })
      .populate("participants", "name email role");

    if (!event) {
      req.apiStatus = { isSuccess: false, error: ErrorCodes[1006], data: "Event not found", toastMessage: "Event not found" };
      return next();
    }

    if (String(event.organizerId) !== String(req.user._id)) {
      req.apiStatus = { isSuccess: false, error: ErrorCodes[1012], data: "Only the event organizer can view participants", toastMessage: "Forbidden" };
      return next();
    }

    req.apiStatus = {
      isSuccess: true,
      data: {
        eventId: event._id,
        title: event.title,
        totalParticipants: event.participants.length,
        maxCapacity: event.maxCapacity,
        participants: event.participants,
      },
    };
    return next();
  } catch (error: unknown) {
    console.error(`getParticipants error txId:${txId}`, error);
    req.apiStatus = { isSuccess: false, error: ErrorCodes[1010], data: error instanceof Error ? error.message : "Failed to fetch participants", toastMessage: "Failed to fetch participants" };
    return next();
  }
}
