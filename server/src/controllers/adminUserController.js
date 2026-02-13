import User from "../models/User.js";
import createError from "http-errors";

/**
 * GET /admin/users
 * Admin: get all staff users (excluding passwords)
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ isDeleted: { $ne: true } })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    console.error("[getAllUsers]", error);
    next(error);
  }
};

/**
 * GET /admin/users/:id
 * Admin: get single user details
 */
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return next(createError(404, "User not found"));
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("[getUserById]", error);
    next(error);
  }
};

/**
 * PATCH /admin/users/:id
 * Admin: update user (name, email, role)
 */
export const updateUser = async (req, res, next) => {
  try {
    const { name, email, role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    // Prevent admin from changing their own role
    if (
      req.user._id.toString() === user._id.toString() &&
      role &&
      role !== "admin"
    ) {
      return next(createError(403, "You cannot change your own role"));
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase().trim();
    if (role) user.role = role;

    await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("[updateUser]", error);
    next(error);
  }
};

/**
 * PATCH /admin/users/:id/status
 * Admin: enable or disable a user
 */
export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    // Prevent admin from disabling themselves
    if (req.user._id.toString() === user._id.toString()) {
      return next(createError(403, "You cannot disable your own account"));
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      message: `User ${user.isActive ? "enabled" : "disabled"} successfully`,
      isActive: user.isActive,
    });
  } catch (error) {
    console.error("[toggleUserStatus]", error);
    next(error);
  }
};

/**
 * PATCH /admin/users/:id/reset-password
 * Admin: reset user password (temporary)
 */
export const resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return next(createError(400, "New password is required"));
    }

    const user = await User.findById(req.params.id).select("+password");
    if (!user) {
      return next(createError(404, "User not found"));
    }

    user.password = newPassword; // hashed by pre-save middleware
    user.mustChangePassword = user.role !== "admin";

    await user.save();

    res.status(200).json({
      message:
        "Password reset successfully. User must change password on login.",
    });
  } catch (error) {
    console.error("[resetUserPassword]", error);
    next(error);
  }
};

export const softDeleteUser = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return next(createError(404, "User not found"));

    // ✅ can't delete yourself
    if (req.user._id.toString() === target._id.toString()) {
      return next(createError(403, "You cannot delete your own account"));
    }

    // ✅ can't delete admins
    if (target.role === "admin") {
      return next(createError(403, "You cannot delete admin accounts"));
    }

    // already deleted? be idempotent
    target.isDeleted = true;
    target.deletedAt = new Date();
    target.isActive = false;

    await target.save();

    res.status(200).json({
      message: "User deleted (soft) successfully",
      user: {
        _id: target._id,
        isDeleted: target.isDeleted,
        deletedAt: target.deletedAt,
        isActive: target.isActive,
      },
    });
  } catch (error) {
    console.error("[softDeleteUser]", error);
    next(error);
  }
};

export const restoreUser = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return next(createError(404, "User not found"));

    // ✅ don't restore admins restriction isn't needed; admins can exist
    // but you *can* keep it if you want. I'll allow restore for any non-self user.

    target.isDeleted = false;
    target.deletedAt = null;
    target.isActive = true;

    await target.save();

    res.status(200).json({
      message: "User restored successfully",
      user: {
        _id: target._id,
        isDeleted: target.isDeleted,
        deletedAt: target.deletedAt,
        isActive: target.isActive,
      },
    });
  } catch (error) {
    console.error("[restoreUser]", error);
    next(error);
  }
};
