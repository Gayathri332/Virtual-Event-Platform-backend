import mongoose from "mongoose";
import { CONSTANTS } from "../utils/v1/constants";

export const DB_STATE = {
  DISCONNECTED: 0,
  CONNECTED: 1,
  CONNECTING: 2,
  DISCONNECTING: 3,
};

export class DB {
  private static db: mongoose.Connection;

  public getDB(): mongoose.Connection {
    return DB.db;
  }

  public async connectWithRetry(uri: string): Promise<typeof mongoose> {
    let conn: typeof mongoose | undefined;

    for (let i = 0; i < CONSTANTS.MONGODB_RETRY_COUNT; i++) {
      try {
        conn = await mongoose.connect(uri, {
          serverSelectionTimeoutMS: CONSTANTS.MONGODB_RECONNECT_INTERVAL,
        });
        break;
      } catch (err) {
        console.error(`Mongoose failed to connect. Attempt ${i + 1}/${CONSTANTS.MONGODB_RETRY_COUNT}. Retrying in 5s...`, err);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    if (!conn) {
      throw new Error("Mongoose failed to connect to MongoDB after multiple attempts.");
    }

    mongoose.Promise = global.Promise;
    DB.db = mongoose.connection;
    return conn;
  }

  public connectionClose(callback?: () => void): void {
    mongoose.connection
      .close()
      .then(() => {
        console.info("Mongoose connection closed");
        if (callback) callback();
      })
      .catch((err) => {
        console.error("Error closing Mongoose connection: " + err);
        if (callback) callback();
      });
  }
}

export function isDBConnected(): boolean {
  return mongoose.connection.readyState === DB_STATE.CONNECTED;
}

mongoose.connection.on("error", (err) => {
  console.error("Mongoose error", err);
});

mongoose.connection.on("connected", () => {
  console.info("MongoDB connected successfully");
});

mongoose.connection.on("disconnected", () => {
  console.info("Mongoose disconnected");
});
