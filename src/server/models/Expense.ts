import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
  type Types,
} from "mongoose";

const payerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "SplitUser", required: true },
    amountPaid: { type: Number, required: true },
    amountPaidInBase: { type: Number, required: true },
  },
  { _id: false },
);

const splitSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "SplitUser", required: true },
    amountOwed: { type: Number, required: true },
    amountOwedInBase: { type: Number, required: true },
    percentage: { type: Number, default: null },
    shares: { type: Number, default: null },
  },
  { _id: false },
);

const recurrenceSchema = new Schema(
  {
    frequency: { type: String, enum: ["weekly", "monthly"], required: true },
    interval: { type: Number, required: true, default: 1 },
    nextRunAt: { type: Date, required: true },
    endAt: { type: Date, default: null },
  },
  { _id: false },
);

const expenseSchema = new Schema(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, uppercase: true, trim: true },
    fxRateToBase: { type: Number, required: true, default: 1 },
    amountInBase: { type: Number, required: true },
    description: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    category: {
      type: String,
      enum: ["food", "travel", "rent", "utilities", "other"],
      default: null,
    },
    receiptUrl: { type: String, default: null },
    splitMethod: {
      type: String,
      enum: ["equal", "unequal", "percentage", "shares"],
      required: true,
      default: "equal",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "SplitUser", required: true },
    isRecurring: { type: Boolean, default: false },
    recurrenceRule: { type: recurrenceSchema, default: null },
    recurrenceParentId: {
      type: Schema.Types.ObjectId,
      ref: "Expense",
      default: null,
    },
    payers: { type: [payerSchema], default: [] },
    splits: { type: [splitSchema], default: [] },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

expenseSchema.index({ groupId: 1, date: -1 });
expenseSchema.index({ groupId: 1, deletedAt: 1 });

export type ExpenseDocument = InferSchemaType<typeof expenseSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Expense: Model<ExpenseDocument> =
  (models.Expense as Model<ExpenseDocument>) ||
  model<ExpenseDocument>("Expense", expenseSchema, "expenses");
