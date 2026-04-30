import "dotenv/config";
import { requireDb, orders, certificates } from "./src/lib/db";

async function main() {
  try {
    const db = requireDb();
    const allOrders = await db.select().from(orders);
    const allCerts = await db.select().from(certificates);
    
    console.log("=== ORDERS ===");
    console.table(allOrders.map((o: any) => ({ id: o.id, name: o.name, email: o.email, status: o.status })));
    
    console.log("=== CERTIFICATES ===");
    console.table(allCerts.map((c: any) => ({ id: c.id, orderId: c.orderId, certNumber: c.certNumber, clerkUserId: c.clerkUserId })));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
