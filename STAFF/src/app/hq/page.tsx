import { PageHeader, EmptyState, Card, CardTitle, CardDescription } from "@/components/ui";

export default function HqOverviewPage() {
  return (
    <>
      <PageHeader
        eyebrow="Staff"
        title="Overview"
        description="Operational summary. Modules will be wired in later phases; no business data is fabricated here."
      />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardTitle>Orders today</CardTitle>
          <CardDescription>Not yet connected to a data source.</CardDescription>
          <EmptyState title="No data" description="Persistence is not enabled in this build." className="mt-3" />
        </Card>
        <Card>
          <CardTitle>Revenue</CardTitle>
          <CardDescription>Not yet connected to a data source.</CardDescription>
          <EmptyState title="No data" description="Finance persistence is pending." className="mt-3" />
        </Card>
        <Card>
          <CardTitle>Inventory alerts</CardTitle>
          <CardDescription>Not yet connected to a data source.</CardDescription>
          <EmptyState title="No data" description="Inventory persistence is pending." className="mt-3" />
        </Card>
      </div>
    </>
  );
}
