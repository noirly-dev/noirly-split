import { Types } from "mongoose";
import {
  assertObjectId,
  jsonError,
  jsonOk,
  requireSplitSession,
} from "@/src/server/api/http";
import { withDb } from "@/src/server/db/mongodb";
import { requireGroupMembership } from "@/src/server/groups/access";
import { mapActivity } from "@/src/server/mappers";
import { ActivityEvent, SplitUser } from "@/src/server/models";

type Params = { params: Promise<{ groupId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const ctx = await requireSplitSession();
    const { groupId } = await params;
    await assertObjectId(groupId, "groupId");
    const url = new URL(request.url);
    const limit = Math.min(
      Number(url.searchParams.get("limit") ?? 50) || 50,
      100,
    );

    const result = await withDb(async () => {
      await requireGroupMembership(groupId, ctx.userId);
      const docs = await ActivityEvent.find({
        groupId: new Types.ObjectId(groupId),
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      const actorIds = [...new Set(docs.map((d) => d.actorId.toString()))];
      const users = await SplitUser.find({
        _id: { $in: actorIds.map((id) => new Types.ObjectId(id)) },
      }).lean();
      const names = Object.fromEntries(
        users.map((u) => [u._id.toString(), u.displayName]),
      );

      return {
        items: docs.map((doc) => ({
          ...mapActivity(
            doc as typeof doc & { createdAt: Date },
          ),
          actorDisplayName: names[doc.actorId.toString()] ?? "Someone",
        })),
      };
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
