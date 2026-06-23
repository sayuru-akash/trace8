import { Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTransition } from "@/components/shared/page-transition";

export default function AlertsPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Alerts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure alerts for test failures and flaky tests.
          </p>
        </div>
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<Bell className="h-12 w-12" />}
              title="No alerts configured"
              description="Set up Slack or webhook alerts to get notified of failures."
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
