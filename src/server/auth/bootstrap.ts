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

function toBootstrapped(user: SplitUserDocument): BootstrappedUser {
  return {
    id: user._id.toString(),
    identitySub: user.identitySub,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl ?? null,
    preferredCurrency: user.preferredCurrency,
  };
}

/**
 * Resolve the Split user for an Identity session.
 *
 * Hot path is read-only. Writes only when the account is missing or profile
 * fields changed.
 */
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
    const avatarUrl = sessionUser.image ?? null;
    const emailVerified = Boolean(sessionUser.email);

    const existing = (await SplitUser.findOne({
      identitySub: sessionUser.id,
    })) as SplitUserDocument | null;

    if (!existing) {
      const created = (await SplitUser.create({
        identitySub: sessionUser.id,
        email,
        displayName,
        avatarUrl,
        emailVerified,
        preferredCurrency: "USD",
      })) as SplitUserDocument;
      return toBootstrapped(created);
    }

    const needsUpdate =
      existing.email !== email ||
      existing.displayName !== displayName ||
      (existing.avatarUrl ?? null) !== avatarUrl ||
      existing.emailVerified !== emailVerified;

    if (!needsUpdate) {
      return toBootstrapped(existing);
    }

    const updated = (await SplitUser.findOneAndUpdate(
      { identitySub: sessionUser.id },
      {
        $set: {
          email,
          displayName,
          avatarUrl,
          emailVerified,
        },
      },
      { returnDocument: "after" },
    )) as SplitUserDocument | null;

    if (!updated) {
      throw new Error("Failed to update Split user");
    }

    return toBootstrapped(updated);
  });
}
