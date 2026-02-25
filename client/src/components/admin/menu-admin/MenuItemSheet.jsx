import { useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, X, UploadCloud } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { uploadToCloudinary } from "@/utils/cloudinaryUpload";
import { useMenu } from "@/contexts/MenuContext";
import { cn } from "@/lib/utils";

const DEFAULT_FORM = {
  name: "",
  description: "",
  category: "",
  priceCents: "",
  imageUrl: "",
  available: true,
  nutrition: {
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    sugar: "",
    salt: "",
  },
  ingredients: "",
  allergens: "",
};

const darkField =
  "rounded-2xl bg-[hsl(220,20%,10%)]/80 border border-[hsl(40,20%,95%)/12%] text-[hsl(40,20%,92%)] placeholder:text-[hsl(40,10%,58%)] placeholder:opacity-100 focus-visible:ring-2 focus-visible:ring-primary/35";

export default function MenuItemSheet({ open, onOpenChange, item, onSuccess }) {
  const { create, update, saving } = useMenu();

  const [form, setForm] = useState(DEFAULT_FORM);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  const previewUrl = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!open) return;

    if (item) {
      setForm({
        name: item?.name || "",
        description: item?.description || "",
        category: item?.category || "",
        priceCents: String(item?.priceCents ?? ""),
        imageUrl: item?.imageUrl || "",
        available: item?.available !== false,
        nutrition: {
          calories: item?.nutrition?.calories ?? "",
          protein: item?.nutrition?.protein ?? "",
          carbs: item?.nutrition?.carbs ?? "",
          fat: item?.nutrition?.fat ?? "",
          sugar: item?.nutrition?.sugar ?? "",
          salt: item?.nutrition?.salt ?? "",
        },
        ingredients: Array.isArray(item?.ingredients)
          ? item.ingredients.join(", ")
          : item?.ingredients || "",
        allergens: Array.isArray(item?.allergens)
          ? item.allergens.join(", ")
          : item?.allergens || "",
      });
    } else {
      setForm(DEFAULT_FORM);
    }

    setFile(null);
    setUploading(false);
    setUploadErr("");
  }, [open, item]);

  const canSave =
    !uploading &&
    form.name.trim() &&
    form.category.trim() &&
    String(form.priceCents).trim() !== "";

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const out = await uploadToCloudinary(file, {
        folder: "restaurant-tab-app/menu",
      });

      setForm((prev) => ({
        ...prev,
        imageUrl: out.secureUrl,
      }));
    } catch (e) {
      setUploadErr("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  const handleRemoveImage = () => {
    setFile(null);
    setForm((prev) => ({ ...prev, imageUrl: "" }));
    setUploadErr("");
  };

  const handleSave = async () => {
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim?.() || "",
      category: form.category.trim(),
      priceCents: Number(form.priceCents),
      imageUrl: form.imageUrl?.trim?.() || "",
      available: !!form.available,
      nutrition: form.nutrition || {},
      ingredients: String(form.ingredients || "")
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean),
      allergens: String(form.allergens || "")
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean),
    };

    if (item?._id) await update(item._id, payload, { sync: true });
    else await create(payload, { sync: true });

    onSuccess?.();
    onOpenChange(false);
  };

  const heroImage = previewUrl || form.imageUrl;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-lg p-0 overflow-hidden
        bg-[hsl(220,20%,8%)/95%]
        border-l border-[hsl(40,20%,95%)/10%]
        backdrop-blur-xl text-[hsl(40,20%,95%)]"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-[hsl(40,20%,95%)/10%] bg-[hsl(220,20%,8%)/95%] px-6 py-4">
          <SheetHeader>
            <SheetTitle>
              {item ? "Edit Menu Item" : "Create Menu Item"}
            </SheetTitle>
            <SheetDescription className="text-[hsl(40,10%,60%)]">
              Manage pricing, availability, nutrition and image.
            </SheetDescription>
          </SheetHeader>
          {/* ✅ Force-close button */}
          {/* <SheetClose asChild>
            <button
              type="button"
              aria-label="Close"
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl
                 text-[hsl(40,10%,75%)] hover:bg-white/5 hover:text-[hsl(40,20%,95%)]
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <X className="h-5 w-5" />
            </button>
          </SheetClose> */}
        </div>

        <div className="px-6 py-5 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
          {/* Image */}
          <div className="space-y-3">
            <Label className="font-semibold">Image</Label>

            <div className="rounded-3xl border border-[hsl(40,20%,95%)/10%] bg-[hsl(220,20%,9%)]/70 backdrop-blur-xl p-4">
              <div className="flex gap-4">
                <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-[hsl(40,20%,95%)/10%] bg-[hsl(220,20%,12%)]">
                  {heroImage ? (
                    <img
                      src={heroImage}
                      alt="Menu preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-[hsl(40,10%,60%)]">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    <div className="cursor-pointer rounded-2xl border border-dashed border-[hsl(40,20%,95%)/20%] bg-[hsl(220,20%,12%)] px-4 py-2 text-sm flex items-center justify-center gap-2 hover:bg-[hsl(220,20%,14%)] transition">
                      <UploadCloud className="h-4 w-4" />
                      {file ? "Change file" : "Choose file"}
                    </div>
                  </label>

                  <Button
                    type="button"
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="rounded-2xl w-full"
                  >
                    {uploading ? "Uploading…" : "Upload"}
                  </Button>

                  {heroImage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="rounded-xl w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}

                  {uploadErr && (
                    <div className="text-sm text-destructive">{uploadErr}</div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <Label className="text-xs text-[hsl(40,10%,60%)]">
                  Or paste image URL
                </Label>
                <Input
                  placeholder="https://..."
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      imageUrl: e.target.value,
                    }))
                  }
                  className={darkField}
                />
              </div>
            </div>
          </div>

          {/* Basics */}
          <div className="space-y-4">
            <Label className="font-semibold">Basics</Label>

            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className={darkField}
            />

            <Textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  description: e.target.value,
                }))
              }
              className={cn(darkField, "min-h-[96px]")}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Category"
                value={form.category}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    category: e.target.value,
                  }))
                }
                className={darkField}
              />

              <Input
                type="number"
                placeholder="Price (cents)"
                value={form.priceCents}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    priceCents: e.target.value,
                  }))
                }
                className={darkField}
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-[hsl(40,20%,95%)/10%] bg-[hsl(220,20%,12%)] px-4 py-3">
              <div>
                <div className="text-sm font-medium">Available</div>
                <div className="text-xs text-[hsl(40,10%,60%)]">
                  Hide item from guest menu when disabled
                </div>
              </div>
              <Switch
                checked={!!form.available}
                onCheckedChange={(v) =>
                  setForm((p) => ({ ...p, available: v }))
                }
              />
            </div>
          </div>

          <Separator className="bg-[hsl(40,20%,95%)/10%]" />

          {/* Sticky footer */}
          <div className="sticky bottom-0 bg-[hsl(220,20%,8%)/95] backdrop-blur-xl pt-4 pb-2">
            <Button
              onClick={handleSave}
              className="w-full rounded-2xl"
              disabled={!canSave || saving || uploading}
            >
              {uploading ? "Uploading image…" : saving ? "Saving…" : "Save"}
            </Button>

            {!canSave && (
              <p className="mt-2 text-center text-xs text-[hsl(40,10%,55%)]">
                Fill name, category, and price before saving.
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
