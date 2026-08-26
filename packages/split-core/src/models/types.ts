/** Shared domain types for Noirly Split (UI-agnostic). */

export type CurrencyCode = string;
export type MinorAmount = number;

export type ExpenseCategory =
  | "food"
  | "travel"
  | "rent"
  | "utilities"
  | "other";

export type SplitMethod = "equal" | "unequal" | "percentage" | "shares";

export type RecurrenceFrequency = "weekly" | "monthly";

export type ActivityType =
  | "expense.added"
  | "expense.updated"
  | "expense.deleted"
  | "settlement.recorded"
  | "member.joined"
  | "group.updated";

export interface User {
  id: string;
  identitySub: string;
  email: string;
  name: string | null;
  image: string | null;
  preferredCurrency: CurrencyCode;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  baseCurrency: CurrencyCode;
  createdBy: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  joinedAt: string;
  displayName?: string | null;
  image?: string | null;
  email?: string | null;
}

export interface GroupInvite {
  id: string;
  groupId: string;
  token: string;
  email: string | null;
  createdBy: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  nextRunAt: string;
  endAt: string | null;
}

export interface ExpensePayer {
  userId: string;
  amountPaid: MinorAmount;
  amountPaidInBase: MinorAmount;
}

export interface ExpenseSplit {
  userId: string;
  amountOwed: MinorAmount;
  amountOwedInBase: MinorAmount;
  percentage: number | null;
  shares: number | null;
}

export interface Expense {
  id: string;
  groupId: string;
  amount: MinorAmount;
  currency: CurrencyCode;
  fxRateToBase: number;
  amountInBase: MinorAmount;
  description: string;
  date: string;
  category: ExpenseCategory | null;
  receiptUrl: string | null;
  splitMethod: SplitMethod;
  createdBy: string;
  isRecurring: boolean;
  recurrenceRule: RecurrenceRule | null;
  recurrenceParentId: string | null;
  payers: ExpensePayer[];
  splits: ExpenseSplit[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: MinorAmount;
  currency: CurrencyCode;
  note: string | null;
  settledAt: string;
  createdBy: string;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  groupId: string;
  type: ActivityType;
  actorId: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  groupId: string | null;
  type: "expense.added" | "settlement.recorded" | "member.joined";
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
}

export interface NetBalance {
  userId: string;
  netInBase: MinorAmount;
}

export interface SimplifiedDebt {
  fromUserId: string;
  toUserId: string;
  amountInBase: MinorAmount;
}
