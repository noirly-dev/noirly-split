import type { ChannelName } from "@noirly-dev/realtime-shared";
import { assertChannelName } from "@noirly-dev/realtime-shared";

export const splitChannel = {
  group: (groupId: string) => assertChannelName(`group:${groupId}`),
  user: (userId: string) => assertChannelName(`user:${userId}`),
} as const;

export type SplitChannelName = ChannelName;
