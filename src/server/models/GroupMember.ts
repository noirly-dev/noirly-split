import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
  type Types,
} from "mongoose";

const groupMemberSchema = new Schema(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "SplitUser", required: true },
    joinedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: false },
);

groupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });
groupMemberSchema.index({ userId: 1 });

export type GroupMemberDocument = InferSchemaType<typeof groupMemberSchema> & {
  _id: Types.ObjectId;
};

export const GroupMember: Model<GroupMemberDocument> =
  (models.GroupMember as Model<GroupMemberDocument>) ||
  model<GroupMemberDocument>("GroupMember", groupMemberSchema, "group_members");
