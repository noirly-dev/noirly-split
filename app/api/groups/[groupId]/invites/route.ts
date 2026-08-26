import { randomBytes } from "node:crypto";
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
import { mapInvite } from "@/src/server/mappers";
import { GroupInvite } from "@/src/server/models";

const createInviteSchema = z.object({
  email: z.string().email().nullable().optional(),
  expiresInDays: z.number().int().min(1).max(30).optional(),
});

type Params = { params: Promise<{ groupId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireSplitSession();
    const { groupId } = await params;
    await assertObjectId(groupId, "groupId");
    const body = createInviteSchema.parse(await request.json().catch(() => ({})));

    const invite = await withDb(async () => {
      await requireGroupMembership(groupId, ctx.userId);
      const days = body.expiresInDays ?? 14;
      const token = randomBytes(24).toString("hex");
      const created = await GroupInvite.create({
        groupId: new Types.ObjectId(groupId),
        token,
        email: body.email ?? null,
        createdBy: new Types.ObjectId(ctx.userId),
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      });
      return mapInvite(created);
    });

    const origin = new URL(request.url).origin;
    const url = `${origin}/invites/${invite.token}`;
    const mailto =
      invite.email != null
        ? `mailto:${invite.email}?subject=${encodeURIComponent("Join my Noirly Split group")}&body=${encodeURIComponent(`You're invited to split expenses on Noirly Split.\n\n${url}`)}`
        : null;
    return jsonOk(
      {
        invite: {
          ...invite,
          url,
          mailto,
        },
      },
      201,
    );
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
