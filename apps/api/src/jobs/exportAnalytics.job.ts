import { Worker, Queue } from "bullmq";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getTrainingAnalytics, generateCSV, saveAnalyticsSnapshot } from "../services/analytics.service";

const connection = { host: process.env.REDIS_HOST ?? "127.0.0.1", port: 6379 };

export const exportQueue = new Queue("analytics-export", { connection });

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export function startExportWorker() {
  const worker = new Worker(
    "analytics-export",
    async (job) => {
      const { trainingId, workspaceId } = job.data as { trainingId: string; workspaceId: string };

      const analytics = await getTrainingAnalytics(trainingId);
      const csv = generateCSV(analytics);

      const key = `exports/${workspaceId}/${trainingId}/${Date.now()}.csv`;
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: key,
          Body: csv,
          ContentType: "text/csv",
        })
      );

      const csvUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
      await saveAnalyticsSnapshot(trainingId, workspaceId, analytics, csvUrl);

      return { csvUrl };
    },
    { connection }
  );

  worker.on("failed", (job, err) => {
    console.error(`Export job ${job?.id} failed:`, err.message);
  });

  return worker;
}
