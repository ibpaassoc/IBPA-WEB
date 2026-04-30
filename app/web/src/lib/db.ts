export type CardRequestStatus = 'pending' | 'accepted' | 'rejected';

export type CardRequest = {
  id: string;
  cardName: string;
  userName: string;
  status: CardRequestStatus;
  createdAt: string;
};

// Use global object to prevent DB reset on hot reload in dev
const globalForDb = global as unknown as { requestsDB: CardRequest[] };

export const db = {
  requests: globalForDb.requestsDB || [],
};

if (process.env.NODE_ENV !== 'production') {
  globalForDb.requestsDB = db.requests;
}
