import { Types } from "mongoose";
import {
  ApiError,
  assertObjectId,
  jsonError,
  jsonOk,
  requireSplitSession,
} from "@/src/server/api/http";
import { withDb } from "@/src/server/db/mongodb";
import { requireGroupMembership } from "@/src/server/groups/access";
import { GroupMember } from "@/src/server/models";

type Params = { params: Promise<{ groupId: string }> };

/** Leave the group (self). */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const ctx = await requireSplitSession();
    const { groupId } = await params;
    await assertObjectId(groupId, "groupId");

    await withDb(async () => {
      const { group } = await requireGroupMembership(groupId, ctx.userId);
      const count = await GroupMember.countDocuments({
        groupId: new Types.ObjectId(groupId),
      });
      if (group.createdBy.toString() === ctx.userId && count > 1) {
        throw new ApiError(
          400,
          "invalid_request",
          "Creator must archive or delete before leaving while others remain",
        );
      }
      await GroupMember.deleteOne({
        groupId: new Types.ObjectId(groupId),
        userId: new Types.ObjectId(ctx.userId),
      });
    });

    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
