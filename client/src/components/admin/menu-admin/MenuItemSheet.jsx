import { useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, X, UploadCloud } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { uploadToCloudinary } from "@/utils/cloudinaryUpload";
import { useMenu } from "@/contexts/MenuContext";

const DEFAULT_FORM = {
  name: "",
  description: "",
  category: "",
  priceCents: "", // keep as string in form
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

function toNumberOrNull(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function MenuItemSheet({ open, onOpenChange, item, onSuccess }) {
  const { create, update, saving } = useMenu();

  const [form, setForm] = useState(DEFAULT_FORM);

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  // local preview for selected file (before upload)
  const previewUrl = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Initialize form when opening / editing
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
      console.log("✅ Cloudinary upload result:", out);

      setForm((prev) => {
        const next = { ...prev, imageUrl: out.secureUrl };
        console.log("✅ form.imageUrl set to:", next.imageUrl);
        return next;
      });
    } catch (e) {
      console.log("❌ Cloudinary upload error:", e);
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
      <SheetContent className="w-full sm:max-w-lg p-0 overflow-hidden">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur px-6 py-4">
          <SheetHeader>
            <SheetTitle className="text-lg">
              {item ? "Edit Menu Item" : "Create Menu Item"}
            </SheetTitle>

            <SheetDescription className="sr-only">
              Form for creating or editing a restaurant menu item, including
              pricing, availability, nutrition, ingredients, and image upload.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="px-6 py-5 space-y-6 overflow-y-auto h-[calc(100vh-72px)]">
          {/* Image uploader */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Image</Label>

              {(heroImage || file) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="rounded-xl"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>

            <div className="rounded-3xl border border-border/60 bg-card p-3">
              <div className="flex gap-4">
                {/* Preview */}
                <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-secondary">
                  {heroImage ? (
                    <img
                      src={heroImage}
                      alt="Menu preview"
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Upload a square or landscape photo. We’ll store a stable
                    Cloudinary URL.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                      <div className="cursor-pointer rounded-2xl border border-dashed border-border/70 bg-background px-4 py-2 text-sm flex items-center justify-center gap-2 hover:bg-secondary/60 transition-colors">
                        <UploadCloud className="h-4 w-4" />
                        {file ? "Change file" : "Choose file"}
                      </div>
                    </label>

                    <Button
                      type="button"
                      onClick={handleUpload}
                      disabled={!file || uploading}
                      className="rounded-2xl"
                    >
                      {uploading ? "Uploading…" : "Upload"}
                    </Button>
                  </div>

                  {uploadErr ? (
                    <div className="text-sm text-destructive">{uploadErr}</div>
                  ) : null}
                </div>
              </div>

              <div className="mt-3">
                <Label className="text-xs text-muted-foreground">
                  Or paste image URL
                </Label>
                <Input
                  placeholder="https://..."
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, imageUrl: e.target.value }))
                  }
                  className="mt-1 rounded-2xl"
                />
              </div>
            </div>
          </div>

          {/* Basics */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Basics</Label>

            <Input
              placeholder="Name (e.g. Jollof Rice)"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="rounded-2xl"
            />

            <Textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              className="rounded-2xl min-h-[96px]"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Category (e.g. Mains)"
                value={form.category}
                onChange={(e) =>
                  setForm((p) => ({ ...p, category: e.target.value }))
                }
                className="rounded-2xl"
              />

              <Input
                type="number"
                placeholder="Price (cents)"
                value={form.priceCents}
                onChange={(e) =>
                  setForm((p) => ({ ...p, priceCents: e.target.value }))
                }
                className="rounded-2xl"
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Available</div>
                <div className="text-xs text-muted-foreground">
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

          <Separator />

          {/* Nutrition */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Nutrition</Label>

            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Calories"
                value={form.nutrition.calories}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    nutrition: { ...p.nutrition, calories: e.target.value },
                  }))
                }
                className="rounded-2xl"
              />
              <Input
                type="number"
                placeholder="Protein (g)"
                value={form.nutrition.protein}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    nutrition: { ...p.nutrition, protein: e.target.value },
                  }))
                }
                className="rounded-2xl"
              />
              <Input
                type="number"
                placeholder="Carbs (g)"
                value={form.nutrition.carbs}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    nutrition: { ...p.nutrition, carbs: e.target.value },
                  }))
                }
                className="rounded-2xl"
              />
              <Input
                type="number"
                placeholder="Fat (g)"
                value={form.nutrition.fat}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    nutrition: { ...p.nutrition, fat: e.target.value },
                  }))
                }
                className="rounded-2xl"
              />
              <Input
                type="number"
                placeholder="Sugar (g)"
                value={form.nutrition.sugar}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    nutrition: { ...p.nutrition, sugar: e.target.value },
                  }))
                }
                className="rounded-2xl"
              />
              <Input
                type="number"
                step="0.1"
                placeholder="Salt (g)"
                value={form.nutrition.salt}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    nutrition: { ...p.nutrition, salt: e.target.value },
                  }))
                }
                className="rounded-2xl"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Leave blank if unknown — we store empty fields as null.
            </p>
          </div>

          <Separator />

          {/* Ingredients / Allergens */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">
              Ingredients & Allergens
            </Label>

            <Input
              placeholder="Ingredients (comma separated)"
              value={form.ingredients}
              onChange={(e) =>
                setForm((p) => ({ ...p, ingredients: e.target.value }))
              }
              className="rounded-2xl"
            />

            <Input
              placeholder="Allergens (comma separated)"
              value={form.allergens}
              onChange={(e) =>
                setForm((p) => ({ ...p, allergens: e.target.value }))
              }
              className="rounded-2xl"
            />
          </div>

          {/* Sticky footer actions */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur pt-3 pb-1">
            <Button
              onClick={handleSave}
              className="w-full rounded-2xl"
              disabled={!canSave || saving || uploading}
            >
              {uploading ? "Uploading image…" : saving ? "Saving…" : "Save"}
            </Button>

            {!canSave && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Fill in name, category, and price before saving.
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
