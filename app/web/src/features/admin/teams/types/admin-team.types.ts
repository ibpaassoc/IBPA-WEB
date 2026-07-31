export type AdminTeamOwnerType = "business" | "partner";

export type AdminTeamMember = {
  id: string;
  teamMemberId: string;
  avatarUrl: string | null;
  fullName: string;
  email: string;
  role: string;
  status: string;
  seatNumber: number;
  seatType: "included" | "additional";
  accessStatus: string;
  registrationStatus: string;
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
