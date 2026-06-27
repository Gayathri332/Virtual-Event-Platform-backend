export * from "./user.model";
export * from "./event.model";

export const ErrorCodes: Record<number, { code: number; message: string }> = {
  1001: { code: 1001, message: "Validation Error" },
  1002: { code: 1002, message: "Invalid ID" },
  1003: { code: 1003, message: "Update Failed" },
  1006: { code: 1006, message: "Not Found / Bad Request" },
  1010: { code: 1010, message: "Internal Server Error" },
  1012: { code: 1012, message: "Unauthorized" },
};
