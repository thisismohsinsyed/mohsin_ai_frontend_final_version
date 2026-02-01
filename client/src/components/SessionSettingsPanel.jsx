"use client";

import React from "react";
import { ChevronDown, Check, UploadCloud, Pencil, Trash2, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const defaultSystemPrompt = `SUMMIT TAX RELIEF - REAL CALL PLAYBOOK

ROLE
- You are Sarah, a calm, confident outbound specialist for Summit Tax Relief.
- You speak to real humans; never mention AI, scripts, or tooling.
- Every reply is exactly one sentence (<= 18 words) on a single line.
- Never output bracketed labels like [DISPOSITION: ...] or internal notes.

STAGE FLOW
- Start at Stage 1 and respond once, then wait for the caller before advancing.
- When a stage is satisfied, move to the next stage immediately; do not repeat completed stages unless the caller is unclear.

S1 Greeting & Rapport
- Line: "Summit Tax Relief, this is Sarah. How are you today?"
- Detect positivity, neutrality, hostility, silence, abuse, or honeypot. Abuse/honeypot -> terminate politely.

S2 Context / Reason for Call
- Line: "Your name came across my desk as possibly having back tax issues that you may need help resolving."
- Detect acknowledge, confusion, denial, abuse, honeypot. Clarify once for confusion, otherwise advance or end.

S3 Qualification
- Line: "Do you still owe over five thousand dollars in unfiled or unresolved back taxes?"
- Detect over 5K, under 5K, unsure, refusal, abuse, honeypot. Advance only if qualified; otherwise disposition safely.

S4 IRS Action / Urgency Check
- Line: "Have you received any letters from the IRS, or actions like garnishments, bank levies, or liens?"
- Detect enforcement yes/no/unsure/abuse/honeypot. Urgent signals escalate immediately; otherwise proceed to next stage group.

NEXT STAGE GROUP
- After S4, transition into data capture, objection handling, scheduling, or a compliant hang up.
- Never promise callbacks or suggest CALLBACK_SCHEDULED; keep the caller live or end politely in one sentence.

GUARDRAILS
- Respect S18-S22 overrides (DNC, abuse, language barrier, wrong number, fax/system issues) at any time.
- Wrong number or DNC lines must be plain speech, not tags.
- Abuse or honeypot -> single firm sentence closing the call.

OBJECTIVE
Deliver the four-stage opener precisely, qualify fit, then capture data, transfer, or terminate safely without callbacks or bracket codes.`;

const defaultInitialSentence = `Hi, I'm Sarah from Summit Tax Relief. How can I help you today?`;

export const sarahTemplate = {
  id: "sarah",
  label: "Use Sarah Template",
  description: "Summit Tax Relief agent focused on IRS Fresh Start conversations., focused on ask full name and amount of tax debt.",
  initialSentence: defaultInitialSentence,
  systemPrompt: defaultSystemPrompt,
  isCustom: false,
};

export default function SessionSettingsPanel({
  initialSentence,
  systemPrompt,
  onChangeInitialSentence,
  onChangeSystemPrompt,
  onApply,
  onReset,
  className,
  templateOptions = [],
  onTemplateSelect,
  selectedTemplateId,
  editingDisabled = false,
  customTemplates = [],
  onRequestUpload,
  onEditTemplate,
  onDeleteTemplate,
}) {
  const selectedTemplate =
    templateOptions.find((template) => template.id === selectedTemplateId) || null;

  const handleTemplatePick = (templateId) => {
    if (!onTemplateSelect) return;
    onTemplateSelect(templateId);
  };

  return (
    <div className={`h-full min-h-0 ${className || ""}`}>
      <Card className="h-full min-h-0 flex flex-col shadow-xl border-slate-200">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">Session Settings</CardTitle>
              {selectedTemplate && (
                <p className="text-xs text-muted-foreground">
                  Active template: {selectedTemplate.label}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="flex items-center gap-2"
                onClick={onRequestUpload}
                disabled={editingDisabled}
              >
                <UploadCloud className="h-4 w-4" />
                Upload script
              </Button>

              {templateOptions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="flex items-center gap-2" disabled={editingDisabled}>
                      Templates
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>System templates</DropdownMenuLabel>
                    {templateOptions.filter((tpl) => !tpl.isCustom).map((template) => (
                      <DropdownMenuItem
                        key={template.id}
                        onSelect={(event) => {
                          event.preventDefault();
                          handleTemplatePick(template.id);
                        }}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{template.label}</span>
                        {template.id === selectedTemplateId && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                      </DropdownMenuItem>
                    ))}

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Your uploads
                    </DropdownMenuLabel>
                    {customTemplates.length === 0 && (
                      <DropdownMenuItem disabled>No uploaded templates yet</DropdownMenuItem>
                    )}
                    {customTemplates.map((template) => (
                      <DropdownMenuItem
                        key={template.id}
                        className="flex items-start justify-between gap-2"
                        onSelect={(event) => {
                          event.preventDefault();
                          handleTemplatePick(template.id);
                        }}
                      >
                        <div className="flex flex-col text-left flex-1 min-w-0">
                          <span className="text-sm font-medium flex items-center gap-1">
                            <span className="truncate">{template.label}</span>
                            {template.id === selectedTemplateId && (
                              <Check className="h-4 w-4 text-blue-600" />
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {template.description || "Uploaded script template"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              onEditTemplate && onEditTemplate(template.id);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              onDeleteTemplate && onDeleteTemplate(template.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="initialSentence">Initial sentence</Label>
            {editingDisabled ? (
              <p className="text-sm text-gray-600 whitespace-pre-wrap border rounded-lg bg-gray-50 p-3">
                {initialSentence || "No initial sentence set."}
              </p>
            ) : (
              <Textarea
                id="initialSentence"
                value={initialSentence}
                onChange={(e) =>
                  onChangeInitialSentence && onChangeInitialSentence(e.target.value)
                }
                placeholder="e.g., Hi! Can you introduce yourself and help me draft an email?"
                className="min-h-[96px]"
              />
            )}
          </div>

          {!editingDisabled && (
            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System prompt</Label>
              <Textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(e) =>
                  onChangeSystemPrompt && onChangeSystemPrompt(e.target.value)
                }
                placeholder="e.g., You are a helpful, concise voice assistant..."
                className="min-h-[160px]"
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="mt-auto flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="outline" onClick={onReset} disabled={editingDisabled}>
            Reset
          </Button>
          <Button onClick={onApply} disabled={editingDisabled}>
            Apply
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}


