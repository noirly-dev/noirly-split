import { withDb } from "@/src/server/db/mongodb";
import { SplitUser, type SplitUserDocument } from "@/src/server/models";

export type BootstrapSessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

export type BootstrappedUser = {
  id: string;
  identitySub: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  preferredCurrency: string;
};

/** Upsert Split user from Identity session. */
export async function ensureSplitAccount(
  sessionUser: BootstrapSessionUser,
): Promise<BootstrappedUser> {
  if (!sessionUser.id) {
    throw new Error("Session is missing Identity subject (sub)");
  }

  return withDb(async () => {
    const email =
      sessionUser.email?.trim().toLowerCase() ||
      `${sessionUser.id}@users.local`;
    const displayName =
      sessionUser.name?.trim() || email.split("@")[0] || "Noirly user";

    const user = (await SplitUser.findOneAndUpdate(
      { identitySub: sessionUser.id },
      {
        $set: {
          email,
          displayName,
          avatarUrl: sessionUser.image ?? null,
          emailVerified: Boolean(sessionUser.email),
        },
        $setOnInsert: {
          identitySub: sessionUser.id,
          preferredCurrency: "USD",
        },
      },
      { upsert: true, returnDocument: "after" },
    )) as SplitUserDocument | null;

    if (!user) {
      throw new Error("Failed to upsert Split user");
    }

    return {
      id: user._id.toString(),
      identitySub: user.identitySub,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl ?? null,
      preferredCurrency: user.preferredCurrency,
    };
  });
}
