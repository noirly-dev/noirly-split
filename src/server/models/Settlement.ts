import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
  type Types,
} from "mongoose";

const settlementSchema = new Schema(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    fromUserId: { type: Schema.Types.ObjectId, ref: "SplitUser", required: true },
    toUserId: { type: Schema.Types.ObjectId, ref: "SplitUser", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, uppercase: true, trim: true },
    note: { type: String, default: null, trim: true },
    settledAt: { type: Date, required: true, default: () => new Date() },
    createdBy: { type: Schema.Types.ObjectId, ref: "SplitUser", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

settlementSchema.index({ groupId: 1, settledAt: -1 });

export type SettlementDocument = InferSchemaType<typeof settlementSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
};

export const Settlement: Model<SettlementDocument> =
  (models.Settlement as Model<SettlementDocument>) ||
  model<SettlementDocument>("Settlement", settlementSchema, "settlements");
