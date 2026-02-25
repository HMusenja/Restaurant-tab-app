// src/components/admin/finance/FinanceTabsSection.jsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RecentList from "./RecentList";
import Pagination from "./Pagination";

export default function FinanceTabsSection({
  loading,
  activeTab,
  setActiveTab,
  paidRows,
  closedRows,
  paidPage,
  closedPage,
  paidTotalPages,
  closedTotalPages,
  setPaidPage,
  setClosedPage,
}) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="paid">Paid</TabsTrigger>
        <TabsTrigger value="closed">Closed</TabsTrigger>
      </TabsList>

      <TabsContent value="paid">
        <Card>
          <CardHeader>
            <CardTitle>Recent Paid</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : (
              <>
                <RecentList rows={paidRows} emptyLabel="No PAID tabs." />
                <Pagination
                  page={paidPage}
                  totalPages={paidTotalPages}
                  onPrev={() => setPaidPage((p) => p - 1)}
                  onNext={() => setPaidPage((p) => p + 1)}
                />
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="closed">
        <Card>
          <CardHeader>
            <CardTitle>Recent Closed</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : (
              <>
                <RecentList rows={closedRows} emptyLabel="No CLOSED tabs." />
                <Pagination
                  page={closedPage}
                  totalPages={closedTotalPages}
                  onPrev={() => setClosedPage((p) => p - 1)}
                  onNext={() => setClosedPage((p) => p + 1)}
                />
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}