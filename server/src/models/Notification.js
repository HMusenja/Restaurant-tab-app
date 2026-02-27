import { Schema, model } from "mongoose";

const NotificationSchema = new Schema(
  {
    // recipient user
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // optional info about the target
    recipientRole: {
      type: String,
      enum: ["Reception", "Kitchen", "Bar", "admin", "ALL"],
      default: null,
      index: true,
    },

    type: {
      type: String,
      enum: ["REQUEST_NEW", "REQUEST_URGENT", "TICKET_NEW", "TICKET_STATUS", "TICKET_UPDATED", "SYSTEM"],
      required: true,
      index: true,
    },

    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },

    severity: { type: String, enum: ["normal", "urgent"], default: "normal", index: true },

    readAt: { type: Date, default: null, index: true },

     clearedAt: { type: Date, default: null, index: true },

    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// inbox sort
NotificationSchema.index({ userId: 1, createdAt: -1, _id: -1 });
NotificationSchema.index({ userId: 1, readAt: 1, clearedAt: 1 });

// Auto-cleanup old notifications (14 days)
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });


const Notification = model("Notification", NotificationSchema);
export default Notification;