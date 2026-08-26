import { Types } from "mongoose";
import { splitChannel } from "@/src/core/realtime/channels";
import {
  ApiError,
  jsonError,
  jsonOk,
  requireSplitSession,
} from "@/src/server/api/http";
import { withDb } from "@/src/server/db/mongodb";
import { GroupMember } from "@/src/server/models";
import { signRealtimeJwt } from "@/src/server/realtime/jwt";

export async function GET() {
  try {
    const ctx = await requireSplitSession();
    if (!process.env.REALTIME_JWT_SECRET) {
      throw new ApiError(
        503,
        "realtime_unavailable",
        "Realtime is not configured",
      );
    }

    const caps = await withDb(async () => {
      const next: Record<string, Array<"subscribe" | "publish" | "presence">> =
        {
          [splitChannel.user(ctx.userId)]: ["subscribe"],
        };
      const memberships = await GroupMember.find({
        userId: new Types.ObjectId(ctx.userId),
      }).lean();
      for (const membership of memberships) {
        next[splitChannel.group(membership.groupId.toString())] = [
          "subscribe",
          "presence",
        ];
      }
      return next;
    });

    const { token, expiresIn } = await signRealtimeJwt({
      userId: ctx.userId,
      name: ctx.displayName,
      caps,
    });

    return jsonOk({
      token,
      expiresIn,
      url: process.env.NEXT_PUBLIC_REALTIME_WS_URL ?? null,
    });
  } catch (error) {
    return jsonError(error);
  }
}
