"use client";

import { useEffect, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MAX_NOTES_LENGTH = 240;

export default function ScriptUploadDialog({
  open,
  onOpenChange,
  onSubmit,
  isUploading = false,
  errorMessage = "",
}) {
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) {
      setFile(null);
      setName("");
      setNotes("");
    }
  }, [open]);

  const derivedName = name.trim() || (file?.name?.replace(/\.(pdf|txt|md|docx)$/i, "") ?? "");
  const disableSubmit = !file || isUploading;

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    setFile(selected || null);
    if (selected && !name.trim()) {
      setName(selected.name.replace(/\.(pdf|txt|md|docx)$/i, ""));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!file || !onSubmit) return;
    onSubmit({ file, name: derivedName, notes: notes.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !isUploading && onOpenChange?.(value)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload call script</DialogTitle>
          <DialogDescription>
            Attach a script file (up to 8MB). We will summarize it with AI and auto-fill the initial sentence and system prompt for you.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="script-file" className="font-medium">
              Script file
            </Label>
            <Input
              id="script-file"
              type="file"
              accept=".txt,.md,.docx,.pdf"
              onChange={handleFileChange}
              disabled={isUploading}
              required
            />
            <p className="text-xs text-muted-foreground">
              Supports .pdf, .txt, .md, and .docx. Keep under 8MB.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="script-name">Template name</Label>
            <Input
              id="script-name"
              placeholder="e.g. Summit 2025 tax outreach"
              value={name}
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="script-notes">Notes for your team (optional)</Label>
            <Textarea
              id="script-notes"
              placeholder="Add quick reminders for how this template should be used."
              value={notes}
              onChange={(event) => setNotes(event.target.value.slice(0, MAX_NOTES_LENGTH))}
              disabled={isUploading}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {notes.length}/{MAX_NOTES_LENGTH}
            </p>
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
              {errorMessage}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange?.(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={disableSubmit} className="flex items-center gap-2">
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Create template
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
