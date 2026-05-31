"use client";

import { useState } from "react";
import { useResponseSubmit } from "@/hooks/useResponseSubmit";
import type { TrainingModule } from "@oruclass/types";
import { CheckCircle } from "lucide-react";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function ParticipantEmbed({ module, trainingId }: Props) {
  const { submit: submitResponse } = useResponseSubmit(trainingId);
  const url = module.config.embedUrl;
  const title = module.config.embedTitle ?? module.title;
  const description = module.config.embedDescription;

  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const markAsViewed = async () => {
    setIsPending(true);
    await submitResponse(module.id, { type: "embed", viewed: true });
    setSubmitted(true);
    setIsPending(false);
  };

  if (!url) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          No embed URL has been configured for this module.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-4 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {description && <p className="text-sm text-gray-600 line-clamp-1">{description}</p>}
        </div>
        <div>
          {submitted ? (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg font-medium text-sm">
              <CheckCircle className="w-5 h-5" />
              <span>Viewed</span>
            </div>
          ) : (
            <button
              onClick={markAsViewed}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors text-sm shadow-sm"
            >
              {isPending ? "Updating..." : "Mark as Viewed"}
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 w-full h-full bg-gray-100 overflow-hidden relative">
        <iframe
          src={url}
          className="absolute inset-0 w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title}
        />
      </div>
    </div>
  );
}
