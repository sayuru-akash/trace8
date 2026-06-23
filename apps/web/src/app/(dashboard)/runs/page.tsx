import { PlayCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTransition } from "@/components/shared/page-transition";

export default function RunsPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Runs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View all test runs across your projects.
          </p>
        </div>
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<PlayCircle className="h-12 w-12" />}
              title="No runs yet"
              description="Test runs will appear here once you start using the CLI."
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
