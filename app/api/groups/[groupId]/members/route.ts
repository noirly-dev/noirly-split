import { Types } from "mongoose";
import {
  assertObjectId,
  jsonError,
  jsonOk,
  requireSplitSession,
} from "@/src/server/api/http";
import { withDb } from "@/src/server/db/mongodb";
import { requireGroupMembership } from "@/src/server/groups/access";
import { mapMember } from "@/src/server/mappers";
import { GroupMember, SplitUser } from "@/src/server/models";

type Params = { params: Promise<{ groupId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireSplitSession();
    const { groupId } = await params;
    await assertObjectId(groupId, "groupId");

    const members = await withDb(async () => {
      await requireGroupMembership(groupId, ctx.userId);
      const memberships = await GroupMember.find({
        groupId: new Types.ObjectId(groupId),
      })
        .sort({ joinedAt: 1 })
        .lean();
      const userIds = memberships.map((m) => m.userId);
      const users = await SplitUser.find({ _id: { $in: userIds } }).lean();
      const byId = new Map(users.map((u) => [u._id.toString(), u]));
      return memberships.map((m) =>
        mapMember(m, byId.get(m.userId.toString()) ?? null),
      );
    });

    return jsonOk({ members });
  } catch (error) {
    return jsonError(error);
  }
}
