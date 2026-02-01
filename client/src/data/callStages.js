export const CALL_STAGE_BLUEPRINT = [
  {
    id: "S1",
    name: "Greeting & Rapport",
    baselineScript: "My name is Sarah, how are you doing today?",
    intents: ["Positive greeting", "Neutral response", "Hostile response", "Silence", "Abuse", "Honeypot"],
    actions: "Advance to S2 or terminate for abuse/honeypot.",
    defaultAction: "advance",
  },
  {
    id: "S2",
    name: "Context / Reason for Call",
    baselineScript: "Your name came across my desk as possibly having back tax issues that you may need help resolving.",
    intents: ["Acknowledge", "Confused", "Denial", "Abuse", "Honeypot"],
    actions: "Advance to S3, clarify once, or terminate.",
    defaultAction: "clarify",
  },
  {
    id: "S3",
    name: "Debt Threshold Qualification",
    baselineScript: "Do you still owe over five thousand dollars in unfiled or unresolved back taxes?",
    intents: ["Over 5K", "Under 5K", "Unsure", "Refuse", "Abuse", "Honeypot"],
    actions: "Advance to S4 if qualified, or terminate.",
    defaultAction: "advance",
  },
  {
    id: "S4",
    name: "IRS Action / Urgency Check",
    baselineScript: "Have you received any letters from the IRS, or actions like garnishments, levies, or liens?",
    intents: ["Enforcement yes", "No", "Unsure", "Abuse", "Honeypot"],
    actions: "Advance to next stage group or terminate.",
    defaultAction: "advance",
  },
];
