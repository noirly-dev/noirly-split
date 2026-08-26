export const qk = {
  me: ["me"] as const,
  groups: ["groups"] as const,
  group: (id: string) => ["groups", id] as const,
  members: (groupId: string) => ["members", groupId] as const,
  expenses: (groupId: string) => ["expenses", groupId] as const,
  expense: (id: string) => ["expense", id] as const,
  balances: (groupId: string) => ["balances", groupId] as const,
  activity: (groupId: string) => ["activity", groupId] as const,
  settlements: (groupId: string) => ["settlements", groupId] as const,
  dashboardBalances: () => ["dashboard", "balances"] as const,
  notifications: ["notifications"] as const,
  invite: (token: string) => ["invite", token] as const,
};
