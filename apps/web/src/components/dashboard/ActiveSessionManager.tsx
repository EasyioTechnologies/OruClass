"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTrainings, useUpdateTrainingStatus } from "@/hooks/useTrainings";
import { Play, StopCircle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Training } from "@oruclass/types";


function ActiveSessionWidget({ workspaceId, training }: { workspaceId: string; training: Training }) {
  const router = useRouter();
  const updateStatus = useUpdateTrainingStatus(workspaceId, training.id);

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateStatus.mutate("completed");
  };

  const handleClick = () => {
    router.push(`/workspaces/${workspaceId}/trainings/${training.id}/live`);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white border-2 border-brand-200 shadow-xl rounded-2xl p-3 pr-4 cursor-pointer hover:border-brand-300 hover:shadow-2xl transition-all group"
        onClick={handleClick}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 relative">
          <span className="absolute inset-0 rounded-xl bg-brand-400 opacity-20 animate-ping" />
          <Play size={18} className="text-brand-600 ml-1" />
        </div>
        <div className="flex flex-col flex-1 mr-4">
          <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            Active Session
          </span>
          <span className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
            {training.title}
          </span>
        </div>
        <button
          onClick={handleStop}
          disabled={updateStatus.isPending}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
          title="Stop Session"
        >
          <StopCircle size={20} />
        </button>
        <div className="flex items-center justify-center w-8 h-10 text-gray-300 group-hover:text-brand-500 transition-colors">
          <ArrowRight size={20} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function ActiveSessionManager() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const { data: trainings } = useTrainings(workspaceId);

  const activeTraining = useMemo(() => {
    if (!trainings) return null;
    return trainings.find(t => ["connecting", "live", "paused"].includes(t.sessionStatus));
  }, [trainings]);

  if (!activeTraining) return null;

  return <ActiveSessionWidget workspaceId={workspaceId} training={activeTraining} />;
}
