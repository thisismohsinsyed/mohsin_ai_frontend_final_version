"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Settings,
  Play,
  User,
  Bot,
  Activity,
  MoreHorizontal,
  ChevronRight,
  LogOut,
  Sparkles,
  Command,
  LayoutDashboard,
  Users
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import VoiceChat from "@/components/VoiceChat";
import AudioPanel from "@/components/AudioPanel";
import SessionSettingsPanel, { sarahTemplate } from "@/components/SessionSettingsPanel";
import { generalTemplate } from "@/components/General";
import { medicalTemplate } from "@/components/Medical";
import { psychologyTemplate } from "@/components/Psychology";
import ScriptUploadDialog from "@/components/ScriptUploadDialog";
import TemplateEditorDialog from "@/components/TemplateEditorDialog";
import CallTracePanel from "@/components/CallTracePanel";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";
import { usePromptsetting } from "@/contexts/Promptsetting";
import { useASR } from "@/contexts/ASRContext";

const PERSONA_TEMPLATES = [
  generalTemplate,
  medicalTemplate,
  psychologyTemplate,
  sarahTemplate,
];

const DEFAULT_TEMPLATE = PERSONA_TEMPLATES[0];
const MAX_TRACE_MESSAGES = 40;
const LIVE_TRACE_DEBOUNCE_MS = 1200;

export default function VoiceAgentPage() {
  const { listening } = useASR();
  const { setSystemPrompt: setGlobalSystemPrompt, setModel } = useSystemSettings();
  const {
    initialSentence: activeInitialSentence,
    setInitialSentence: setContextInitialSentence,
    setSystemPrompt: setContextSystemPrompt,
  } = usePromptsetting();

  const [activeTab, setActiveTab] = useState("agent"); // 'agent' | 'cloner'
  const [selectedPersonaId, setSelectedPersonaId] = useState(DEFAULT_TEMPLATE.id);

  // Settings States
  const [draftInitialSentence, setDraftInitialSentence] = useState(DEFAULT_TEMPLATE.initialSentence);
  const [draftSystemPrompt, setDraftSystemPrompt] = useState(DEFAULT_TEMPLATE.systemPrompt);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadingScript, setUploadingScript] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [editorDialogOpen, setEditorDialogOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [editorProcessing, setEditorProcessing] = useState(false);
  const [editorError, setEditorError] = useState("");
  const [conversationLog, setConversationLog] = useState([]);
  const [callTrace, setCallTrace] = useState(null);
  const [callTraceLoading, setCallTraceLoading] = useState(false);

  // Sync Global Context on Mount
  useEffect(() => {
    setContextInitialSentence(DEFAULT_TEMPLATE.initialSentence);
    setContextSystemPrompt(DEFAULT_TEMPLATE.systemPrompt);
    setGlobalSystemPrompt(DEFAULT_TEMPLATE.systemPrompt);
    setModel("mistral-7b-instruct-v0.3");
  }, [setContextInitialSentence, setContextSystemPrompt, setGlobalSystemPrompt, setModel]);

  // Derived Template
  const allTemplates = useMemo(
    () => [...PERSONA_TEMPLATES, ...customTemplates],
    [customTemplates]
  );

  const selectedTemplate = useMemo(
    () => allTemplates.find((t) => t.id === selectedPersonaId) ?? DEFAULT_TEMPLATE,
    [allTemplates, selectedPersonaId]
  );

  const editingTemplate = useMemo(
    () => customTemplates.find((tpl) => tpl.id === editingTemplateId) || null,
    [customTemplates, editingTemplateId]
  );
  const normalizeTemplate = useCallback((template) => {
    if (!template) return null;
    return { ...template, isCustom: true };
  }, []);

  const handleConversationUpdate = useCallback((log) => {
    if (!Array.isArray(log)) {
      setConversationLog([]);
      return;
    }
    setConversationLog(log);
  }, []);

  const conversationTranscript = useMemo(() => {
    if (!conversationLog.length) return "";
    return conversationLog
      .slice(-MAX_TRACE_MESSAGES)
      .map((entry) => {
        const speaker = entry.role === "bot" ? "Agent" : "Caller";
        const text = (entry.text ?? "").toString().replace(/\s+/g, " ").trim();
        return text ? `${speaker}: ${text}` : "";
      })
      .filter(Boolean)
      .join("\n");
  }, [conversationLog]);

  const activeStageId = useMemo(() => {
    if (!callTrace?.stages?.length) return null;
    const pendingStage = callTrace.stages.find((stage) => stage.status !== "pass");
    if (pendingStage) return pendingStage.id;
    return callTrace.stages[callTrace.stages.length - 1]?.id || null;
  }, [callTrace]);

  useEffect(() => {
    let isMounted = true;
    const loadTemplates = async () => {
      setTemplatesLoading(true);
      setTemplatesError("");
      try {
        const response = await fetch("/api/templates", { cache: "no-store" });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error || "Unable to load templates.");
        }
        const payload = await response.json();
        if (!isMounted) return;
        const records = Array.isArray(payload.templates)
          ? payload.templates.map(normalizeTemplate).filter(Boolean)
          : [];
        setCustomTemplates(records);
      } catch (error) {
        console.error("Failed to fetch templates", error);
        if (isMounted) {
          setTemplatesError(error.message || "Unable to load templates.");
        }
      } finally {
        if (isMounted) {
          setTemplatesLoading(false);
        }
      }
    };

    loadTemplates();
    return () => {
      isMounted = false;
    };
  }, [normalizeTemplate]);

  useEffect(() => {
    if (!uploadDialogOpen) {
      setUploadError("");
    }
  }, [uploadDialogOpen]);

  useEffect(() => {
    if (editorDialogOpen && editingTemplateId && !editingTemplate) {
      setEditorDialogOpen(false);
      setEditingTemplateId(null);
    }
  }, [editorDialogOpen, editingTemplate, editingTemplateId]);

  useEffect(() => {
    if (!conversationTranscript.trim()) {
      setCallTrace(null);
      setCallTraceLoading(false);
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      if (isCancelled) return;
      setCallTraceLoading(true);
      try {
        const response = await fetch("/api/call-trace/live", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: conversationTranscript,
            templateName: selectedTemplate?.label || "Live Agent Session",
            notes: "Live ASR transcript combining caller and agent turns.",
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error || "Unable to refresh call trace.");
        }

        const payload = await response.json();
        if (!isCancelled) {
          setCallTrace(payload?.trace || null);
        }
      } catch (error) {
        if (error.name === "AbortError" || isCancelled) return;
        console.error("Failed to update call trace", error);
      } finally {
        if (!isCancelled) {
          setCallTraceLoading(false);
        }
      }
    }, LIVE_TRACE_DEBOUNCE_MS);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [conversationTranscript, selectedTemplate?.label]);

  // Handlers
  const handleTemplateSelect = useCallback(
    (templateId) => {
      const template = allTemplates.find((item) => item.id === templateId);
      if (!template) return;

      setSelectedPersonaId(template.id);
      setDraftInitialSentence(template.initialSentence);
      setDraftSystemPrompt(template.systemPrompt);
      setContextInitialSentence(template.initialSentence);
      setContextSystemPrompt(template.systemPrompt);
      setGlobalSystemPrompt(template.systemPrompt);
      setModel("mistral-7b-instruct-v0.3");
    },
    [allTemplates, setContextInitialSentence, setContextSystemPrompt, setGlobalSystemPrompt, setModel]
  );

  const applySettings = useCallback(async () => {
    // 1. Apply to current session context immediately
    setContextInitialSentence(draftInitialSentence);
    setContextSystemPrompt(draftSystemPrompt);
    setGlobalSystemPrompt(draftSystemPrompt);
    setModel("mistral-7b-instruct-v0.3");

    // 2. If it's a custom template, persist changes to backend
    const customTemplate = customTemplates.find((t) => t.id === selectedPersonaId);

    if (customTemplate) {
      const toastId = toast.loading("Saving changes to database...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch(`/api/templates/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selectedPersonaId,
            initialSentence: draftInitialSentence,
            systemPrompt: draftSystemPrompt,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error("Failed to save template changes.");
        }

        const payload = await response.json();
        const updated = normalizeTemplate(payload.template);
        if (updated) {
          setCustomTemplates((prev) =>
            prev.map((t) => (t.id === updated.id ? updated : t))
          );
        }

        toast.success("Template saved & session updated.", { id: toastId });
      } catch (error) {
        clearTimeout(timeoutId);
        console.error("Apply save failed", error);
        if (error.name === 'AbortError') {
          toast.error("Request timed out. Please check your connection.", { id: toastId });
        } else {
          toast.error("Session updated, but failed to save to database.", { id: toastId });
        }
      }
    } else {
      // System template (read-only)
      toast.success("Applied to session (System templates are read-only).");
    }
  }, [
    draftInitialSentence,
    draftSystemPrompt,
    setContextInitialSentence,
    setContextSystemPrompt,
    setGlobalSystemPrompt,
    setModel,
    selectedPersonaId,
    customTemplates,
    normalizeTemplate
  ]);

  const resetSettings = useCallback(() => {
    setDraftInitialSentence(selectedTemplate.initialSentence);
    setDraftSystemPrompt(selectedTemplate.systemPrompt);
  }, [selectedTemplate]);

  const handleScriptUpload = useCallback(
    async ({ file, name, notes }) => {
      if (!file) return;
      setUploadingScript(true);
      setUploadError("");
      try {
        const formData = new FormData();
        formData.append("file", file);
        if (name) formData.append("name", name);
        if (notes) formData.append("notes", notes);

        const response = await fetch("/api/script-templates", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          let message = "Unable to generate a template from this script.";
          try {
            const payload = await response.json();
            if (payload?.error) message = payload.error;
          } catch (_) {
            // fallback: try to read text response (e.g. 500 HTML)
            const text = await response.text().catch(() => null);
            if (text) {
              // Truncate if too long (e.g. huge HTML error page)
              message = text.length > 200 ? text.slice(0, 200) + "..." : text;
            }
          }
          throw new Error(message);
        }

        let payload;
        try {
          payload = await response.json();
        } catch (jsonError) {
          throw new Error("Invalid response from server. Check console for details.");
        }
        const apiTemplate = payload?.template || {};
        const sanitizedInitial = apiTemplate.initialSentence?.toString().trim();
        const sanitizedPrompt = apiTemplate.systemPrompt?.toString().trim();
        if (!sanitizedInitial || !sanitizedPrompt || !apiTemplate.id) {
          throw new Error("The AI response was incomplete. Please try again.");
        }

        const newTemplate = normalizeTemplate({
          ...apiTemplate,
          initialSentence: sanitizedInitial,
          systemPrompt: sanitizedPrompt,
        });

        setCustomTemplates((prev) =>
          [newTemplate, ...prev.filter((tpl) => tpl.id !== newTemplate.id)]
        );
        setTemplatesError("");
        setUploadDialogOpen(false);

        setSelectedPersonaId(newTemplate.id);
        setDraftInitialSentence(newTemplate.initialSentence);
        setDraftSystemPrompt(newTemplate.systemPrompt);
        setContextInitialSentence(newTemplate.initialSentence);
        setContextSystemPrompt(newTemplate.systemPrompt);
        setGlobalSystemPrompt(newTemplate.systemPrompt);
        setModel("mistral-7b-instruct-v0.3");
      } catch (error) {
        console.error("Script upload failed", error);
        setUploadError(error.message || "Failed to process the PDF.");
      } finally {
        setUploadingScript(false);
      }
    },
    [
      normalizeTemplate,
      setContextInitialSentence,
      setContextSystemPrompt,
      setGlobalSystemPrompt,
      setModel,
    ]
  );

  const handleEditTemplateRequest = useCallback(
    (templateId) => {
      const exists = customTemplates.some((tpl) => tpl.id === templateId);
      if (!exists) return;
      setEditingTemplateId(templateId);
      setEditorDialogOpen(true);
      setEditorError("");
    },
    [customTemplates]
  );

  const handleSaveEditedTemplate = useCallback(
    async ({ id, label, initialSentence, systemPrompt }) => {
      setEditorProcessing(true);
      setEditorError("");
      try {
        const response = await fetch(`/api/templates/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label, initialSentence, systemPrompt }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error || "Unable to update template.");
        }
        const payload = await response.json();
        const updatedTemplate = normalizeTemplate(payload?.template);
        if (!updatedTemplate) {
          throw new Error("Template update payload missing data.");
        }
        setCustomTemplates((prev) =>
          prev.map((tpl) => (tpl.id === id ? updatedTemplate : tpl))
        );
        if (selectedPersonaId === id) {
          setDraftInitialSentence(updatedTemplate.initialSentence);
          setDraftSystemPrompt(updatedTemplate.systemPrompt);
          setContextInitialSentence(updatedTemplate.initialSentence);
          setContextSystemPrompt(updatedTemplate.systemPrompt);
          setGlobalSystemPrompt(updatedTemplate.systemPrompt);
          setModel("mistral-7b-instruct-v0.3");
        }
        setEditorDialogOpen(false);
        setEditingTemplateId(null);
      } catch (error) {
        console.error("Failed to update template", error);
        setEditorError(error.message || "Unable to update template.");
      } finally {
        setEditorProcessing(false);
      }
    },
    [
      normalizeTemplate,
      selectedPersonaId,
      setContextInitialSentence,
      setContextSystemPrompt,
      setGlobalSystemPrompt,
      setModel,
    ]
  );

  const handleDeleteCustomTemplate = useCallback(
    async (templateId) => {
      const template = customTemplates.find((tpl) => tpl.id === templateId);
      if (!template) return;
      const confirmed = window.confirm(`Delete "${template.label}"? This cannot be undone.`);
      if (!confirmed) return;

      try {
        const response = await fetch(`/api/templates/${templateId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error || "Unable to delete template.");
        }

        setCustomTemplates((prev) => prev.filter((tpl) => tpl.id !== templateId));
        setTemplatesError("");

        if (selectedPersonaId === templateId) {
          setSelectedPersonaId(DEFAULT_TEMPLATE.id);
          setDraftInitialSentence(DEFAULT_TEMPLATE.initialSentence);
          setDraftSystemPrompt(DEFAULT_TEMPLATE.systemPrompt);
          setContextInitialSentence(DEFAULT_TEMPLATE.initialSentence);
          setContextSystemPrompt(DEFAULT_TEMPLATE.systemPrompt);
          setGlobalSystemPrompt(DEFAULT_TEMPLATE.systemPrompt);
          setModel("mistral-7b-instruct-v0.3");
        }

        if (editingTemplateId === templateId) {
          setEditorDialogOpen(false);
          setEditingTemplateId(null);
          setEditorProcessing(false);
          setEditorError("");
        }
      } catch (error) {
        console.error("Failed to delete template", error);
        setTemplatesError(error.message || "Unable to delete template.");
      }
    },
    [
      customTemplates,
      selectedPersonaId,
      editingTemplateId,
      setContextInitialSentence,
      setContextSystemPrompt,
      setGlobalSystemPrompt,
      setModel,
    ]
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      <SignedIn>
        {/* --- SIDEBAR --- */}
        <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed inset-y-0 left-0 z-50">
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <Mic className="w-5 h-5" />
              </div>
              VoiceFlow
            </div>
          </div>

          <div className="p-4 space-y-1">
            <NavItem
              active={activeTab === 'agent'}
              onClick={() => setActiveTab('agent')}
              icon={<Bot />}
              label="Voice Agent"
            />
            <NavItem
              active={activeTab === 'cloner'}
              onClick={() => setActiveTab('cloner')}
              icon={<Sparkles />}
              label="Voice Cloner"
            />

          </div>

          <div className="mt-auto p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <UserButton afterSignOutUrl="/" />
              <div className="text-sm">
                <p className="font-medium text-slate-700">My Account</p>
                <p className="text-xs text-slate-400">Pro Plan</p>
              </div>
            </div>
          </div>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 md:pl-64 flex flex-col h-screen overflow-hidden">

          {/* Header */}
          <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <h2 className="font-semibold text-lg text-slate-800">
                {activeTab === 'agent' ? 'Interactive Agent Session' : 'Voice Cloning Studio'}
              </h2>
              {listening && (
                <span className="bg-red-50 text-red-600 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 border border-red-100">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  Live
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
                <Command className="w-4 h-4 text-slate-500" />
                Documentation
              </Button>
            </div>
          </header>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'agent' ? (
                <motion.div
                  key="agent"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-2 lg:h-[calc(100vh-8rem)] lg:min-h-0"
                >

                  {/* Left: Chat Interface */}
                  <div className="min-h-[420px] lg:min-h-0 lg:h-full">
                    <VoiceChat
                      initialMessage={activeInitialSentence}
                      className="h-full min-h-0"
                      currentStageId={activeStageId}
                      onConversationUpdate={handleConversationUpdate}
                    />
                  </div>

                  {/* Right: Configuration Panel */}
                  <div className="min-h-[420px] lg:min-h-0 lg:h-full flex flex-col gap-3">
                    <CallTracePanel
                      trace={callTrace}
                      isLoading={callTraceLoading}
                      activeStageId={activeStageId}
                    />
                    {templatesError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {templatesError}
                      </div>
                    )}
                    {templatesLoading && !templatesError && (
                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                        Loading your uploaded templates…
                      </div>
                    )}
                    <SessionSettingsPanel
                      initialSentence={draftInitialSentence}
                      systemPrompt={draftSystemPrompt}
                      onChangeInitialSentence={setDraftInitialSentence}
                      onChangeSystemPrompt={setDraftSystemPrompt}
                      onApply={applySettings}
                      onReset={resetSettings}
                      templateOptions={allTemplates}
                      onTemplateSelect={handleTemplateSelect}
                      selectedTemplateId={selectedPersonaId}
                      editingDisabled={listening}
                      className="flex-1 min-h-[600px]"
                      customTemplates={customTemplates}
                      onRequestUpload={() => setUploadDialogOpen(true)}
                      onEditTemplate={handleEditTemplateRequest}
                      onDeleteTemplate={handleDeleteCustomTemplate}
                    />
                  </div>

                </motion.div>
              ) : (
                <motion.div
                  key="cloner"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-4xl mx-auto"
                >
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">Voice Cloning Studio</h3>
                      <p className="text-slate-500">Upload a 20-30 second high-quality audio sample to generate a professional voice clone.</p>
                    </div>
                    <div className="p-8">
                      <AudioPanel />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        <ScriptUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          onSubmit={handleScriptUpload}
          isUploading={uploadingScript}
          errorMessage={uploadError}
        />

        <TemplateEditorDialog
          open={editorDialogOpen && Boolean(editingTemplate)}
          onOpenChange={(open) => {
            setEditorDialogOpen(open);
            if (!open) {
              setEditingTemplateId(null);
            }
          }}
          template={editingTemplate}
          onSave={handleSaveEditedTemplate}
          onDelete={handleDeleteCustomTemplate}
          isProcessing={editorProcessing}
          errorMessage={editorError}
        />
      </SignedIn>

      <SignedOut>
        <div className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-slate-200 text-center"
          >
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bot className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign in to VoiceFlow</h2>
            <p className="text-slate-500 mb-8">Access your personalized AI agents and voice clones.</p>

            <Link href="/sign-in" className="block w-full">
              <Button size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
                Sign In
              </Button>
            </Link>

            <p className="mt-6 text-sm text-slate-400">
              Don't have an account? <Link href="/sign-up" className="text-indigo-600 hover:underline">Sign up</Link>
            </p>
          </motion.div>
        </div>
      </SignedOut>
    </div>
  );
}

function NavItem({ active, icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active
        ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
    >
      {React.cloneElement(icon, { className: `w-4 h-4 ${active ? 'text-indigo-600' : 'text-slate-400'}` })}
      {label}
      {active && <ChevronRight className="w-4 h-4 ml-auto text-indigo-400" />}
    </button>
  );
}

