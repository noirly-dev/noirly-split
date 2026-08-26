import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
  type Types,
} from "mongoose";

const activityEventSchema = new Schema(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    type: {
      type: String,
      enum: [
        "expense.added",
        "expense.updated",
        "expense.deleted",
        "settlement.recorded",
        "member.joined",
        "group.updated",
      ],
      required: true,
    },
    actorId: { type: Schema.Types.ObjectId, ref: "SplitUser", required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activityEventSchema.index({ groupId: 1, createdAt: -1 });

export type ActivityEventDocument = InferSchemaType<
  typeof activityEventSchema
> & {
  _id: Types.ObjectId;
  createdAt: Date;
};

export const ActivityEvent: Model<ActivityEventDocument> =
  (models.ActivityEvent as Model<ActivityEventDocument>) ||
  model<ActivityEventDocument>(
    "ActivityEvent",
    activityEventSchema,
    "activity_events",
  );
