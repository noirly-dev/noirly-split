import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
  type Types,
} from "mongoose";

const groupInviteSchema = new Schema(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    token: { type: String, required: true, unique: true, index: true },
    email: { type: String, default: null, lowercase: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "SplitUser", required: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

groupInviteSchema.index({ groupId: 1 });

export type GroupInviteDocument = InferSchemaType<typeof groupInviteSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
};

export const GroupInvite: Model<GroupInviteDocument> =
  (models.GroupInvite as Model<GroupInviteDocument>) ||
  model<GroupInviteDocument>("GroupInvite", groupInviteSchema, "group_invites");
