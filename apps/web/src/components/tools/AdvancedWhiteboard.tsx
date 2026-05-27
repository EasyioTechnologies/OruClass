"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Pen, Highlighter, Eraser, Trash2, Palette, Download } from "lucide-react";
import type { StrokeData } from "@oruclass/types";
import { cn } from "@oruclass/utils";

interface AdvancedWhiteboardProps {
  strokes: StrokeData[];
  onStrokeEnd: (stroke: StrokeData) => void;
  onClear: () => void;
  readonly?: boolean;
  className?: string;
}

type ToolType = "pen" | "highlighter" | "eraser";

const PEN_COLORS = ["#1e293b", "#ef4444", "#3b82f6", "#10b981", "#f59e0b"];
const HIGHLIGHTER_COLORS = ["rgba(253, 224, 71, 0.4)", "rgba(134, 239, 172, 0.4)", "rgba(249, 168, 212, 0.4)"];
const SIZES = { thin: 2, medium: 5, thick: 10 };
const HIGHLIGHTER_SIZE = 24;
const ERASER_SIZE = 30;

export function AdvancedWhiteboard({ strokes, onStrokeEnd, onClear, readonly, className }: AdvancedWhiteboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [activeTool, setActiveTool] = useState<ToolType>("pen");
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const [highlighterColor, setHighlighterColor] = useState(HIGHLIGHTER_COLORS[0]);
  const [penSize, setPenSize] = useState<number>(SIZES.medium);
  
  const [currentStroke, setCurrentStroke] = useState<StrokeData | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });
  const [showPalette, setShowPalette] = useState(false);

  // Responsive canvas sizing
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Optional: multiply by devicePixelRatio for sharper rendering
        const dpr = window.devicePixelRatio || 1;
        setCanvasDimensions({ width: width * dpr, height: height * dpr });
        
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
        }
      }
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Drawing Engine
  const renderStrokes = useCallback((ctx: CanvasRenderingContext2D, strokesToRender: StrokeData[], dpr: number) => {
    strokesToRender.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      ctx.beginPath();
      
      if (stroke.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = stroke.color;
      }
      
      ctx.lineWidth = stroke.width * dpr;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      ctx.moveTo(stroke.points[0].x * dpr, stroke.points[0].y * dpr);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * dpr, stroke.points[i].y * dpr);
      }
      ctx.stroke();
    });
    ctx.globalCompositeOperation = "source-over"; // reset
  }, []);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all completed strokes
    renderStrokes(ctx, strokes, dpr);
    
    // Draw current active stroke
    if (currentStroke) {
      renderStrokes(ctx, [currentStroke], dpr);
    }
  }, [strokes, currentStroke, canvasDimensions, renderStrokes]);

  // Pointer Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readonly) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    let color = penColor;
    let width = penSize;
    
    if (activeTool === "highlighter") {
      color = highlighterColor;
      width = HIGHLIGHTER_SIZE;
    } else if (activeTool === "eraser") {
      color = "rgba(0,0,0,1)";
      width = ERASER_SIZE;
    }
    
    setCurrentStroke({
      points: [{ x, y }],
      color,
      width,
      tool: activeTool
    });
    setShowPalette(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!currentStroke || readonly) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentStroke(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        points: [...prev.points, { x, y }]
      };
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (currentStroke) {
      onStrokeEnd(currentStroke);
      setCurrentStroke(null);
    }
  };

  const getCursor = () => {
    if (readonly) return "default";
    if (activeTool === "eraser") return "cell";
    return "crosshair";
  };

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "relative w-full h-full bg-white overflow-hidden flex flex-col",
        "bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]", // Dot grid
        className
      )}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        style={{ cursor: getCursor() }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      
      {/* Floating Toolbar */}
      {!readonly && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-end gap-2">
          {showPalette && activeTool !== "eraser" && (
            <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md shadow-xl border border-gray-200/50 rounded-2xl p-3 flex gap-2 animate-in slide-in-from-bottom-2">
              {(activeTool === "pen" ? PEN_COLORS : HIGHLIGHTER_COLORS).map(c => (
                <button
                  key={c}
                  onClick={() => activeTool === "pen" ? setPenColor(c) : setHighlighterColor(c)}
                  className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ 
                    backgroundColor: c.replace(/[\d.]+\)$/g, '1)'), 
                    borderColor: (activeTool === "pen" ? penColor : highlighterColor) === c ? '#000' : 'transparent' 
                  }}
                />
              ))}
              {activeTool === "pen" && (
                <div className="w-[1px] h-8 bg-gray-200 mx-2" />
              )}
              {activeTool === "pen" && Object.entries(SIZES).map(([name, val]) => (
                <button
                  key={name}
                  onClick={() => setPenSize(val)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100",
                    penSize === val && "bg-gray-200"
                  )}
                >
                  <div className="bg-gray-800 rounded-full" style={{ width: val + 2, height: val + 2 }} />
                </button>
              ))}
            </div>
          )}

          <div className="bg-white/90 backdrop-blur-md shadow-2xl border border-gray-200/50 rounded-full p-2 flex items-center gap-1">
            <button
              onClick={() => {
                if (activeTool === "pen") setShowPalette(!showPalette);
                setActiveTool("pen");
              }}
              className={cn(
                "p-3 rounded-full transition-all duration-200 group relative",
                activeTool === "pen" ? "bg-gray-100 text-brand-600 shadow-inner" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <Pen size={20} />
              {activeTool === "pen" && (
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full" style={{ backgroundColor: penColor }} />
              )}
            </button>
            <button
              onClick={() => {
                if (activeTool === "highlighter") setShowPalette(!showPalette);
                setActiveTool("highlighter");
              }}
              className={cn(
                "p-3 rounded-full transition-all duration-200 group relative",
                activeTool === "highlighter" ? "bg-gray-100 text-brand-600 shadow-inner" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <Highlighter size={20} />
              {activeTool === "highlighter" && (
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full" style={{ backgroundColor: highlighterColor.replace(/[\d.]+\)$/g, '1)') }} />
              )}
            </button>
            <button
              onClick={() => {
                setShowPalette(false);
                setActiveTool("eraser");
              }}
              className={cn(
                "p-3 rounded-full transition-all duration-200",
                activeTool === "eraser" ? "bg-gray-100 text-brand-600 shadow-inner" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <Eraser size={20} />
            </button>
            
            <div className="w-[1px] h-8 bg-gray-200 mx-2" />
            
            <button
              onClick={() => {
                if(confirm("Clear the entire board?")) onClear();
              }}
              className="p-3 rounded-full text-red-500 hover:bg-red-50 transition-all duration-200"
              title="Clear Board"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
