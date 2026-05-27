"use client";

import { useState } from "react";
import { useResponseSubmit } from "@/hooks/useResponseSubmit";
import type { TrainingModule } from "@oruclass/types";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function ParticipantReflectionJournal({ module, trainingId }: Props) {
  const { submit: submitResponse } = useResponseSubmit(trainingId);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const submit = async () => {
    setIsPending(true);
    await submitResponse(module.id, { text });
    setSubmitted(true);
    setIsPending(false);
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <div className="text-4xl">✓</div>
          <p className="font-medium text-gray-700">Reflection saved!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{module.title}</h2>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
        Your reflection is private and visible only to the trainer.
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        placeholder="Write your reflection here…"
      />

      <button
        onClick={submit}
        disabled={!text.trim() || isPending}
        className="w-full py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors"
      >
        {isPending ? "Saving…" : "Save Reflection"}
      </button>
    </div>
  );
}
