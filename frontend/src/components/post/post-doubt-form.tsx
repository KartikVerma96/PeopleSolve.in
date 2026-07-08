"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createDoubt, uploadImage } from "@/lib/api";
import { EXAM_CATEGORIES } from "@/lib/exam-data";
import { initialsFromName } from "@/lib/initials";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addDoubt } from "@/store/slices/doubtsSlice";

/** Category names for the pill buttons. */
const CATEGORY_OPTIONS = EXAM_CATEGORIES.map((c) => c.name);

export function PostDoubtForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.currentUser);

  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]!);
  const [exam, setExam] = useState("");
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [mySolveTime, setMySolveTime] = useState("");
  const [needFasterMethod, setNeedFasterMethod] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current category data
  const catData = EXAM_CATEGORIES.find((c) => c.name === category) ?? EXAM_CATEGORIES[0]!;
  const examOptions = catData.exams.map((e) => e.name);
  // Get subjects for the currently selected exam
  const selectedExamEntry = catData.exams.find((e) => e.name === exam);
  const subjectOptions = selectedExamEntry?.subjects ?? catData.exams[0]?.subjects ?? [];

  // Reset exam & subject when category changes
  useEffect(() => {
    const firstExam = catData.exams[0];
    setExam(firstExam?.name ?? "");
    setSubject(firstExam?.subjects[0] ?? "");
  }, [category]);

  // Reset subject when exam changes
  useEffect(() => {
    const entry = catData.exams.find((e) => e.name === exam);
    if (entry) {
      setSubject(entry.subjects[0] ?? "");
    }
  }, [exam]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) {
      setFile(f);
      setFileName(f.name);
    }
  }, []);

  const onFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setFileName(f.name);
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    const d = description.trim();
    if (!t || !exam || !subject) return;

    setSubmitting(true);
    setError(null);

    try {
      let imageUrl: string | null = null;
      if (file) {
        try {
          const res = await uploadImage(file);
          imageUrl = res.url;
        } catch {
          // Non-blocking
        }
      }

      const doubt = await createDoubt({
        authorId: currentUser.id,
        exam,
        subject,
        title: t,
        description: d || t,
        urgent,
        imageUrl,
        mySolveTime: mySolveTime.trim() || undefined,
        needFasterMethod,
      });

      dispatch(
        addDoubt({
          id: doubt.id,
          authorId: doubt.authorId,
          authorName: doubt.authorName,
          authorInitials: initialsFromName(doubt.authorName),
          exam: doubt.exam,
          subject: doubt.subject,
          title: doubt.title,
          preview: doubt.preview,
          urgent: doubt.urgent,
          viewerCount: doubt.viewerCount,
          helperCount: doubt.helperCount,
        }),
      );

      router.push("/");
    } catch (err) {
      const previewText = d || t;
      const preview = previewText.length > 220 ? `${previewText.slice(0, 217)}…` : previewText;
      dispatch(
        addDoubt({
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorInitials: initialsFromName(currentUser.name),
          exam,
          subject,
          title: t,
          preview,
          urgent,
        }),
      );

      if (err instanceof Error && err.message.includes("API")) {
        setError("Backend is offline — doubt saved locally.");
      }
      router.push("/");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-card/40 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] sm:p-6 md:p-8"
    >
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Post a doubt
        </h1>
        <p className="text-muted-foreground text-sm">
          Select your exam, pick the subject, and type your question.
        </p>
      </div>

      {/* Step 1: Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Exam Category</Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                category === cat
                  ? "bg-primary text-white shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground dark:bg-white/[0.05] dark:hover:bg-white/[0.1]",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Exam + Subject */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="exam">Exam</Label>
          <FormSelect
            id="exam"
            value={exam}
            onValueChange={setExam}
            options={examOptions}
            aria-label="Exam"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <FormSelect
            id="subject"
            value={subject}
            onValueChange={setSubject}
            options={subjectOptions}
            aria-label="Subject"
          />
        </div>
      </div>

      {/* Question */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="title">Question</Label>
          <span
            className={cn(
              "text-[11px] tabular-nums",
              title.length > 100
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground",
            )}
          >
            {title.length}/120
          </span>
        </div>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 120))}
          placeholder="e.g. What is the shortcut for successive discounts?"
          required
          className="h-10"
        />
      </div>

      {/* Details */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="description">Details (optional)</Label>
          <span
            className={cn(
              "text-[11px] tabular-nums",
              description.length > 900
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground",
            )}
          >
            {description.length}/1000
          </span>
        </div>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
          placeholder="Describe the problem you're facing, steps you tried, or anything else about this question…"
          className="min-h-36 rounded-xl"
        />
      </div>

      {/* Image upload */}
      <div className="space-y-2">
        <Label>Image (optional)</Label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 text-center transition-colors",
            dragOver
              ? "border-primary/50 bg-primary/10"
              : "border-border bg-muted/30 hover:border-border/80 dark:border-white/15 dark:bg-white/[0.02] dark:hover:border-white/25",
          )}
        >
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            id="img"
            onChange={onFile}
          />
          <label htmlFor="img" className="cursor-pointer text-sm">
            <span className="font-medium text-foreground">Drop an image</span>
            <span className="text-muted-foreground"> or click to browse</span>
          </label>
          {fileName && (
            <p className="mt-2 text-[12px] text-primary">{fileName}</p>
          )}
          <p className="mt-1 text-[11px] text-muted-foreground">
            JPEG, PNG, GIF, or WebP — max 5 MB
          </p>
        </div>
      </div>

      {/* Solve time + need faster method */}
      <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="needFaster" className="text-foreground">
              I need a faster method
            </Label>
            <p className="text-[12px] text-muted-foreground">
              Tells helpers you already know the basic/textbook approach — you want a shortcut.
            </p>
          </div>
          <Switch id="needFaster" checked={needFasterMethod} onCheckedChange={setNeedFasterMethod} />
        </div>
        {needFasterMethod && (
          <div>
            <Label htmlFor="mySolveTime" className="text-[12px] text-muted-foreground">
              How long do you currently take?
            </Label>
            <Input
              id="mySolveTime"
              value={mySolveTime}
              onChange={(e) => setMySolveTime(e.target.value.slice(0, 30))}
              placeholder='e.g. "3 min" or "2 min 30 sec"'
              className="mt-1 h-9 text-sm"
            />
          </div>
        )}
      </div>

      {/* Urgent toggle */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
        <div className="space-y-0.5">
          <Label htmlFor="urgent" className="text-foreground">
            Mark as urgent
          </Label>
          <p className="text-[12px] text-muted-foreground">
            Highlights your card for helpers scanning the feed.
          </p>
        </div>
        <Switch id="urgent" checked={urgent} onCheckedChange={setUrgent} />
      </div>

      {error && (
        <p className="text-amber-600 text-sm dark:text-amber-400">{error}</p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={!title.trim() || !exam || !subject || submitting}
        className="w-full rounded-xl font-semibold shadow-md dark:shadow-[0_0_20px_-8px_rgba(50,205,50,0.45)]"
      >
        {submitting ? "Posting…" : "Post doubt"}
      </Button>
    </form>
  );
}
