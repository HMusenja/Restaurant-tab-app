import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

/**
 User/Staff model
 */
const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    mustChangePassword: { type: Boolean, default: true },

    role: {
      type: String,
      enum: ["Reception", "Kitchen", "Bar", "admin"],
      default: "admin",
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },

    notificationPreferences: {
    soundEnabled: { type: Boolean, default: true },
    vibrationEnabled: { type: Boolean, default: true },
    urgentEnabled: { type: Boolean, default: true },
  },
  },
  { timestamps: true },
);

// 🔹 Hash password before saving
UserSchema.pre("save", async function () {
  if (this.isNew) {
    this.mustChangePassword = this.role !== "admin";
  }

  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 🔹 Compare password method
UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(String(candidatePassword), this.password);
};

const User = model("User", UserSchema);
export default User;
