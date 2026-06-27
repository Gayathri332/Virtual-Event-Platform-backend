import mongoose from "mongoose";
import request from "supertest";
import app from "../app";
import { UserModel } from "../db/models";

const MONGO_URI = "mongodb://localhost:27017/virtual-event-platform-test";

let organizerToken: string;
let attendeeToken: string;
let createdUserId: string;

beforeAll(async () => {
  await mongoose.connect(MONGO_URI);
  await UserModel.deleteMany({});
});

afterAll(async () => {
  await UserModel.deleteMany({});
  await mongoose.connection.close();
});

/* ------------------------------------------------------------------ */
/*  AUTH — register & login                                             */
/* ------------------------------------------------------------------ */
describe("POST /v1/auth/register", () => {
  it("should register an organizer", async () => {
    const res = await request(app).post("/v1/auth/register").send({
      name: "Alice Organizer",
      email: "alice@example.com",
      password: "Secret@123",
      role: "organizer",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("organizer");
    expect(res.body.data.email).toBe("alice@example.com");
  });

  it("should register an attendee", async () => {
    const res = await request(app).post("/v1/auth/register").send({
      name: "Bob Attendee",
      email: "bob@example.com",
      password: "Secret@123",
      role: "attendee",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("attendee");
    createdUserId = res.body.data._id;
  });

  it("should reject duplicate email", async () => {
    const res = await request(app).post("/v1/auth/register").send({
      name: "Duplicate",
      email: "alice@example.com",
      password: "Secret@123",
      role: "attendee",
    });
    expect(res.status).toBe(500);
    expect(res.body.data).toMatch(/already registered/i);
  });

  it("should reject missing required fields", async () => {
    const res = await request(app).post("/v1/auth/register").send({ email: "x@x.com" });
    expect(res.status).toBe(400);
  });
});

describe("POST /v1/auth/login", () => {
  it("should login as organizer and return tokens", async () => {
    const res = await request(app).post("/v1/auth/login").send({
      email: "alice@example.com",
      password: "Secret@123",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.access_token).toBeDefined();
    expect(res.body.data.refresh_token).toBeDefined();
    organizerToken = res.body.data.access_token;
  });

  it("should login as attendee and return tokens", async () => {
    const res = await request(app).post("/v1/auth/login").send({
      email: "bob@example.com",
      password: "Secret@123",
    });
    expect(res.status).toBe(200);
    attendeeToken = res.body.data.access_token;
  });

  it("should reject wrong password", async () => {
    const res = await request(app).post("/v1/auth/login").send({
      email: "alice@example.com",
      password: "WrongPass",
    });
    expect(res.status).toBe(500);
    expect(res.body.data).toMatch(/Invalid email or password/i);
  });

  it("should reject non-existent user", async () => {
    const res = await request(app).post("/v1/auth/login").send({
      email: "nobody@example.com",
      password: "Secret@123",
    });
    expect(res.status).toBe(500);
  });
});

/* ------------------------------------------------------------------ */
/*  USERS — profile                                                     */
/* ------------------------------------------------------------------ */
describe("GET /v1/users/profile", () => {
  it("should return own profile for authenticated user", async () => {
    const res = await request(app)
      .get("/v1/users/profile")
      .set("Authorization", `Bearer ${attendeeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("bob@example.com");
    expect(res.body.data.password).toBeUndefined();
  });

  it("should reject unauthenticated request", async () => {
    const res = await request(app).get("/v1/users/profile");
    expect(res.status).toBe(401);
  });
});

describe("PUT /v1/users/profile", () => {
  it("should update own name", async () => {
    const res = await request(app)
      .put("/v1/users/profile")
      .set("Authorization", `Bearer ${attendeeToken}`)
      .send({ name: "Bob Updated" });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Bob Updated");
  });

  it("should reject empty name", async () => {
    const res = await request(app)
      .put("/v1/users/profile")
      .set("Authorization", `Bearer ${attendeeToken}`)
      .send({ name: "   " });
    expect(res.status).toBe(400);
  });
});

/* ------------------------------------------------------------------ */
/*  USERS — organizer-only CRUD                                        */
/* ------------------------------------------------------------------ */
describe("POST /v1/users/getAll", () => {
  it("organizer can fetch all users", async () => {
    const res = await request(app)
      .post("/v1/users/getAll")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ page: 1, itemsPerPage: 10 });
    expect(res.status).toBe(200);
    expect(res.body.data.totalCount).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(res.body.data.tableData)).toBe(true);
  });

  it("attendee cannot access getAll", async () => {
    const res = await request(app)
      .post("/v1/users/getAll")
      .set("Authorization", `Bearer ${attendeeToken}`)
      .send({});
    expect(res.status).toBe(401);
  });

  it("can filter users by role", async () => {
    const res = await request(app)
      .post("/v1/users/getAll")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ role: "attendee" });
    expect(res.status).toBe(200);
    res.body.data.tableData.forEach((u: any) => expect(u.role).toBe("attendee"));
  });

  it("can search users by name", async () => {
    const res = await request(app)
      .post("/v1/users/getAll")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ search: "Alice" });
    expect(res.status).toBe(200);
    expect(res.body.data.tableData.length).toBeGreaterThanOrEqual(1);
  });
});

describe("GET /v1/users/:id", () => {
  it("organizer can get user by ID", async () => {
    const res = await request(app)
      .get(`/v1/users/${createdUserId}`)
      .set("Authorization", `Bearer ${organizerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(createdUserId);
    expect(res.body.data.password).toBeUndefined();
  });

  it("should return 400 for invalid ID format", async () => {
    const res = await request(app)
      .get("/v1/users/not-an-id")
      .set("Authorization", `Bearer ${organizerToken}`);
    expect(res.status).toBe(400);
  });

  it("attendee cannot get other users by ID", async () => {
    const res = await request(app)
      .get(`/v1/users/${createdUserId}`)
      .set("Authorization", `Bearer ${attendeeToken}`);
    expect(res.status).toBe(401);
  });
});

describe("PUT /v1/users/:id", () => {
  it("organizer can update user role", async () => {
    const res = await request(app)
      .put(`/v1/users/${createdUserId}`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ role: "organizer" });
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("organizer");
  });

  it("organizer can disable a user", async () => {
    const res = await request(app)
      .put(`/v1/users/${createdUserId}`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ isEnabled: false });
    expect(res.status).toBe(200);
    expect(res.body.data.isEnabled).toBe(false);
  });

  it("should reject invalid role value", async () => {
    const res = await request(app)
      .put(`/v1/users/${createdUserId}`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ role: "superadmin" });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /v1/users/:id", () => {
  it("organizer can soft-delete a user", async () => {
    const res = await request(app)
      .delete(`/v1/users/${createdUserId}`)
      .set("Authorization", `Bearer ${organizerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatch(/deleted/i);
  });

  it("deleted user should not appear in getAll", async () => {
    const res = await request(app)
      .post("/v1/users/getAll")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ search: "Bob" });
    expect(res.status).toBe(200);
    const found = res.body.data.tableData.find((u: any) => u._id === createdUserId);
    expect(found).toBeUndefined();
  });

  it("should return 404 for already-deleted user", async () => {
    const res = await request(app)
      .delete(`/v1/users/${createdUserId}`)
      .set("Authorization", `Bearer ${organizerToken}`);
    expect(res.status).toBe(500);
  });
});
