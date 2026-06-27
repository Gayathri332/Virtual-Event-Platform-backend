export const CONSTANTS = {
  COLLECTIONS: {
    USER_COLLECTION: "users",
    EVENT_COLLECTION: "events",
  },
  ENUM: {
    ROLES: {
      ORGANIZER: "organizer",
      ATTENDEE: "attendee",
    },
    EVENT_STATUS: {
      UPCOMING: "upcoming",
      ONGOING: "ongoing",
      COMPLETED: "completed",
    },
  },
  MONGODB_RETRY_COUNT: 5,
  MONGODB_RECONNECT_INTERVAL: 5000,
};