import User from "../models/User.js";
import bcrypt from "bcryptjs";
import createError from "http-errors";
import { generateToken } from "../utils/generateToken.js";

// .................... Register User ...........................................
export const registerUser = async (req, res, next) => {
  try {
    let { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return next(createError(400, "All fields are required."));
    }

    email = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(createError(400, "Email already in use."));
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("[registerUser]", error);
    next(error);
  }
};

// .................... Login User ...........................................
// .................... Login User ...........................................
export const loginUser = async (req, res, next) => {
  console.log("✅ LOGIN CONTROLLER HIT");
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(createError(400, "Email and password are required."));
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    console.log("LOGIN EMAIL:", email.toLowerCase().trim());
    console.log("USER FOUND:", user);

    if (!user) {
      return next(createError(400, "Invalid email or password."));
    }

    if (!user.isActive) {
      return next(createError(403, "Account disabled. Contact admin."));
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(createError(400, "Invalid email or password."));
    }
    const token = generateToken({ userId: user._id });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    });

    if (user.mustChangePassword && user.role !== "admin") {
      return res.status(200).json({
        mustChangePassword: true,
        message: "Password change required",
      });
    }

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("[loginUser] error:", error);
    next(error);
  }
};

// .......... Get current user profile.......................................
export const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

//................... Logout user.......................
export const logoutUser = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logout successful" });
};

export const changeMyPassword = async (req, res, next) => {
  try {
    const currentPassword = req.body.currentPassword?.trim();
    const newPassword = req.body.newPassword?.trim();

    if (!currentPassword || !newPassword) {
      return next(createError(400, "Both passwords are required."));
    }
    console.log("REQ USER ID:", req.user.id);
    const user = await User.findById(req.user.id).select("+password");
    console.log("REQ USER EMAIL:", user.email);
    console.log("CURRENT PASSWORD (input):", currentPassword);
    console.log("HASHED PASSWORD (db):", user.password);

    const isMatch = await user.comparePassword(currentPassword);

    console.log("COMPARE RESULT:", isMatch);

    if (!isMatch) {
      return next(createError(400, "Current password is incorrect."));
    }

    user.password = newPassword;
    user.mustChangePassword = false;

    await user.save();
    console.log("UPDATED HASH:", user.password);
    console.log(
      "TEST NEW PASSWORD:",
      await user.comparePassword(newPassword),
    );

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    next(err);
  }
};
