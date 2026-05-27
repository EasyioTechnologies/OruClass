"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import type { TrainingModule, StrokeData } from "@oruclass/types";
import { Trash2 } from "lucide-react";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function TrainerWhiteboard({ module, trainingId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const socket = useSocket();
  const [color, setColor] = useState("#1e40af");
  const [size, setSize] = useState(3);

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

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const rect = canvasRef.current!.getBoundingClientRect();
    lastPoint.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !lastPoint.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    const x1 = e.clientX - rect.left;
    const y1 = e.clientY - rect.top;
    const stroke: StrokeData = { 
      points: [lastPoint.current, { x: x1, y: y1 }],
      color,
      width: size
    };
    drawStroke(ctx, stroke);
    socket.emit("draw:update", { moduleId: module.id, stroke });
    lastPoint.current = { x: x1, y: y1 };
  };

  const handlePointerUp = () => {
    drawing.current = false;
    lastPoint.current = null;
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      // In a real app, emit a clear event to socket as well.
      // socket.emit("draw:clear", { moduleId: module.id });
    }
  };

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-900 flex-1">{module.title} (Trainer View)</h2>
        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" title="Brush Color" />
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <input type="range" min={1} max={20} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-24 accent-brand-500" title="Brush Size" />
        </div>
        <button onClick={handleClear} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Clear Canvas">
          <Trash2 size={18} />
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="flex-1 w-full border border-gray-200 rounded-lg bg-white cursor-crosshair touch-none shadow-sm"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
}
