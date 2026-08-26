import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
  type Types,
} from "mongoose";

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "SplitUser", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "Group", default: null },
    type: {
      type: String,
      enum: ["expense.added", "settlement.recorded", "member.joined"],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    href: { type: String, required: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, readAt: 1 });

export type NotificationDocument = InferSchemaType<
  typeof notificationSchema
> & {
  _id: Types.ObjectId;
  createdAt: Date;
};

export const Notification: Model<NotificationDocument> =
  (models.Notification as Model<NotificationDocument>) ||
  model<NotificationDocument>(
    "Notification",
    notificationSchema,
    "notifications",
  );
