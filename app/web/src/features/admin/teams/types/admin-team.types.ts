export type AdminTeamOwnerType = "business" | "partner";

export type AdminTeamMember = {
  id: string;
  credentials: string | null;
  avatarUrl: string | null;
  fullName: string;
  email: string;
  role: string;
  accessStatus: string;
  joinedAt: string | null;
};

export type AdminTeamMembersResponse = {
  ownerOrderId: string;
  ownerType: AdminTeamOwnerType;
  ownerName: string;
  seatCount: number;
  count: number;
  activeCount: number;
  items: AdminTeamMember[];
};
