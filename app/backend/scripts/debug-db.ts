import "dotenv/config";
import { requireDb, orders, certificates } from "../src/lib/db";

async function check() {
  const db = requireDb();
  console.log("--- Orders ---");
  const allOrders = await db.select().from(orders);
  console.table(allOrders);

  console.log("\n--- Certificates ---");
  const allCerts = await db.select().from(certificates);
  console.table(allCerts);
  
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
