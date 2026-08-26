import { Types } from "mongoose";
import { z } from "zod";
import {
  ApiError,
  jsonError,
  jsonOk,
  requireSplitSession,
} from "@/src/server/api/http";
import { withDb } from "@/src/server/db/mongodb";
import { mapGroup } from "@/src/server/mappers";
import {
  ActivityEvent,
  Group,
  GroupMember,
} from "@/src/server/models";

const createGroupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  icon: z.string().trim().max(32).nullable().optional(),
  color: z.string().trim().max(32).nullable().optional(),
  baseCurrency: z
    .string()
    .trim()
    .length(3)
    .transform((v) => v.toUpperCase())
    .optional(),
});

export async function GET() {
  try {
    const ctx = await requireSplitSession();
    const groups = await withDb(async () => {
      const memberships = await GroupMember.find({
        userId: new Types.ObjectId(ctx.userId),
      }).lean();
      const ids = memberships.map((m) => m.groupId);
      if (ids.length === 0) return [];
      const docs = await Group.find({
        _id: { $in: ids },
        archivedAt: null,
      })
        .sort({ updatedAt: -1 })
        .lean();
      return docs.map((doc) =>
        mapGroup(doc as typeof doc & { createdAt: Date; updatedAt: Date }),
      );
    });
    return jsonOk({ groups });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireSplitSession();
    const body = createGroupSchema.parse(await request.json());
    const group = await withDb(async () => {
      const created = await Group.create({
        name: body.name,
        icon: body.icon ?? null,
        color: body.color ?? null,
        baseCurrency: body.baseCurrency ?? "USD",
        createdBy: new Types.ObjectId(ctx.userId),
      });
      await GroupMember.create({
        groupId: created._id,
        userId: new Types.ObjectId(ctx.userId),
        joinedAt: new Date(),
      });
      await ActivityEvent.create({
        groupId: created._id,
        type: "member.joined",
        actorId: new Types.ObjectId(ctx.userId),
        payload: { userId: ctx.userId },
      });
      return mapGroup(created);
    });
    return jsonOk({ group }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(
        new ApiError(
          400,
          "invalid_request",
          error.issues[0]?.message ?? "Invalid body",
        ),
      );
    }
    return jsonError(error);
  }
}
