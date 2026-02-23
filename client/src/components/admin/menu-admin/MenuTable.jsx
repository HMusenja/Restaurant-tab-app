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


export default function MenuTable({
  items,
  loading,
  onEdit,

}) {

  const { update, remove,saving, deleting } = useMenu();

  const toggleAvailability = async (item) => {
await update(item._id, { available: !item.available });


  };

  const deleteItem = async (item) => {
    if (!confirm("Delete this item?")) return;
   await remove(item._id);


  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Available</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {items.map((item) => (
            <TableRow key={item._id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell>
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
                  onClick={() => onEdit(item)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteItem(item._id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
