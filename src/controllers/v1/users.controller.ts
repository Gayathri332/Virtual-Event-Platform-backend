import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import { UserModel, ErrorCodes, IUser } from "../../db/models";
import { CONSTANTS } from "../../utils/v1/constants";

/* ------------------------------------------------------------------ */
/*  GET /users/profile  — current user's own profile                   */
/* ------------------------------------------------------------------ */
export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  const txId = req.txId;

  try {
    if (!req.user) {
      req.apiStatus = {
        isSuccess: false,
        error: ErrorCodes[1012],
        data: "Unauthorized",
        toastMessage: "Unauthorized",
      };
      return next();
    }

    const user = await UserModel.findOne(
      { _id: req.user._id, isDeleted: false },
      { password: 0 }
    );

    if (!user) {
      req.apiStatus = {
        isSuccess: false,
        error: ErrorCodes[1006],
        data: "User not found",
        toastMessage: "User not found",
      };
      return next();
    }

    req.apiStatus = { isSuccess: true, data: user };
    return next();
  } catch (error: unknown) {
    console.error(`getProfile error txId:${txId}`, error);
    req.apiStatus = {
      isSuccess: false,
      error: ErrorCodes[1010],
      data: error instanceof Error ? error.message : "Failed to fetch profile",
      toastMessage: "Error fetching profile",
    };
    return next();
  }
}

/* ------------------------------------------------------------------ */
/*  GET /users/:id  — get one user by ID (organizer only)              */
/* ------------------------------------------------------------------ */
export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  const txId = req.txId;

  try {
    if (!ObjectId.isValid(req.params.id)) {
      req.apiStatus = {
        isSuccess: false,
        error: ErrorCodes[1002],
        data: "Invalid user ID",
        toastMessage: "Invalid ID",
      };
      return next();
    }

    const user = await UserModel.findOne(
      { _id: new ObjectId(req.params.id), isDeleted: false },
      { password: 0 }
    );

    if (!user) {
      req.apiStatus = {
        isSuccess: false,
        error: ErrorCodes[1006],
        data: "User not found",
        toastMessage: "User not found",
      };
      return next();
    }

    req.apiStatus = { isSuccess: true, data: user };
    return next();
  } catch (error: unknown) {
    console.error(`getOne error txId:${txId}`, error);
    req.apiStatus = {
      isSuccess: false,
      error: ErrorCodes[1010],
      data: error instanceof Error ? error.message : "Failed to fetch user",
      toastMessage: "Error fetching user",
    };
    return next();
  }
}

/* ------------------------------------------------------------------ */
/*  POST /users/getAll  — list users (organizer only)                  */
/* ------------------------------------------------------------------ */
export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  const txId = req.txId;

  try {
    const { search, role, isEnabled, page = 1, itemsPerPage = 10 } = req.body;

    const filter: Record<string, any> = { isDeleted: false };

    if (role) filter.role = role;
    if (typeof isEnabled === "boolean") filter.isEnabled = isEnabled;
    if (search?.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(itemsPerPage);

    const [users, totalCount] = await Promise.all([
      UserModel.find(filter, { password: 0 })
        .skip(skip)
        .limit(Number(itemsPerPage))
        .sort({ createdAt: -1 }),
      UserModel.countDocuments(filter),
    ]);

    req.apiStatus = {
      isSuccess: true,
      data: { totalCount, tableData: users },
    };
    return next();
  } catch (error: unknown) {
    console.error(`getAll error txId:${txId}`, error);
    req.apiStatus = {
      isSuccess: false,
      error: ErrorCodes[1010],
      data: error instanceof Error ? error.message : "Failed to fetch users",
      toastMessage: "Error fetching users",
    };
    return next();
  }
}

/* ------------------------------------------------------------------ */
/*  PUT /users/profile  — update own profile                           */
/* ------------------------------------------------------------------ */
export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  const txId = req.txId;

  try {
    if (!req.user) {
      req.apiStatus = {
        isSuccess: false,
        error: ErrorCodes[1012],
        data: "Unauthorized",
        toastMessage: "Unauthorized",
      };
      return next();
    }

    const { name, password } = req.body;
    const updatePayload: Partial<IUser> = {};

    if (name !== undefined) {
      if (!name.trim()) {
        req.apiStatus = {
          isSuccess: false,
          error: ErrorCodes[1001],
          data: "name cannot be empty",
          toastMessage: "Validation error",
        };
        return next();
      }
      updatePayload.name = name.trim();
    }

    if (password !== undefined) {
      if (!password.trim() || password.length < 8) {
        req.apiStatus = {
          isSuccess: false,
          error: ErrorCodes[1001],
          data: "password must be at least 8 characters",
          toastMessage: "Validation error",
        };
        return next();
      }
      updatePayload.password = await bcrypt.hash(password, 10);
    }

    const updated = await UserModel.findOneAndUpdate(
      { _id: req.user._id, isDeleted: false },
      { $set: updatePayload },
      { new: true, projection: { password: 0 } }
    );

    if (!updated) {
      req.apiStatus = {
        isSuccess: false,
        error: ErrorCodes[1006],
        data: "User not found",
        toastMessage: "User not found",
      };
      return next();
    }

    req.apiStatus = {
      isSuccess: true,
      data: updated,
      message: "Profile updated successfully",
      toastMessage: "Profile updated",
    };
    return next();
  } catch (error: unknown) {
    console.error(`updateProfile error txId:${txId}`, error);
    req.apiStatus = {
      isSuccess: false,
      error: ErrorCodes[1010],
      data: error instanceof Error ? error.message : "Update failed",
      toastMessage: "Update failed",
    };
    return next();
  }
}

/* ------------------------------------------------------------------ */
/*  PUT /users/:id  — update any user (organizer only)                 */
/* ------------------------------------------------------------------ */
export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  const txId = req.txId;

  try {
    if (!ObjectId.isValid(req.params.id)) {
      req.apiStatus = {
        isSuccess: false,
        error: ErrorCodes[1002],
        data: "Invalid user ID",
        toastMessage: "Invalid ID",
      };
      return next();
    }

    const { name, isEnabled, role } = req.body;
    const updatePayload: Record<string, any> = {};

    if (name !== undefined) {
      if (!name.trim()) {
        req.apiStatus = {
          isSuccess: false,
          error: ErrorCodes[1001],
          data: "name cannot be empty",
          toastMessage: "Validation error",
        };
        return next();
      }
      updatePayload.name = name.trim();
    }

    if (typeof isEnabled === "boolean") updatePayload.isEnabled = isEnabled;

    if (role !== undefined) {
      const validRoles = Object.values(CONSTANTS.ENUM.ROLES);
      if (!validRoles.includes(role)) {
        req.apiStatus = {
          isSuccess: false,
          error: ErrorCodes[1001],
          data: `role must be one of: ${validRoles.join(", ")}`,
          toastMessage: "Invalid role",
        };
        return next();
      }
      updatePayload.role = role;
    }

    const updated = await UserModel.findOneAndUpdate(
      { _id: new ObjectId(req.params.id), isDeleted: false },
      { $set: updatePayload },
      { new: true, projection: { password: 0 } }
    );

    if (!updated) {
      req.apiStatus = {
        isSuccess: false,
        error: ErrorCodes[1006],
        data: "User not found",
        toastMessage: "User not found",
      };
      return next();
    }

    req.apiStatus = {
      isSuccess: true,
      data: updated,
      message: "User updated successfully",
      toastMessage: "User updated",
    };
    return next();
  } catch (error: unknown) {
    console.error(`update error txId:${txId}`, error);
    req.apiStatus = {
      isSuccess: false,
      error: ErrorCodes[1010],
      data: error instanceof Error ? error.message : "Update failed",
      toastMessage: "Update failed",
    };
    return next();
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /users/:id  — soft delete (organizer only)                  */
/* ------------------------------------------------------------------ */
export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const txId = req.txId;

  try {
    if (!ObjectId.isValid(req.params.id)) {
      req.apiStatus = {
        isSuccess: false,
        error: ErrorCodes[1002],
        data: "Invalid user ID",
        toastMessage: "Invalid ID",
      };
      return next();
    }

    const user = await UserModel.findOne({ _id: new ObjectId(req.params.id), isDeleted: false });

    if (!user) {
      req.apiStatus = {
        isSuccess: false,
        error: ErrorCodes[1006],
        data: "User not found",
        toastMessage: "User not found",
      };
      return next();
    }

    await UserModel.findByIdAndUpdate(user._id, { $set: { isDeleted: true } });

    req.apiStatus = {
      isSuccess: true,
      data: "User deleted successfully",
      message: "User deleted successfully",
      toastMessage: "User deleted",
    };
    return next();
  } catch (error: unknown) {
    console.error(`deleteUser error txId:${txId}`, error);
    req.apiStatus = {
      isSuccess: false,
      error: ErrorCodes[1010],
      data: error instanceof Error ? error.message : "Delete failed",
      toastMessage: "Delete failed",
    };
    return next();
  }
}
