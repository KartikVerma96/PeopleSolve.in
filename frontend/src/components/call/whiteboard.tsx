"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Circle,
  Diamond,
  Download,
  Eraser,
  Grid3x3,
  Highlighter,
  Maximize2,
  Minus,
  Minimize2,
  MousePointer2,
  Pen,
  Redo2,
  Square,
  Trash2,
  Triangle,
  Type,
  Undo2,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef } from "react";

import { ICON_STROKE } from "@/lib/icon-style";
import {
  COLORS,
  type Tool,
  type BrushSize,
  type GridMode,
  type FillMode,
} from "@/hooks/use-whiteboard";
import { cn } from "@/lib/utils";

type WhiteboardProps = {
  isOpen: boolean;
  isFullscreen: boolean;
  onClose: () => void;
  onToggleFullscreen: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  tool: Tool;
  setTool: (t: Tool) => void;
  color: string;
  setColor: (c: string) => void;
  brushSize: BrushSize;
  setBrushSize: (s: BrushSize) => void;
  fillMode: FillMode;
  setFillMode: (f: FillMode) => void;
  gridMode: GridMode;
  setGridMode: (g: GridMode) => void;
  remoteCursor: { x: number; y: number; userName: string } | null;
  onPointerDown: (e: React.MouseEvent | React.TouchEvent) => void;
  onPointerMove: (e: React.MouseEvent | React.TouchEvent) => void;
  onPointerUp: () => void;
  undo: () => void;
  redo: () => void;
  clearAll: () => void;
  saveAsImage: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

// Dashed line icon
function DashedLineIcon({ className, strokeWidth }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} strokeWidth={strokeWidth ?? 2} stroke="currentColor">
      <path d="M5 19L8 16" strokeLinecap="round" />
      <path d="M11 13L14 10" strokeLinecap="round" />
      <path d="M17 7L19 5" strokeLinecap="round" />
    </svg>
  );
}

// Laser icon
function LaserIcon({ className, strokeWidth }: { className?: string; strokeWidth?: number }) {
  return <Zap className={className} strokeWidth={strokeWidth} />;
}

const DRAW_TOOLS: { tool: Tool; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; label: string; group: string }[] = [
  { tool: "pen", icon: Pen, label: "Pen", group: "draw" },
  { tool: "highlighter", icon: Highlighter, label: "Highlighter", group: "draw" },
  { tool: "eraser", icon: Eraser, label: "Eraser", group: "draw" },
  { tool: "laser", icon: LaserIcon, label: "Laser pointer (fades)", group: "draw" },
  { tool: "text", icon: Type, label: "Text", group: "draw" },
];

const SHAPE_TOOLS: { tool: Tool; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; label: string }[] = [
  { tool: "line", icon: Minus, label: "Line" },
  { tool: "dashed-line", icon: DashedLineIcon, label: "Dashed line" },
  { tool: "arrow", icon: ArrowRight, label: "Arrow" },
  { tool: "rect", icon: Square, label: "Rectangle" },
  { tool: "circle", icon: Circle, label: "Circle / Ellipse" },
  { tool: "triangle", icon: Triangle, label: "Triangle" },
  { tool: "diamond", icon: Diamond, label: "Diamond" },
];

const SIZES: { size: BrushSize; label: string; px: number }[] = [
  { size: "thin", label: "Thin", px: 2 },
  { size: "medium", label: "Medium", px: 4 },
  { size: "thick", label: "Thick", px: 8 },
];

const GRIDS: { mode: GridMode; label: string }[] = [
  { mode: "none", label: "No grid" },
  { mode: "dots", label: "Dots" },
  { mode: "lines", label: "Ruled lines" },
  { mode: "graph", label: "Graph paper" },
];

const FILLS: { mode: FillMode; label: string }[] = [
  { mode: "stroke", label: "Outline" },
  { mode: "fill", label: "Fill" },
  { mode: "both", label: "Both" },
];

export function Whiteboard({
  isOpen, isFullscreen, onClose, onToggleFullscreen,
  canvasRef, tool, setTool, color, setColor,
  brushSize, setBrushSize, fillMode, setFillMode,
  gridMode, setGridMode, remoteCursor,
  onPointerDown, onPointerMove, onPointerUp,
  undo, redo, clearAll, saveAsImage, canUndo, canRedo,
}: WhiteboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Resize canvas to container
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = 1920;
      canvas.height = 1080;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [isOpen, isFullscreen, canvasRef]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
      // Tool shortcuts
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === "p") setTool("pen");
        if (e.key === "h") setTool("highlighter");
        if (e.key === "e") setTool("eraser");
        if (e.key === "t") setTool("text");
        if (e.key === "l") setTool("laser");
        if (e.key === "r") setTool("rect");
        if (e.key === "c") setTool("circle");
        if (e.key === "a") setTool("arrow");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, undo, redo, setTool]);

  if (!isOpen) return null;

  const isShapeTool = ["rect", "circle", "triangle", "diamond", "line", "arrow", "dashed-line"].includes(tool);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className={cn(
          "flex flex-col overflow-hidden rounded-xl border bg-white shadow-2xl dark:bg-zinc-950",
          isFullscreen
            ? "fixed inset-4 z-[9998] border-border"
            : "h-full border-border/80 dark:border-white/10",
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-muted/30 px-3 py-1.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <span className="text-xs font-semibold text-foreground">Whiteboard</span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={onToggleFullscreen} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
              {isFullscreen ? <Minimize2 className="size-3.5" strokeWidth={ICON_STROKE} /> : <Maximize2 className="size-3.5" strokeWidth={ICON_STROKE} />}
            </button>
            <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="Close">
              <X className="size-3.5" strokeWidth={ICON_STROKE} />
            </button>
          </div>
        </div>

        {/* Toolbar — scrollable on mobile */}
        <div className="flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-border/60 px-2 py-1.5 scrollbar-none dark:border-white/[0.06]">
          {/* Drawing tools */}
          {DRAW_TOOLS.map(({ tool: t, icon: Icon, label }) => (
            <ToolBtn key={t} active={tool === t} onClick={() => setTool(t)} title={label}>
              <Icon className="size-3.5" strokeWidth={ICON_STROKE} />
            </ToolBtn>
          ))}

          <Sep />

          {/* Shape tools */}
          {SHAPE_TOOLS.map(({ tool: t, icon: Icon, label }) => (
            <ToolBtn key={t} active={tool === t} onClick={() => setTool(t)} title={label}>
              <Icon className="size-3.5" strokeWidth={ICON_STROKE} />
            </ToolBtn>
          ))}

          <Sep />

          {/* Colors */}
          <div className="flex items-center gap-0.5">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "size-5 rounded-full border transition-transform hover:scale-110",
                  color === c ? "border-primary scale-110 ring-1 ring-primary" : "border-border/50",
                  c === "#ffffff" && "border-border",
                )}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>

          <Sep />

          {/* Brush sizes */}
          {SIZES.map(({ size, label, px }) => (
            <ToolBtn key={size} active={brushSize === size} onClick={() => setBrushSize(size)} title={label}>
              <div className="rounded-full bg-current" style={{ width: px * 1.5 + 2, height: px * 1.5 + 2 }} />
            </ToolBtn>
          ))}

          <Sep />

          {/* Fill mode (only for shapes) */}
          {isShapeTool && (
            <>
              {FILLS.map(({ mode, label }) => (
                <ToolBtn key={mode} active={fillMode === mode} onClick={() => setFillMode(mode)} title={label} small>
                  <span className="text-[9px] font-bold">{label[0]}</span>
                </ToolBtn>
              ))}
              <Sep />
            </>
          )}

          {/* Grid */}
          <div className="relative group">
            <ToolBtn active={gridMode !== "none"} onClick={() => {}} title="Grid">
              <Grid3x3 className="size-3.5" strokeWidth={ICON_STROKE} />
            </ToolBtn>
            <div className="invisible absolute left-0 top-full z-50 mt-1 w-32 rounded-lg border border-border bg-card p-1 shadow-xl group-hover:visible dark:border-white/10 dark:bg-zinc-900">
              {GRIDS.map(({ mode, label }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setGridMode(mode)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[11px]",
                    gridMode === mode ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Sep />

          {/* Actions */}
          <ToolBtn active={false} onClick={undo} title="Undo (Ctrl+Z)" disabled={!canUndo}>
            <Undo2 className="size-3.5" strokeWidth={ICON_STROKE} />
          </ToolBtn>
          <ToolBtn active={false} onClick={redo} title="Redo (Ctrl+Shift+Z)" disabled={!canRedo}>
            <Redo2 className="size-3.5" strokeWidth={ICON_STROKE} />
          </ToolBtn>
          <ToolBtn active={false} onClick={clearAll} title="Clear all" danger>
            <Trash2 className="size-3.5" strokeWidth={ICON_STROKE} />
          </ToolBtn>
          <ToolBtn active={false} onClick={saveAsImage} title="Save as PNG">
            <Download className="size-3.5" strokeWidth={ICON_STROKE} />
          </ToolBtn>
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className={cn(
            "relative min-h-0 flex-1 overflow-hidden",
            tool === "laser" ? "cursor-pointer" : "cursor-crosshair",
            gridMode !== "none" ? "bg-white" : "bg-white",
          )}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={onPointerDown}
            onMouseMove={onPointerMove}
            onMouseUp={onPointerUp}
            onMouseLeave={onPointerUp}
            onTouchStart={onPointerDown}
            onTouchMove={onPointerMove}
            onTouchEnd={onPointerUp}
            className="touch-none"
          />

          {/* Remote cursor */}
          {remoteCursor && (
            <div
              className="pointer-events-none absolute z-10 transition-all duration-75"
              style={{
                left: `${(remoteCursor.x / 1920) * 100}%`,
                top: `${(remoteCursor.y / 1080) * 100}%`,
              }}
            >
              <MousePointer2
                className="size-4 -translate-x-0.5 -translate-y-0.5 text-primary drop-shadow-md"
                strokeWidth={2}
                fill="rgba(50,205,50,0.2)"
              />
              <span className="ml-3 whitespace-nowrap rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm">
                {remoteCursor.userName}
              </span>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex shrink-0 items-center justify-between border-t border-border/60 bg-muted/20 px-3 py-1 text-[10px] text-muted-foreground dark:border-white/[0.06]">
          <span>
            {tool === "laser" ? "Laser pointer — draw to highlight, fades in 2s" :
             tool === "text" ? "Click to place text" :
             isShapeTool ? "Click and drag to draw shape" :
             "Draw freely"}
          </span>
          <span className="hidden sm:inline">
            P=pen H=highlight E=eraser L=laser T=text R=rect C=circle A=arrow
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// --- Sub-components ---

function ToolBtn({
  active, onClick, title, children, disabled, danger, small,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center rounded-md transition-colors",
        small ? "size-6" : "size-7",
        active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        danger && "hover:bg-red-500/10 hover:text-red-500",
        disabled && "opacity-30 pointer-events-none",
      )}
      title={title}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="mx-0.5 h-4 w-px bg-border/60 dark:bg-white/10" />;
}
