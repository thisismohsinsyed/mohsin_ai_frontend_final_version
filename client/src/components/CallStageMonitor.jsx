"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CALL_STAGE_BLUEPRINT } from "@/data/callStages";
import { cn } from "@/lib/utils";
import { Activity, PauseCircle } from "lucide-react";

const STAGE_STATUS_STYLES = {
  pass: "bg-emerald-50 text-emerald-600 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  fail: "bg-red-50 text-red-600 border-red-200",
  info: "bg-slate-50 text-slate-600 border-slate-200",
};

export default function CallStageMonitor({
  stages = [],
  activeStageId,
  onSelectStage,
  listening = false,
  className,
}) {
  const stageList = stages.length
    ? stages
    : CALL_STAGE_BLUEPRINT.map((stage) => ({
        ...stage,
        expectedIntents: stage.intents,
        status: "info",
        recommendedAction: stage.defaultAction,
        reason: "Upload a script to see AI coverage.",
      }));

  const resolvedActiveStage = stageList.find((stage) => stage.id === activeStageId) || stageList[0] || null;
  const activeStageIndex = resolvedActiveStage ? stageList.findIndex((stage) => stage.id === resolvedActiveStage.id) : -1;
  const nextStage = activeStageIndex >= 0 ? stageList[activeStageIndex + 1] : null;

  const handleStageClick = (stageId) => {
    onSelectStage?.(stageId);
  };

  const handleAdvance = () => {
    if (nextStage) {
      onSelectStage?.(nextStage.id);
    }
  };

  const handleReset = () => {
    if (stageList[0]) {
      onSelectStage?.(stageList[0].id);
    }
  };

  const sessionBadge = listening ? (
    <Badge variant="outline" className="flex items-center gap-1 text-xs text-emerald-600 border-emerald-200">
      <Activity className="h-3 w-3" /> Live conversation
    </Badge>
  ) : (
    <Badge variant="outline" className="flex items-center gap-1 text-xs text-slate-600 border-slate-200">
      <PauseCircle className="h-3 w-3" /> Session idle
    </Badge>
  );

  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white p-4 shadow-sm", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Live Stage Monitor</p>
          <h3 className="text-lg font-semibold text-slate-900">Track greeting-to-urgency flow</h3>
        </div>
        {sessionBadge}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {stageList.map((stage) => {
          const status = stage.status && STAGE_STATUS_STYLES[stage.status] ? stage.status : "info";
          const isActive = resolvedActiveStage?.id === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => handleStageClick(stage.id)}
              className={cn(
                "flex min-w-[140px] flex-col rounded-2xl border px-3 py-2 text-left text-xs transition",
                STAGE_STATUS_STYLES[status],
                isActive && "ring-2 ring-offset-2 ring-indigo-200" 
              )}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {stage.id}
              </span>
              <span className="text-sm font-semibold text-slate-900">{stage.name}</span>
              <span className="text-[11px] text-slate-500">
                {stage.recommendedAction ? `Action: ${stage.recommendedAction}` : stage.actions}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
        {resolvedActiveStage ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p className="text-xs font-semibold text-slate-500">Active stage</p>
            <p className="text-base font-semibold text-slate-900">
              {resolvedActiveStage.id} - {resolvedActiveStage.name}
            </p>
            <p className="text-xs text-slate-500">{resolvedActiveStage.baselineScript}</p>
            {resolvedActiveStage.observedIntents?.length > 0 && (
              <p className="text-xs text-slate-500">
                Detected intents: {resolvedActiveStage.observedIntents.join(", ")}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No stages available. Upload a script to generate coverage.</p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={handleAdvance} disabled={!nextStage}>
            {nextStage ? `Advance to ${nextStage.id}` : "End of stage plan"}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleReset} disabled={!stageList.length}>
            Reset to {stageList[0]?.id || "start"}
          </Button>
        </div>
      </div>
    </div>
  );
}