"use client";

import { useEffect, useRef } from "react";
import { useSocket } from "@/hooks/useSocket";
import type { TrainingModule, StrokeData } from "@oruclass/types";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function ParticipantWhiteboard({ module, trainingId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socket = useSocket();

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: StrokeData) => {
    if (stroke.points.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = "round";
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    ctx.lineTo(stroke.points[1].x, stroke.points[1].y);
    ctx.stroke();
  };

  useEffect(() => {
    const handler = ({ stroke }: { stroke: StrokeData }) => {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) drawStroke(ctx, stroke);
    };
    socket.on("draw:update", handler);
    return () => { socket.off("draw:update", handler); };
  }, [socket]);

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <div className="flex items-center gap-3">
        <h2 className="font-bold text-gray-900 flex-1">{module.title}</h2>
        <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-medium">
          View Only
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="flex-1 w-full border border-gray-200 rounded-lg bg-white"
      />
    </div>
  );
}
