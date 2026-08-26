import {
  ApiError,
  assertObjectId,
  jsonError,
  jsonOk,
  requireSplitSession,
} from "@/src/server/api/http";
import { withDb } from "@/src/server/db/mongodb";
import { requireGroupMembership } from "@/src/server/groups/access";
import { mapGroup } from "@/src/server/mappers";
import { Group } from "@/src/server/models";

type Params = { params: Promise<{ groupId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const ctx = await requireSplitSession();
    const { groupId } = await params;
    await assertObjectId(groupId, "groupId");

    const group = await withDb(async () => {
      const { group: doc } = await requireGroupMembership(groupId, ctx.userId);
      if (doc.createdBy.toString() !== ctx.userId) {
        throw new ApiError(403, "forbidden", "Only the creator can archive");
      }
      const updated = await Group.findByIdAndUpdate(
        groupId,
        { $set: { archivedAt: new Date() } },
        { returnDocument: "after" },
      );
      if (!updated) throw new ApiError(404, "not_found", "Group not found");
      return mapGroup(updated);
    });

    return jsonOk({ group });
  } catch (error) {
    return jsonError(error);
  }
}
