import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2, Pencil } from "lucide-react";
import { useMenu } from "@/contexts/MenuContext";
import { cn } from "@/lib/utils";

export default function MenuTable({ items, loading, onEdit }) {
  const { update, remove } = useMenu();

  const toggleAvailability = async (item) => {
    await update(item._id, { available: !item.available });
  };

  const deleteItem = async (item) => {
    if (!confirm("Delete this item?")) return;
    await remove(item._id);
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Loading menu…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card/85 backdrop-blur-xl">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground">Name</TableHead>
            <TableHead className="text-muted-foreground">Category</TableHead>
            <TableHead className="text-muted-foreground">Price</TableHead>
            <TableHead className="text-muted-foreground">Available</TableHead>
            <TableHead className="text-right text-muted-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item._id}
              className="border-b border-border/60 transition-colors hover:bg-muted/40"
            >
              <TableCell className="font-medium text-foreground">
                {item.name}
              </TableCell>

              <TableCell className="text-muted-foreground">
                {item.category}
              </TableCell>

              <TableCell className="font-semibold text-primary">
                € {(item.priceCents / 100).toFixed(2)}
              </TableCell>

              <TableCell>
                <Switch
                  checked={item.available}
                  onCheckedChange={() => toggleAvailability(item)}
                />
              </TableCell>

              <TableCell className="space-x-2 text-right">
                <Button
                  size="sm"
                  variant="outline"
                  
                  onClick={() => onEdit(item)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                 
                  onClick={() => deleteItem(item)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {items.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-12 text-center text-sm text-muted-foreground"
              >
                No menu items found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}