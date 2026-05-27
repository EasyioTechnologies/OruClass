import type { Metadata } from "next";
import { LiveRoom } from "@/components/live/LiveRoom";

export const metadata: Metadata = { title: "Live Session" };

export default async function LivePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ role?: string }>;
}) {
  const { id } = await params;
  const { role } = await searchParams;
  return <LiveRoom trainingId={id} forceParticipant={role === "participant"} />;
}
