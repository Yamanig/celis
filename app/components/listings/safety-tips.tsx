import { Card, CardContent } from "~/components/ui/card";
import { Shield, Users, Eye, CreditCard, Building2 } from "lucide-react";

const tips = [
  {
    icon: Eye,
    text: "It's safer not to pay ahead for inspections.",
  },
  {
    icon: Users,
    text: "Ask friends or somebody you trust to accompany you for viewing.",
  },
  {
    icon: Building2,
    text: "Look around the apartment to ensure it meets your expectations.",
  },
  {
    icon: Shield,
    text: "Don't pay beforehand if they won't let you move in immediately.",
  },
  {
    icon: CreditCard,
    text: "Verify that the account details belong to the right property owner before initiating payment.",
  },
];

export function SafetyTips() {
  return (
    <Card className="border-celis-border bg-celis-surface-base">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-celis-primary" />
          <h2 className="font-semibold text-celis-ink">Safety tips</h2>
        </div>
        <ul className="space-y-3">
          {tips.map((tip, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 text-sm text-celis-ink-secondary"
            >
              <tip.icon className="mt-0.5 h-4 w-4 shrink-0 text-celis-primary" />
              <span>{tip.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
