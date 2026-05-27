import type { Metadata } from "next";
import { StudioPage } from "@/components/studio/StudioPage";

export const metadata: Metadata = { title: "Training Studio" };

export default async function TrainingStudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudioPage trainingId={id} />;
}
