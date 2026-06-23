import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTransition } from "@/components/shared/page-transition";

export default function FlakyTestsPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Flaky Tests
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tests that intermittently pass and fail.
          </p>
        </div>
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<AlertTriangle className="h-12 w-12" />}
              title="No flaky tests detected"
              description="Flaky tests will be flagged here as they're discovered."
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
