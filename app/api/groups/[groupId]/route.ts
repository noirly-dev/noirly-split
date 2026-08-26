import { Types } from "mongoose";
import { z } from "zod";
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
import { ActivityEvent, Group } from "@/src/server/models";

const patchGroupSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  icon: z.string().trim().max(32).nullable().optional(),
  color: z.string().trim().max(32).nullable().optional(),
  baseCurrency: z
    .string()
    .trim()
    .length(3)
    .transform((v) => v.toUpperCase())
    .optional(),
});

type Params = { params: Promise<{ groupId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireSplitSession();
    const { groupId } = await params;
    await assertObjectId(groupId, "groupId");
    const group = await withDb(async () => {
      const { group: doc } = await requireGroupMembership(groupId, ctx.userId);
      return mapGroup(doc as typeof doc & { createdAt: Date; updatedAt: Date });
    });
    return jsonOk({ group });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const ctx = await requireSplitSession();
    const { groupId } = await params;
    await assertObjectId(groupId, "groupId");
    const body = patchGroupSchema.parse(await request.json());
    const group = await withDb(async () => {
      await requireGroupMembership(groupId, ctx.userId);
      const updated = await Group.findByIdAndUpdate(
        groupId,
        { $set: body },
        { returnDocument: "after" },
      );
      if (!updated) {
        throw new ApiError(404, "not_found", "Group not found");
      }
      await ActivityEvent.create({
        groupId: updated._id,
        type: "group.updated",
        actorId: new Types.ObjectId(ctx.userId),
        payload: body,
      });
      return mapGroup(updated);
    });
    return jsonOk({ group });
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

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const ctx = await requireSplitSession();
    const { groupId } = await params;
    await assertObjectId(groupId, "groupId");
    await withDb(async () => {
      const { group } = await requireGroupMembership(groupId, ctx.userId);
      if (group.createdBy.toString() !== ctx.userId) {
        throw new ApiError(
          403,
          "forbidden",
          "Only the creator can delete this group",
        );
      }
      await Group.findByIdAndDelete(groupId);
    });
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
