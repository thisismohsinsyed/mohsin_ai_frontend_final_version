"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function TemplateEditorDialog({
  open,
  template,
  onOpenChange,
  onSave,
  onDelete,
  isProcessing = false,
  errorMessage = "",
}) {
  const [label, setLabel] = useState(template?.label || "");
  const [initialSentence, setInitialSentence] = useState(template?.initialSentence || "");
  const [systemPrompt, setSystemPrompt] = useState(template?.systemPrompt || "");

  useEffect(() => {
    if (template && open) {
      setLabel(template.label || "");
      setInitialSentence(template.initialSentence || "");
      setSystemPrompt(template.systemPrompt || "");
    }
  }, [template, open]);

  const handleSave = (event) => {
    event.preventDefault();
    if (!template || !onSave) return;
    onSave({
      id: template.id,
      label: label.trim() || template.label,
      initialSentence: initialSentence.trim(),
      systemPrompt: systemPrompt.trim(),
    });
  };

  const handleDelete = () => {
    if (!template || !onDelete) return;
    onDelete(template.id);
  };

  const disableSave = isProcessing || !label.trim() || !initialSentence.trim() || !systemPrompt.trim();

  return (
    <Dialog open={open} onOpenChange={(value) => !isProcessing && onOpenChange?.(value)}>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit template</DialogTitle>
            <DialogDescription>Update the default sentence, prompt, or label for this uploaded script.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="template-label">Display name</Label>
            <Input
              id="template-label"
              value={label}
              maxLength={120}
              onChange={(event) => setLabel(event.target.value)}
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-initial">Initial sentence</Label>
            <Textarea
              id="template-initial"
              value={initialSentence}
              onChange={(event) => setInitialSentence(event.target.value)}
              disabled={isProcessing}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-prompt">System prompt</Label>
            <Textarea
              id="template-prompt"
              value={systemPrompt}
              onChange={(event) => setSystemPrompt(event.target.value)}
              disabled={isProcessing}
              rows={6}
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
              {errorMessage}
            </p>
          )}

          <DialogFooter className="gap-2 flex-col sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={handleDelete}
              disabled={isProcessing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <Button type="button" variant="ghost" onClick={() => onOpenChange?.(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button type="submit" disabled={disableSave} className="flex items-center gap-2">
                {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
