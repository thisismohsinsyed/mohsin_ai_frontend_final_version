"use client";

import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CALL_STAGE_BLUEPRINT } from "@/data/callStages";
import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  pass: {
    icon: CheckCircle2,
    label: "Pass",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  fail: {
    icon: XCircle,
    label: "Fail",
    badge: "bg-red-50 text-red-700 border border-red-200",
  },
  info: {
    icon: Info,
    label: "Info",
    badge: "bg-slate-100 text-slate-600 border border-slate-200",
  },
};

function StageBadge({ stage, isActive }) {
  const statusKey = stage?.status && STATUS_STYLES[stage.status] ? stage.status : "info";
  const status = STATUS_STYLES[statusKey];
  const Icon = status.icon;
  const subtitle = stage.observedIntents?.length
    ? stage.observedIntents.slice(-1)[0]
    : stage.reason || "Awaiting AI evaluation.";

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-3 flex flex-col gap-1",
        isActive && "ring-2 ring-indigo-200"
      )}
    >
      <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
        <span>
          {stage.id} · {stage.name}
        </span>
        <span className={cn("inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full", status.badge)}>
          <Icon className="h-3 w-3" />
          {status.label}
        </span>
      </div>
      <p className="text-xs text-slate-500 line-clamp-2">{subtitle}</p>
    </div>
  );
}

export default function CallTracePanel({
  trace,
  isLoading = false,
  activeStageId,
  className,
}) {
  const timestamp = trace?.generatedAt ? new Date(trace.generatedAt) : null;
  const formattedTime = timestamp ? timestamp.toLocaleString() : null;

  const stageList = trace?.stages?.length
    ? trace.stages
    : CALL_STAGE_BLUEPRINT.map((stage) => ({
        ...stage,
        expectedIntents: stage.intents,
        status: "info",
        observedIntents: [],
        reason: "Upload a script to generate AI coverage.",
      }));

  return (
    <Card className={cn("border border-slate-200 shadow-xl", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Call Status Trace</CardTitle>
            <p className="text-sm text-slate-500">Stage-by-stage status for your current template.</p>
          </div>
          {isLoading && <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />}
        </div>
        {trace?.scriptConfidence && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Badge variant="outline" className="uppercase tracking-wide text-[11px]">
              Confidence: {trace.scriptConfidence}
            </Badge>
            {formattedTime && <span>Generated {formattedTime}</span>}
          </div>
        )}
        {trace?.flags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {trace.flags.map((flag) => (
              <Badge key={flag} variant="destructive" className="text-xs">
                {flag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-slate-500">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <p className="text-sm font-medium">Tracing latest call flow...</p>
            <p className="text-xs text-slate-400">Hang tight while we analyze the uploaded script.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {stageList.map((stage) => (
              <StageBadge key={stage.id} stage={stage} isActive={activeStageId === stage.id} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
