import { Types } from "mongoose";
import { ApiError } from "@/src/server/api/http";
import { Group, GroupMember } from "@/src/server/models";

export async function requireGroupMembership(
  groupId: string,
  userId: string,
) {
  if (!Types.ObjectId.isValid(groupId)) {
    throw new ApiError(400, "invalid_request", "Invalid groupId");
  }

  const group = await Group.findById(groupId).lean();
  if (!group) {
    throw new ApiError(404, "not_found", "Group not found");
  }

  const membership = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(userId),
  }).lean();

  if (!membership) {
    throw new ApiError(403, "forbidden", "Not a member of this group");
  }

  return { group, membership };
}
