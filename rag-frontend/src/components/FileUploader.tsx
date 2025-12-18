"use client";

import React from "react";
import { Upload, X } from "lucide-react";

import { ButtonPrimary } from "@/components/ui/ButtonPrimary";
import { cn } from "@/lib/utils";

const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ACCEPTED_EXTENSIONS = [".pdf", ".txt", ".docx"];

type FileUploaderProps = {
  files: File[];
  onChange: (files: File[]) => void;
  label?: string;
  description?: string;
};

export function FileUploader({
  files,
  onChange,
  label = "Upload knowledge sources",
  description = "Drag & drop your documents here or use the button below.",
}: FileUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const acceptAttr = ACCEPTED_EXTENSIONS.join(",");

  const upsertFiles = (incoming: FileList | File[]) => {
    const asArray = Array.from(incoming);
    const filtered = asArray.filter((file) =>
      ACCEPTED_MIME_TYPES.includes(file.type) ||
      ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext)),
    );

    const existingNames = new Set(files.map((file) => `${file.name}-${file.size}`));
    const merged = [...files];

    filtered.forEach((file) => {
      const fileKey = `${file.name}-${file.size}`;
      if (!existingNames.has(fileKey)) {
        merged.push(file);
        existingNames.add(fileKey);
      }
    });

    onChange(merged);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      upsertFiles(event.target.files);
      event.target.value = "";
    }
  };

  const handleRemove = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files) {
      upsertFiles(event.dataTransfer.files);
    }
  };

  const handleDrag = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.type === "dragenter" || event.type === "dragover") {
      setIsDragging(true);
    } else if (event.type === "dragleave") {
      setIsDragging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xl font-semibold text-slate-900">{label}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-2xl p-6 transition bg-slate-50",
          isDragging ? "border-cyan-400 bg-cyan-50" : "border-slate-300",
        )}
      >
        <div className="flex flex-col items-center space-y-3 text-center text-slate-500">
          <div className="rounded-full bg-white p-4 shadow">
            <Upload className="h-6 w-6 text-cyan-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Drop files anywhere in this area</p>
            <p className="text-sm">Accepted formats: PDF, TXT, DOCX</p>
          </div>
          <ButtonPrimary onClick={() => inputRef.current?.click()} type="button">
            Choose files
          </ButtonPrimary>
          <input
            ref={inputRef}
            type="file"
            accept={acceptAttr}
            multiple
            className="sr-only"
            onChange={handleInputChange}
          />
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">
            {files.length} file{files.length === 1 ? "" : "s"} selected
          </p>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${file.size}-${index}`}
                className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-slate-900 shadow-sm"
              >
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  onClick={() => handleRemove(index)}
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

