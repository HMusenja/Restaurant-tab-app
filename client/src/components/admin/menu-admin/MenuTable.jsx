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

export default function MenuTable({
  items,
  loading,
  onEdit,
}) {
  const { update, remove, saving, deleting } = useMenu();

  const toggleAvailability = async (item) => {
    await update(item._id, { available: !item.available });
  };

  const deleteItem = async (item) => {
    if (!confirm("Delete this item?")) return;
    await remove(item._id);
  };

  if (loading)
    return (
      <div className="py-12 text-center text-sm text-[hsl(40,10%,60%)]">
        Loading menu…
      </div>
    );

  return (
    <div className="rounded-3xl border border-[hsl(40,20%,95%)/10%] 
      bg-[hsl(220,20%,9%)]/70 backdrop-blur-xl overflow-hidden">

      <Table>
        <TableHeader>
          <TableRow className="border-b border-[hsl(40,20%,95%)/10%]">
            <TableHead className="text-[hsl(40,10%,60%)]">Name</TableHead>
            <TableHead className="text-[hsl(40,10%,60%)]">Category</TableHead>
            <TableHead className="text-[hsl(40,10%,60%)]">Price</TableHead>
            <TableHead className="text-[hsl(40,10%,60%)]">Available</TableHead>
            <TableHead className="text-right text-[hsl(40,10%,60%)]">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item._id}
              className="border-b border-[hsl(40,20%,95%)/5%] 
              hover:bg-[hsl(40,20%,95%)/4%] transition-colors"
            >
              <TableCell className="font-medium text-[hsl(40,20%,92%)]">
                {item.name}
              </TableCell>

              <TableCell className="text-[hsl(40,10%,70%)]">
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

              <TableCell className="text-right space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-r "
                  onClick={() => onEdit(item)}
                >
                  <Pencil className="w-4 h-4 text-black" />
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  className="rounded-l"
                  onClick={() => deleteItem(item)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {items.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-12 text-sm text-[hsl(40,10%,60%)]"
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