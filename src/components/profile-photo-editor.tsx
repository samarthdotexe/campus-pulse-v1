"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";

type ProfilePhotoEditorProps = {
  file: File;
  onCancel: () => void;
  onSave: (file: File) => Promise<void>;
};

export function ProfilePhotoEditor({ file, onCancel, onSave }: ProfilePhotoEditorProps) {
  const sourceUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => URL.revokeObjectURL(sourceUrl), [sourceUrl]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && !saving && onCancel();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onCancel, saving]);

  const save = async () => {
    try {
      setError("");
      const image = new Image();
      image.src = sourceUrl;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Your browser could not prepare this image.");
      const base = Math.max(512 / image.naturalWidth, 512 / image.naturalHeight);
      const scale = base * zoom;
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      context.drawImage(image, (512 - width) / 2 + x * 120, (512 - height) / 2 + y * 120, width, height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
      if (!blob) throw new Error("Your browser could not export this image.");
      setSaving(true);
      await onSave(new File([blob], "avatar.webp", { type: "image/webp" }));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "We couldn't prepare this photo.");
    } finally {
      setSaving(false);
    }
  };

  return <div role="dialog" aria-modal="true" aria-labelledby="photo-editor-title" className="fixed inset-0 z-[70] flex items-end bg-black/75 p-4 backdrop-blur-sm sm:items-center sm:justify-center">
    <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950 p-4 shadow-2xl sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><h2 id="photo-editor-title" className="text-lg font-semibold text-white">Adjust profile photo</h2><p className="mt-1 text-sm text-white/50">Crop, zoom, and position your square profile photo.</p></div><button type="button" onClick={onCancel} disabled={saving} aria-label="Close photo editor" className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button></div>
      <div className="mx-auto mt-5 aspect-square w-full max-w-xs overflow-hidden rounded-2xl border border-emerald-400/25 bg-black"><img src={sourceUrl} alt="Crop preview" className="h-full w-full object-contain transition-transform duration-200" style={{ transform: `translate(${x * 12}%, ${y * 12}%) scale(${zoom})` }} /></div>
      <div className="mt-6 space-y-4"><label className="block text-sm text-white/70">Zoom<input aria-label="Zoom" type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="mt-2 w-full accent-emerald-400" /></label><div className="grid grid-cols-2 gap-4"><label className="text-sm text-white/70">Horizontal<input aria-label="Horizontal position" type="range" min="-1" max="1" step="0.01" value={x} onChange={(event) => setX(Number(event.target.value))} className="mt-2 w-full accent-emerald-400" /></label><label className="text-sm text-white/70">Vertical<input aria-label="Vertical position" type="range" min="-1" max="1" step="0.01" value={y} onChange={(event) => setY(Number(event.target.value))} className="mt-2 w-full accent-emerald-400" /></label></div></div>
      {error && <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => { setZoom(1); setX(0); setY(0); }} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-white/70 hover:bg-white/10"><RotateCcw className="h-4 w-4" />Reset</button><button type="button" onClick={() => void save()} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 text-sm font-semibold text-black hover:bg-emerald-300 disabled:opacity-60"><Check className="h-4 w-4" />{saving ? "Saving photo…" : "Save photo"}</button></div>
    </div>
  </div>;
}
