"use client";

import { useMemo } from "react";
import { useModuleResponses } from "@/hooks/useModuleResponses";
import type { TrainingModule } from "@oruclass/types";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

const DEFAULT_EMOJIS = ["😊", "🙂", "😐", "😕", "😟"];

export function TrainerPulse({ module, trainingId }: Props) {
  const { data: responses, isLoading } = useModuleResponses(trainingId, module.id);
  const emojis = module.config.pulseEmojis?.length ? module.config.pulseEmojis : DEFAULT_EMOJIS;
  const totalResponses = responses?.length ?? 0;

  const tally = useMemo(() => {
    const counts: Record<string, number> = {};
    emojis.forEach((e) => (counts[e] = 0));
    responses?.forEach((r) => {
      const emoji = r.responseData.emoji;
      if (emoji && emoji in counts) counts[emoji]++;
    });
    return counts;
  }, [responses, emojis]);

  const maxCount = Math.max(1, ...Object.values(tally));

  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{module.title} (Trainer View)</h2>
        <div className="text-sm text-gray-500 font-medium">{totalResponses} Responses</div>
      </div>

      {module.config.pulsePrompt && (
        <p className="text-gray-600 mb-4">{module.config.pulsePrompt}</p>
      )}

      <div className="flex-1 flex items-center justify-center">
        {isLoading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : (
          <div className="flex gap-6 items-end">
            {emojis.map((emoji) => {
              const count = tally[emoji] ?? 0;
              const heightPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
              const pct = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
              return (
                <div key={emoji} className="flex flex-col items-center gap-2" style={{ minWidth: 64 }}>
                  <span className="text-sm font-bold text-gray-600">{pct}%</span>
                  <div className="w-16 bg-gray-100 rounded-xl relative" style={{ height: 160 }}>
                    <div
                      className="absolute bottom-0 w-full bg-brand-400 rounded-xl transition-all duration-500"
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                    />
                  </div>
                  <span className="text-3xl">{emoji}</span>
                  <span className="text-xs text-gray-500 font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
