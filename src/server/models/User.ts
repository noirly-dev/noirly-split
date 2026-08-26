import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
  type Types,
} from "mongoose";

const userSchema = new Schema(
  {
    identitySub: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    emailVerified: { type: Boolean, default: false },
    displayName: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: null },
    preferredCurrency: {
      type: String,
      required: true,
      default: "USD",
      uppercase: true,
      trim: true,
    },
  },
  { timestamps: true },
);

export type SplitUserDocument = InferSchemaType<typeof userSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const SplitUser: Model<SplitUserDocument> =
  (models.SplitUser as Model<SplitUserDocument>) ||
  model<SplitUserDocument>("SplitUser", userSchema, "users");
