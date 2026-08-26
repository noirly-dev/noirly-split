import { cache } from "react";
import { headers } from "next/headers";
import { Types } from "mongoose";
import { auth } from "@/auth";
import { ensureSplitAccount } from "@/src/server/auth/bootstrap";
import {
  extractBearerToken,
  fetchIdentityUserInfo,
} from "@/src/server/auth/identity-userinfo";
import { withDb } from "@/src/server/db/mongodb";
import { SplitUser } from "@/src/server/models";

export type SplitSessionContext = {
  identitySub: string;
  userId: string;
  email: string;
  displayName: string;
};

async function resolveFromBearer(
  accessToken: string,
): Promise<SplitSessionContext> {
  let userInfo;
  try {
    userInfo = await fetchIdentityUserInfo(accessToken);
  } catch {
    throw new ApiError(401, "unauthorized", "Invalid or expired access token");
  }

  const identitySub = userInfo.sub;
  const existing = await withDb(async () =>
    SplitUser.findOne({ identitySub }).lean(),
  );

  if (existing) {
    return {
      identitySub: existing.identitySub,
      userId: existing._id.toString(),
      email: existing.email,
      displayName: existing.displayName,
    };
  }

  const account = await ensureSplitAccount({
    id: identitySub,
    email: userInfo.email ?? null,
    name: userInfo.name ?? null,
    image: userInfo.picture ?? null,
  });

  return {
    identitySub: account.identitySub,
    userId: account.id,
    email: account.email,
    displayName: account.displayName,
  };
}

async function resolveFromCookieSession(): Promise<SplitSessionContext | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const identitySub = session.user.id;
  const existing = await withDb(async () =>
    SplitUser.findOne({ identitySub }).lean(),
  );

  if (existing) {
    return {
      identitySub: existing.identitySub,
      userId: existing._id.toString(),
      email: existing.email,
      displayName: existing.displayName,
    };
  }

  const account = await ensureSplitAccount({
    id: identitySub,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  return {
    identitySub: account.identitySub,
    userId: account.id,
    email: account.email,
    displayName: account.displayName,
  };
}

export const requireSplitSession = cache(
  async (): Promise<SplitSessionContext> => {
    const headerStore = await headers();
    const bearer = extractBearerToken(headerStore.get("authorization"));
    if (bearer) {
      return resolveFromBearer(bearer);
    }

    const fromCookie = await resolveFromCookieSession();
    if (fromCookie) {
      return fromCookie;
    }

    throw new ApiError(401, "unauthorized", "Sign in required");
  },
);

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function jsonOk<T>(data: T, status = 200) {
  return Response.json(data, { status });
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json(
      { error: error.code, message: error.message },
      { status: error.status },
    );
  }
  console.error(error);
  return Response.json(
    { error: "internal_error", message: "Something went wrong" },
    { status: 500 },
  );
}

export async function assertObjectId(id: string, label = "id") {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "invalid_request", `Invalid ${label}`);
  }
}
