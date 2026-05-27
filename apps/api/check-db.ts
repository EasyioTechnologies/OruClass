import { db } from "./src/db/client";
import { eq } from "drizzle-orm";
import { trainings } from "./src/db/schema";

async function check() {
  try {
    const rows = await db.query.trainings.findMany({
      where: eq(trainings.workspaceId, "260ae2c9-f1cc-4e08-b38b-011a475bf669"),
    });
    console.log("Workspace 260ae2c9... has", rows.length, "trainings");
  } catch(e: any) {
    console.error("DB Error:", e.message);
  }
  process.exit();
}
check();
