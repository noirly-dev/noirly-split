import { Types } from "mongoose";
import {
  ApiError,
  jsonError,
  jsonOk,
  requireSplitSession,
} from "@/src/server/api/http";
import { withDb } from "@/src/server/db/mongodb";
import { Notification } from "@/src/server/models";

export async function GET() {
  try {
    const ctx = await requireSplitSession();
    const items = await withDb(async () => {
      const docs = await Notification.find({
        userId: new Types.ObjectId(ctx.userId),
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      return docs.map((d) => ({
        id: d._id.toString(),
        userId: d.userId.toString(),
        groupId: d.groupId ? d.groupId.toString() : null,
        type: d.type,
        title: d.title,
        body: d.body,
        href: d.href,
        readAt: d.readAt ? d.readAt.toISOString() : null,
        createdAt: d.createdAt.toISOString(),
      }));
    });
    return jsonOk({
      items,
      unreadCount: items.filter((i) => !i.readAt).length,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireSplitSession();
    const body = (await request.json().catch(() => ({}))) as {
      ids?: string[];
      all?: boolean;
    };

    await withDb(async () => {
      if (body.all) {
        await Notification.updateMany(
          {
            userId: new Types.ObjectId(ctx.userId),
            readAt: null,
          },
          { $set: { readAt: new Date() } },
        );
        return;
      }
      const ids = (body.ids ?? []).filter((id) => Types.ObjectId.isValid(id));
      if (ids.length === 0) {
        throw new ApiError(400, "invalid_request", "ids or all required");
      }
      await Notification.updateMany(
        {
          userId: new Types.ObjectId(ctx.userId),
          _id: { $in: ids.map((id) => new Types.ObjectId(id)) },
        },
        { $set: { readAt: new Date() } },
      );
    });

    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
