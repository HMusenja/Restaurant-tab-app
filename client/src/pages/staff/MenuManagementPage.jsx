import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMenu } from "@/contexts/MenuContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import MenuItemSheet from "@/components/admin/menu-admin/MenuItemSheet";
import MenuTable from "@/components/admin/menu-admin/MenuTable";

const API = "/api/menu"; // adjust if needed

export default function MenuManagementPage() {
  const { user } = useAuth();
    const { items, loading, loadMenu, refresh } = useMenu();

  if (user?.role !== "admin") {
    return <Navigate to="/staff" replace />;
  }



  const [query, setQuery] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openSheet, setOpenSheet] = useState(false);


  useEffect(() => {
    loadMenu({ admin: true });
  }, [loadMenu]);


  const filtered = useMemo(() => {
    let result = items;

    if (onlyAvailable) {
      result = result.filter((i) => i.available);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [items, query, onlyAvailable]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Menu Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage items, pricing, and nutrition.
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedItem(null);
            setOpenSheet(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </Card>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search menu..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="md:max-w-sm"
        />

        <div className="flex items-center gap-2">
          <Switch
            checked={onlyAvailable}
            onCheckedChange={setOnlyAvailable}
          />
          <span className="text-sm">Available only</span>
        </div>
      </div>

      {/* Table */}
      <MenuTable
        items={filtered}
        loading={loading}
        onEdit={(item) => {
          setSelectedItem(item);
          setOpenSheet(true);
        }}
        onRefresh={loadMenu}
      />

      <MenuItemSheet
        open={openSheet}
        onOpenChange={setOpenSheet}
        item={selectedItem}
        onSuccess={loadMenu}
      />
    </div>
  );
}
