import { db } from "./src/db/client";

async function check() {
  try {
    const rows = await db.query.trainings.findMany({
      with: { creator: true, modules: true },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
    console.log("Found", rows.length, "trainings");
  } catch(e: any) {
    console.error("DB Error:", e.message);
  }
  process.exit();
}
check();
