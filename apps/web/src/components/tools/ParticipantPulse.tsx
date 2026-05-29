"use client";

import { useState } from "react";
import { useResponseSubmit } from "@/hooks/useResponseSubmit";
import type { TrainingModule } from "@oruclass/types";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

const DEFAULT_EMOJIS = ["😊", "🙂", "😐", "😕", "😟"];

export function ParticipantPulse({ module, trainingId }: Props) {
  const { submit: submitResponse } = useResponseSubmit(trainingId);
  const emojis = module.config.pulseEmojis?.length ? module.config.pulseEmojis : DEFAULT_EMOJIS;
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const submit = async (emoji: string) => {
    setSelected(emoji);
    setIsPending(true);
    await submitResponse(module.id, { type: "pulse", emoji });
    setSubmitted(true);
    setIsPending(false);
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <div className="text-6xl">{selected}</div>
          <p className="font-medium text-gray-700">Thanks for your feedback!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-900">{module.title}</h2>
      {module.config.pulsePrompt && (
        <p className="text-gray-600 text-center">{module.config.pulsePrompt}</p>
      )}
      <p className="text-sm text-gray-400">How are you feeling right now?</p>

      <div className="flex gap-4">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => submit(emoji)}
            disabled={isPending}
            className={`text-5xl p-3 rounded-2xl transition-all hover:scale-125 hover:bg-gray-100 active:scale-95 disabled:opacity-60 ${
              selected === emoji ? "bg-brand-50 scale-110" : ""
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
