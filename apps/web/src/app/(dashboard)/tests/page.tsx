import { FlaskConical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTransition } from "@/components/shared/page-transition";

export default function TestsPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Tests
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse all discovered tests and their history.
          </p>
        </div>
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<FlaskConical className="h-12 w-12" />}
              title="No tests discovered"
              description="Tests will appear here after your first run."
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
