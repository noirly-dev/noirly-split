import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
  type Types,
} from "mongoose";

const groupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: null, trim: true },
    color: { type: String, default: null, trim: true },
    baseCurrency: {
      type: String,
      required: true,
      default: "USD",
      uppercase: true,
      trim: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "SplitUser", required: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

groupSchema.index({ createdBy: 1 });
groupSchema.index({ archivedAt: 1 });

export type GroupDocument = InferSchemaType<typeof groupSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Group: Model<GroupDocument> =
  (models.Group as Model<GroupDocument>) ||
  model<GroupDocument>("Group", groupSchema, "groups");
