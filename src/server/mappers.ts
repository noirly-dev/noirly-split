import type { Group, GroupInvite, GroupMember } from "@/src/core/models/types";
import type {
  GroupDocument,
  GroupInviteDocument,
  GroupMemberDocument,
  SplitUserDocument,
} from "@/src/server/models";

export function mapGroup(doc: GroupDocument | (GroupDocument & { _id: { toString(): string } })): Group {
  return {
    id: doc._id.toString(),
    name: doc.name,
    icon: doc.icon ?? null,
    color: doc.color ?? null,
    baseCurrency: doc.baseCurrency,
    createdBy: doc.createdBy.toString(),
    archivedAt: doc.archivedAt ? new Date(doc.archivedAt).toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function mapMember(
  doc: GroupMemberDocument,
  user?: Pick<SplitUserDocument, "displayName" | "avatarUrl" | "email"> | null,
): GroupMember {
  return {
    id: doc._id.toString(),
    groupId: doc.groupId.toString(),
    userId: doc.userId.toString(),
    joinedAt: doc.joinedAt.toISOString(),
    displayName: user?.displayName ?? null,
    image: user?.avatarUrl ?? null,
    email: user?.email ?? null,
  };
}

export function mapInvite(doc: GroupInviteDocument): GroupInvite {
  return {
    id: doc._id.toString(),
    groupId: doc.groupId.toString(),
    token: doc.token,
    email: doc.email ?? null,
    createdBy: doc.createdBy.toString(),
    expiresAt: doc.expiresAt.toISOString(),
    acceptedAt: doc.acceptedAt ? doc.acceptedAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
  };
}

export {
  mapExpense,
  mapSettlement,
  mapActivity,
} from "@/src/server/mappers/expense";
