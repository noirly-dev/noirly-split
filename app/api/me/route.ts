import {
  ApiError,
  jsonError,
  jsonOk,
  requireSplitSession,
} from "@/src/server/api/http";
import { withDb } from "@/src/server/db/mongodb";
import { SplitUser } from "@/src/server/models";

export async function GET() {
  try {
    const ctx = await requireSplitSession();
    const user = await withDb(async () =>
      SplitUser.findById(ctx.userId).lean(),
    );
    if (!user) {
      throw new ApiError(404, "not_found", "User not found");
    }
    return jsonOk({
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? null,
        preferredCurrency: user.preferredCurrency,
        identitySub: user.identitySub,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
