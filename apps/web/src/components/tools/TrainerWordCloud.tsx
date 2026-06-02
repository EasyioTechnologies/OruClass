"use client";

import { useMemo } from "react";
import { useModuleResponses } from "@/hooks/useModuleResponses";
import type { TrainingModule } from "@oruclass/types";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function TrainerWordCloud({ module, trainingId }: Props) {
  const { data: responses, isLoading } = useModuleResponses(trainingId, module.id);

  const wordFreq = useMemo(() => {
    const freq: Record<string, number> = {};
    responses?.forEach((r) => {
      const words: string[] = (r.responseData as any).words ?? [];
      words.forEach((w) => {
        const key = w.toLowerCase().trim();
        if (key) freq[key] = (freq[key] ?? 0) + 1;
      });
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 60);
  }, [responses]);

  const maxFreq = Math.max(1, wordFreq[0]?.[1] ?? 1);

  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{module.title} (Trainer View)</h2>
        <div className="text-sm text-gray-500 font-medium">{responses?.length ?? 0} Responses</div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50 rounded-xl border border-gray-200 p-8">
        {isLoading ? (
          <div className="text-center text-gray-400">Loading words...</div>
        ) : wordFreq.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No words submitted yet.</p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {wordFreq.map(([word, count]) => {
              const scale = 0.75 + (count / maxFreq) * 1.5;
              const opacity = 0.4 + (count / maxFreq) * 0.6;
              return (
                <span
                  key={word}
                  className="text-brand-700 font-bold transition-all cursor-default hover:text-brand-500"
                  style={{ fontSize: `${scale}rem`, opacity }}
                  title={`${word}: ${count}`}
                >
                  {word}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
