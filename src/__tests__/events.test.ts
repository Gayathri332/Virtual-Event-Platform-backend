import mongoose from "mongoose";
import request from "supertest";
import app from "../app";
import { UserModel, EventModel } from "../db/models";

const MONGO_URI = "mongodb://localhost:27017/virtual-event-platform-test";

let organizerToken: string;
let attendeeToken: string;
let organizerId: string;
let attendeeId: string;
let createdEventId: string;

beforeAll(async () => {
  await mongoose.connect(MONGO_URI);
  await UserModel.deleteMany({});
  await EventModel.deleteMany({});

  // Register and login organizer
  const orgReg = await request(app).post("/v1/auth/register").send({
    name: "Alice Organizer",
    email: "alice@example.com",
    password: "Secret@123",
    role: "organizer",
  });
  organizerId = orgReg.body.data._id;

  const orgLogin = await request(app).post("/v1/auth/login").send({
    email: "alice@example.com",
    password: "Secret@123",
  });
  organizerToken = orgLogin.body.data.access_token;

  // Register and login attendee
  const attReg = await request(app).post("/v1/auth/register").send({
    name: "Bob Attendee",
    email: "bob@example.com",
    password: "Secret@123",
    role: "attendee",
  });
  attendeeId = attReg.body.data._id;

  const attLogin = await request(app).post("/v1/auth/login").send({
    email: "bob@example.com",
    password: "Secret@123",
  });
  attendeeToken = attLogin.body.data.access_token;
});

afterAll(async () => {
  await UserModel.deleteMany({});
  await EventModel.deleteMany({});
  await mongoose.connection.close();
});

/* ------------------------------------------------------------------ */
/*  POST /events  — create                                              */
/* ------------------------------------------------------------------ */
describe("POST /v1/events", () => {
  it("organizer can create an event", async () => {
    const res = await request(app)
      .post("/v1/events")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({
        title: "TypeScript Workshop 2025",
        description: "A hands-on TypeScript workshop",
        date: "2025-08-15",
        startTime: "10:00",
        endTime: "12:00",
        maxCapacity: 100,
      });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("TypeScript Workshop 2025");
    expect(res.body.data.status).toBe("upcoming");
    expect(res.body.data.participants).toHaveLength(0);
    createdEventId = res.body.data._id;
  });

  it("attendee cannot create an event", async () => {
    const res = await request(app)
      .post("/v1/events")
      .set("Authorization", `Bearer ${attendeeToken}`)
      .send({
        title: "Unauthorised Event",
        description: "Should not be created",
        date: "2025-08-15",
        startTime: "10:00",
        endTime: "12:00",
        maxCapacity: 50,
      });
    expect(res.status).toBe(401);
  });

  it("should reject missing required fields", async () => {
    const res = await request(app)
      .post("/v1/events")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ title: "No description" });
    expect(res.status).toBe(400);
  });

  it("should reject maxCapacity less than 1", async () => {
    const res = await request(app)
      .post("/v1/events")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({
        title: "Bad capacity",
        description: "desc",
        date: "2025-08-15",
        startTime: "10:00",
        endTime: "12:00",
        maxCapacity: 0,
      });
    expect(res.status).toBe(400);
  });

  it("should reject unauthenticated request", async () => {
    const res = await request(app).post("/v1/events").send({
      title: "No auth",
      description: "desc",
      date: "2025-08-15",
      startTime: "10:00",
        endTime: "12:00",
      maxCapacity: 10,
    });
    expect(res.status).toBe(401);
  });
});

/* ------------------------------------------------------------------ */
/*  POST /events/getAll                                                 */
/* ------------------------------------------------------------------ */
describe("POST /v1/events/getAll", () => {
  it("authenticated user can list all events", async () => {
    const res = await request(app)
      .post("/v1/events/getAll")
      .set("Authorization", `Bearer ${attendeeToken}`)
      .send({ page: 1, itemsPerPage: 10 });
    expect(res.status).toBe(200);
    expect(res.body.data.totalCount).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.data.tableData)).toBe(true);
  });

  it("can filter events by status", async () => {
    const res = await request(app)
      .post("/v1/events/getAll")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ status: "upcoming" });
    expect(res.status).toBe(200);
    res.body.data.tableData.forEach((e: any) => expect(e.status).toBe("upcoming"));
  });

  it("can search events by title", async () => {
    const res = await request(app)
      .post("/v1/events/getAll")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ search: "TypeScript" });
    expect(res.status).toBe(200);
    expect(res.body.data.tableData.length).toBeGreaterThanOrEqual(1);
  });

  it("should reject unauthenticated request", async () => {
    const res = await request(app).post("/v1/events/getAll").send({});
    expect(res.status).toBe(401);
  });
});

/* ------------------------------------------------------------------ */
/*  GET /events/:id                                                     */
/* ------------------------------------------------------------------ */
describe("GET /v1/events/:id", () => {
  it("authenticated user can get event by ID", async () => {
    const res = await request(app)
      .get(`/v1/events/${createdEventId}`)
      .set("Authorization", `Bearer ${attendeeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(createdEventId);
    expect(res.body.data.organizerId).toBeDefined();
  });

  it("should return 400 for invalid ID format", async () => {
    const res = await request(app)
      .get("/v1/events/not-an-id")
      .set("Authorization", `Bearer ${attendeeToken}`);
    expect(res.status).toBe(400);
  });

  it("should return error for non-existent event", async () => {
    const res = await request(app)
      .get("/v1/events/665f1a2b3c4d5e6f7a8b9c99")
      .set("Authorization", `Bearer ${attendeeToken}`);
    expect(res.status).toBe(500);
  });
});

/* ------------------------------------------------------------------ */
/*  POST /events/:id/register                                           */
/* ------------------------------------------------------------------ */
describe("POST /v1/events/:id/register", () => {
  it("attendee can register for an event", async () => {
    const res = await request(app)
      .post(`/v1/events/${createdEventId}/register`)
      .set("Authorization", `Bearer ${attendeeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatch(/registered/i);
  });

  it("cannot register twice for the same event", async () => {
    const res = await request(app)
      .post(`/v1/events/${createdEventId}/register`)
      .set("Authorization", `Bearer ${attendeeToken}`);
    expect(res.status).toBe(500);
    expect(res.body.data).toMatch(/already registered/i);
  });

  it("organizer can also register as attendee", async () => {
    const res = await request(app)
      .post(`/v1/events/${createdEventId}/register`)
      .set("Authorization", `Bearer ${organizerToken}`);
    expect(res.status).toBe(200);
  });

  it("should return 400 for invalid event ID", async () => {
    const res = await request(app)
      .post("/v1/events/bad-id/register")
      .set("Authorization", `Bearer ${attendeeToken}`);
    expect(res.status).toBe(400);
  });

  it("should reject unauthenticated request", async () => {
    const res = await request(app).post(`/v1/events/${createdEventId}/register`);
    expect(res.status).toBe(401);
  });
});

/* ------------------------------------------------------------------ */
/*  GET /events/:id/participants                                        */
/* ------------------------------------------------------------------ */
describe("GET /v1/events/:id/participants", () => {
  it("organizer (event owner) can view participants", async () => {
    const res = await request(app)
      .get(`/v1/events/${createdEventId}/participants`)
      .set("Authorization", `Bearer ${organizerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalParticipants).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.data.participants)).toBe(true);
    expect(res.body.data.title).toBe("TypeScript Workshop 2025");
  });

  it("attendee cannot view participants list", async () => {
    const res = await request(app)
      .get(`/v1/events/${createdEventId}/participants`)
      .set("Authorization", `Bearer ${attendeeToken}`);
    expect(res.status).toBe(401);
  });
});

/* ------------------------------------------------------------------ */
/*  PUT /events/:id                                                     */
/* ------------------------------------------------------------------ */
describe("PUT /v1/events/:id", () => {
  it("organizer can update their own event", async () => {
    const res = await request(app)
      .put(`/v1/events/${createdEventId}`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ title: "TypeScript Workshop — Updated", maxCapacity: 150 });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("TypeScript Workshop — Updated");
    expect(res.body.data.maxCapacity).toBe(150);
  });

  it("can update event status", async () => {
    const res = await request(app)
      .put(`/v1/events/${createdEventId}`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ status: "ongoing" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("ongoing");
  });

  it("should reject invalid status value", async () => {
    const res = await request(app)
      .put(`/v1/events/${createdEventId}`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ status: "archived" });
    expect(res.status).toBe(400);
  });

  it("attendee cannot update an event", async () => {
    const res = await request(app)
      .put(`/v1/events/${createdEventId}`)
      .set("Authorization", `Bearer ${attendeeToken}`)
      .send({ title: "Hijacked Title" });
    expect(res.status).toBe(401);
  });

  it("should reject invalid ID format", async () => {
    const res = await request(app)
      .put("/v1/events/bad-id")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ title: "test" });
    expect(res.status).toBe(400);
  });
});

/* ------------------------------------------------------------------ */
/*  DELETE /events/:id                                                  */
/* ------------------------------------------------------------------ */
describe("DELETE /v1/events/:id", () => {
  it("organizer can soft-delete their event", async () => {
    const res = await request(app)
      .delete(`/v1/events/${createdEventId}`)
      .set("Authorization", `Bearer ${organizerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatch(/deleted/i);
  });

  it("deleted event should not appear in getAll", async () => {
    const res = await request(app)
      .post("/v1/events/getAll")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ search: "TypeScript" });
    expect(res.status).toBe(200);
    const found = res.body.data.tableData.find((e: any) => e._id === createdEventId);
    expect(found).toBeUndefined();
  });

  it("attendee cannot delete an event", async () => {
    // create a fresh event first
    const createRes = await request(app)
      .post("/v1/events")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({
        title: "Temp Event",
        description: "For delete test",
        date: "2025-09-01",
        startTime: "09:00",
      endTime: "11:00",
        maxCapacity: 20,
      });
    const tempId = createRes.body.data._id;

    const res = await request(app)
      .delete(`/v1/events/${tempId}`)
      .set("Authorization", `Bearer ${attendeeToken}`);
    expect(res.status).toBe(401);
  });
});
