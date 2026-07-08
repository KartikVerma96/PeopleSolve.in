"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";

// --- Types ---

export type Tool =
  | "pen" | "highlighter" | "eraser" | "text"
  | "rect" | "circle" | "triangle" | "diamond"
  | "line" | "arrow" | "dashed-line"
  | "laser";

export type BrushSize = "thin" | "medium" | "thick";
export type GridMode = "none" | "dots" | "lines" | "graph";
export type FillMode = "stroke" | "fill" | "both";

const BRUSH_WIDTHS: Record<BrushSize, number> = { thin: 2, medium: 4, thick: 8 };
const HIGHLIGHTER_WIDTHS: Record<BrushSize, number> = { thin: 12, medium: 20, thick: 30 };

export const COLORS = [
  "#000000", "#374151", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#ffffff",
];

type Point = { x: number; y: number };

type StrokeElement = {
  type: "stroke";
  id: string;
  points: Point[];
  color: string;
  width: number;
  opacity: number;
  userId: string;
};

type TextElement = {
  type: "text";
  id: string;
  x: number;
  y: number;
  content: string;
  color: string;
  fontSize: number;
  userId: string;
};

type ShapeType = "rect" | "circle" | "triangle" | "diamond" | "line" | "arrow" | "dashed-line";

type ShapeElement = {
  type: ShapeType;
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
  fillMode: FillMode;
  userId: string;
};

type LaserElement = {
  type: "laser";
  id: string;
  points: Point[];
  color: string;
  userId: string;
  timestamp: number;
};

export type BoardElement = StrokeElement | TextElement | ShapeElement | LaserElement;

type UseWhiteboardOptions = {
  userId: string | undefined;
  userName: string;
  threadId: string | undefined;
};

let elementIdCounter = 0;
function newId(uid: string) {
  return `${uid}-${++elementIdCounter}-${Date.now()}`;
}

export function useWhiteboard({ userId, userName, threadId }: UseWhiteboardOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState<BrushSize>("medium");
  const [fillMode, setFillMode] = useState<FillMode>("stroke");
  const [gridMode, setGridMode] = useState<GridMode>("none");
  const [elements, setElements] = useState<BoardElement[]>([]);
  const [undoStack, setUndoStack] = useState<BoardElement[][]>([]);
  const [redoStack, setRedoStack] = useState<BoardElement[][]>([]);
  const [remoteCursor, setRemoteCursor] = useState<{ x: number; y: number; userName: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Drawing state refs
  const isDrawing = useRef(false);
  const currentStroke = useRef<Point[]>([]);
  const shapeStart = useRef<Point | null>(null);
  const shapeEnd = useRef<Point | null>(null);
  const elementsRef = useRef<BoardElement[]>([]);
  const gridModeRef = useRef<GridMode>("none");
  elementsRef.current = elements;
  gridModeRef.current = gridMode;

  // Listen for other user opening/closing whiteboard (runs always, not just when open)
  useEffect(() => {
    if (!threadId || !userId) return;
    const socket = getSocket(userId);

    const onOpened = () => {
      setIsOpen(true);
    };
    const onClosed = () => {
      setIsOpen(false);
    };

    socket.on("wb:opened", onOpened);
    socket.on("wb:closed", onClosed);

    return () => {
      socket.off("wb:opened", onOpened);
      socket.off("wb:closed", onClosed);
    };
  }, [threadId, userId]);

  // Emit open/close events when toggling
  const setIsOpenAndNotify = useCallback((open: boolean) => {
    setIsOpen(open);
    if (threadId && userId) {
      const socket = getSocket(userId);
      socket.emit(open ? "wb:open" : "wb:close", { threadId });
    }
  }, [threadId, userId]);

  // Grid mode change — emit to other user
  const setGridModeAndNotify = useCallback((mode: GridMode) => {
    setGridMode(mode);
    if (threadId && userId) {
      getSocket(userId).emit("wb:grid", { threadId, gridMode: mode });
    }
  }, [threadId, userId]);

  // Laser auto-fade
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setElements((prev) => {
        const filtered = prev.filter(
          (el) => el.type !== "laser" || now - (el as LaserElement).timestamp < 2000,
        );
        return filtered.length !== prev.length ? filtered : prev;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // --- Socket sync ---
  useEffect(() => {
    if (!threadId || !userId || !isOpen) return;
    const socket = getSocket(userId);
    socket.emit("wb:join", threadId);

    const onStroke = (el: StrokeElement | LaserElement) => {
      // If it's a laser from remote, set the timestamp to now so it fades from this moment
      if (el.type === "laser") {
        setElements((p) => [...p, { ...el, timestamp: Date.now() }]);
      } else {
        setElements((p) => [...p, el]);
      }
    };
    const onText = (el: TextElement) => setElements((p) => [...p, el]);
    const onShape = (el: ShapeElement) => setElements((p) => [...p, el]);
    const onUndo = (data: { userId: string }) => {
      setElements((prev) => {
        const idx = [...prev].reverse().findIndex((e) => e.userId === data.userId);
        if (idx === -1) return prev;
        return prev.filter((_, i) => i !== prev.length - 1 - idx);
      });
    };
    const onClear = () => setElements([]);
    const onGrid = (data: { gridMode: GridMode }) => setGridMode(data.gridMode);
    const onCursor = (data: { x: number; y: number; userName: string; userId: string }) => {
      if (data.userId !== userId) setRemoteCursor({ x: data.x, y: data.y, userName: data.userName });
    };

    socket.on("wb:stroke", onStroke);
    socket.on("wb:text", onText);
    socket.on("wb:shape", onShape);
    socket.on("wb:undo", onUndo);
    socket.on("wb:clear", onClear);
    socket.on("wb:grid", onGrid);
    socket.on("wb:cursor", onCursor);

    return () => {
      socket.emit("wb:leave", threadId);
      socket.off("wb:stroke", onStroke);
      socket.off("wb:text", onText);
      socket.off("wb:shape", onShape);
      socket.off("wb:undo", onUndo);
      socket.off("wb:clear", onClear);
      socket.off("wb:grid", onGrid);
      socket.off("wb:cursor", onCursor);
    };
  }, [threadId, userId, isOpen]);

  // --- Redraw ---
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid
    drawGrid(ctx, canvas.width, canvas.height, gridModeRef.current);

    // Elements
    for (const el of elementsRef.current) {
      if (el.type === "stroke") drawStroke(ctx, el);
      else if (el.type === "text") drawText(ctx, el);
      else if (el.type === "laser") drawLaser(ctx, el);
      else drawShape(ctx, el);
    }
  }, []);

  useEffect(() => { redraw(); }, [elements, gridMode, redraw]);

  // --- Canvas helpers ---
  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0]!.clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0]!.clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const isShapeTool = (t: Tool): t is ShapeType =>
    ["rect", "circle", "triangle", "diamond", "line", "arrow", "dashed-line"].includes(t);

  // --- Pointer events ---
  const onPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!userId) return;
    const point = getCanvasPoint(e);
    isDrawing.current = true;

    if (tool === "pen" || tool === "highlighter" || tool === "eraser" || tool === "laser") {
      currentStroke.current = [point];
    } else if (isShapeTool(tool)) {
      shapeStart.current = point;
      shapeEnd.current = null;
    } else if (tool === "text") {
      const content = prompt("Enter text:");
      if (content && threadId) {
        const textEl: TextElement = {
          type: "text", id: newId(userId), x: point.x, y: point.y,
          content, color, fontSize: BRUSH_WIDTHS[brushSize] * 6, userId,
        };
        pushElement(textEl);
        getSocket(userId).emit("wb:text", { threadId, text: textEl });
      }
      isDrawing.current = false;
    }
  }, [userId, threadId, tool, color, brushSize, getCanvasPoint]);

  const onPointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!userId || !threadId) return;
    const point = getCanvasPoint(e);

    const socket = getSocket(userId);
    socket.volatile.emit("wb:cursor", { threadId, x: point.x, y: point.y, userName });

    if (!isDrawing.current) return;

    if (tool === "pen" || tool === "highlighter" || tool === "eraser" || tool === "laser") {
      currentStroke.current.push(point);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx && currentStroke.current.length >= 2) {
        const pts = currentStroke.current;
        const p1 = pts[pts.length - 2]!;
        const p2 = pts[pts.length - 1]!;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        if (tool === "laser") {
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 3;
          ctx.globalAlpha = 0.7;
        } else {
          ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
          ctx.lineWidth = tool === "highlighter" ? HIGHLIGHTER_WIDTHS[brushSize] : BRUSH_WIDTHS[brushSize];
          ctx.globalAlpha = tool === "highlighter" ? 0.3 : 1;
        }
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    } else if (shapeStart.current && isShapeTool(tool)) {
      shapeEnd.current = point;
      redraw();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx) {
        const ghost: ShapeElement = {
          type: tool as ShapeType, id: "ghost",
          x1: shapeStart.current.x, y1: shapeStart.current.y,
          x2: point.x, y2: point.y,
          color, width: BRUSH_WIDTHS[brushSize], fillMode, userId: userId ?? "",
        };
        ctx.globalAlpha = 0.5;
        drawShape(ctx, ghost);
        ctx.globalAlpha = 1;
      }
    }
  }, [userId, threadId, userName, tool, color, brushSize, fillMode, getCanvasPoint, redraw]);

  const onPointerUp = useCallback(() => {
    if (!isDrawing.current || !userId || !threadId) return;
    isDrawing.current = false;

    if (tool === "laser") {
      if (currentStroke.current.length >= 2) {
        const laserEl: LaserElement = {
          type: "laser", id: newId(userId),
          points: [...currentStroke.current], color: "#ef4444",
          userId, timestamp: Date.now(),
        };
        setElements((prev) => [...prev, laserEl]);
        // Emit to other user
        getSocket(userId).emit("wb:stroke", { threadId, stroke: laserEl });
      }
      currentStroke.current = [];
    } else if (tool === "pen" || tool === "highlighter" || tool === "eraser") {
      if (currentStroke.current.length < 2) return;
      const strokeEl: StrokeElement = {
        type: "stroke", id: newId(userId),
        points: [...currentStroke.current],
        color: tool === "eraser" ? "#ffffff" : color,
        width: tool === "highlighter" ? HIGHLIGHTER_WIDTHS[brushSize] : BRUSH_WIDTHS[brushSize],
        opacity: tool === "highlighter" ? 0.3 : 1, userId,
      };
      pushElement(strokeEl);
      getSocket(userId).emit("wb:stroke", { threadId, stroke: strokeEl });
      currentStroke.current = [];
    } else if (shapeStart.current && shapeEnd.current && isShapeTool(tool)) {
      const shapeEl: ShapeElement = {
        type: tool as ShapeType, id: newId(userId),
        x1: shapeStart.current.x, y1: shapeStart.current.y,
        x2: shapeEnd.current.x, y2: shapeEnd.current.y,
        color, width: BRUSH_WIDTHS[brushSize], fillMode, userId,
      };
      pushElement(shapeEl);
      getSocket(userId).emit("wb:shape", { threadId, shape: shapeEl });
    }
    shapeStart.current = null;
    shapeEnd.current = null;
  }, [userId, threadId, tool, color, brushSize, fillMode]);

  // --- Helpers ---
  const pushElement = useCallback((el: BoardElement) => {
    setUndoStack((prev) => [...prev, elementsRef.current]);
    setRedoStack([]);
    setElements((prev) => [...prev, el]);
  }, []);

  const undo = useCallback(() => {
    if (!userId || !threadId) return;
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1]!;
      setRedoStack((r) => [...r, elementsRef.current]);
      setElements(last);
      return prev.slice(0, -1);
    });
    getSocket(userId).emit("wb:undo", { threadId, userId });
  }, [userId, threadId]);

  const redo = useCallback(() => {
    if (!userId || !threadId) return;
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1]!;
      setUndoStack((u) => [...u, elementsRef.current]);
      setElements(last);
      return prev.slice(0, -1);
    });
    getSocket(userId).emit("wb:redo", { threadId, userId });
  }, [userId, threadId]);

  const clearAll = useCallback(() => {
    if (!userId || !threadId) return;
    setUndoStack((prev) => [...prev, elementsRef.current]);
    setRedoStack([]);
    setElements([]);
    getSocket(userId).emit("wb:clear", { threadId });
  }, [userId, threadId]);

  const saveAsImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const temp = document.createElement("canvas");
    temp.width = canvas.width;
    temp.height = canvas.height;
    const ctx = temp.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, temp.width, temp.height);
    drawGrid(ctx, temp.width, temp.height, gridModeRef.current);
    ctx.drawImage(canvas, 0, 0);
    const link = document.createElement("a");
    link.download = `peoplesolve-whiteboard-${Date.now()}.png`;
    link.href = temp.toDataURL("image/png");
    link.click();
  }, []);

  return {
    canvasRef, tool, setTool, color, setColor,
    brushSize, setBrushSize, fillMode, setFillMode,
    gridMode, setGridMode: setGridModeAndNotify, elements, remoteCursor,
    isOpen, setIsOpen: setIsOpenAndNotify,
    onPointerDown, onPointerMove, onPointerUp,
    undo, redo, clearAll, saveAsImage,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  };
}

// ============ DRAWING FUNCTIONS ============

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, mode: GridMode) {
  if (mode === "none") return;
  const gap = 40;
  ctx.save();

  if (mode === "dots") {
    ctx.fillStyle = "#d1d5db";
    for (let x = gap; x < w; x += gap) {
      for (let y = gap; y < h; y += gap) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (mode === "lines") {
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 0.5;
    // Horizontal lines only
    for (let y = gap; y < h; y += gap) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  } else if (mode === "graph") {
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 0.5;
    for (let x = gap; x < w; x += gap) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = gap; y < h; y += gap) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // Axes
    const cx = Math.round(w / 2 / gap) * gap;
    const cy = Math.round(h / 2 / gap) * gap;
    ctx.strokeStyle = "#9ca3af";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStroke(ctx: CanvasRenderingContext2D, el: StrokeElement) {
  if (el.points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(el.points[0]!.x, el.points[0]!.y);
  for (let i = 1; i < el.points.length; i++) {
    ctx.lineTo(el.points[i]!.x, el.points[i]!.y);
  }
  ctx.strokeStyle = el.color;
  ctx.lineWidth = el.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = el.opacity;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawLaser(ctx: CanvasRenderingContext2D, el: LaserElement) {
  if (el.points.length < 2) return;
  const age = Date.now() - el.timestamp;
  const alpha = Math.max(0, 1 - age / 2000);
  ctx.save();
  ctx.globalAlpha = alpha * 0.7;
  ctx.strokeStyle = el.color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // Glow
  ctx.shadowColor = el.color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(el.points[0]!.x, el.points[0]!.y);
  for (let i = 1; i < el.points.length; i++) {
    ctx.lineTo(el.points[i]!.x, el.points[i]!.y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawText(ctx: CanvasRenderingContext2D, el: TextElement) {
  ctx.font = `${el.fontSize}px 'DM Sans', sans-serif`;
  ctx.fillStyle = el.color;
  ctx.fillText(el.content, el.x, el.y);
}

function drawShape(ctx: CanvasRenderingContext2D, el: ShapeElement) {
  ctx.save();
  ctx.strokeStyle = el.color;
  ctx.fillStyle = el.color;
  ctx.lineWidth = el.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const shouldFill = el.fillMode === "fill" || el.fillMode === "both";
  const shouldStroke = el.fillMode === "stroke" || el.fillMode === "both";

  if (el.type === "rect") {
    const x = Math.min(el.x1, el.x2);
    const y = Math.min(el.y1, el.y2);
    const w = Math.abs(el.x2 - el.x1);
    const h = Math.abs(el.y2 - el.y1);
    if (shouldFill) { ctx.globalAlpha = 0.15; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1; }
    if (shouldStroke) ctx.strokeRect(x, y, w, h);
  } else if (el.type === "circle") {
    const rx = Math.abs(el.x2 - el.x1) / 2;
    const ry = Math.abs(el.y2 - el.y1) / 2;
    const cx = (el.x1 + el.x2) / 2;
    const cy = (el.y1 + el.y2) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2);
    if (shouldFill) { ctx.globalAlpha = 0.15; ctx.fill(); ctx.globalAlpha = 1; }
    if (shouldStroke) ctx.stroke();
  } else if (el.type === "triangle") {
    const x1 = el.x1, y1 = el.y1, x2 = el.x2, y2 = el.y2;
    const topX = (x1 + x2) / 2;
    ctx.beginPath();
    ctx.moveTo(topX, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x1, y2);
    ctx.closePath();
    if (shouldFill) { ctx.globalAlpha = 0.15; ctx.fill(); ctx.globalAlpha = 1; }
    if (shouldStroke) ctx.stroke();
  } else if (el.type === "diamond") {
    const cx = (el.x1 + el.x2) / 2;
    const cy = (el.y1 + el.y2) / 2;
    const hw = Math.abs(el.x2 - el.x1) / 2;
    const hh = Math.abs(el.y2 - el.y1) / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - hh);
    ctx.lineTo(cx + hw, cy);
    ctx.lineTo(cx, cy + hh);
    ctx.lineTo(cx - hw, cy);
    ctx.closePath();
    if (shouldFill) { ctx.globalAlpha = 0.15; ctx.fill(); ctx.globalAlpha = 1; }
    if (shouldStroke) ctx.stroke();
  } else if (el.type === "line") {
    ctx.beginPath();
    ctx.moveTo(el.x1, el.y1);
    ctx.lineTo(el.x2, el.y2);
    ctx.stroke();
  } else if (el.type === "dashed-line") {
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.moveTo(el.x1, el.y1);
    ctx.lineTo(el.x2, el.y2);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (el.type === "arrow") {
    ctx.beginPath();
    ctx.moveTo(el.x1, el.y1);
    ctx.lineTo(el.x2, el.y2);
    ctx.stroke();
    const angle = Math.atan2(el.y2 - el.y1, el.x2 - el.x1);
    const headLen = Math.max(12, el.width * 4);
    ctx.beginPath();
    ctx.moveTo(el.x2, el.y2);
    ctx.lineTo(el.x2 - headLen * Math.cos(angle - Math.PI / 6), el.y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(el.x2, el.y2);
    ctx.lineTo(el.x2 - headLen * Math.cos(angle + Math.PI / 6), el.y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  }
  ctx.restore();
}
