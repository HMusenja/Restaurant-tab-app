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
  availabilityTimes: ["lunch", "dinner"],
};

const AVAILABILITY_OPTIONS = ["breakfast", "lunch", "dinner"];

const themedField =
  "rounded-2xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/35";

const toNullableNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

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
        availabilityTimes: Array.isArray(item?.availabilityTimes) && item.availabilityTimes.length
          ? item.availabilityTimes
          : ["lunch", "dinner"],
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
      setUploadErr("");
    } catch {
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

  const handleNutritionChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      nutrition: {
        ...prev.nutrition,
        [key]: value,
      },
    }));
  };

  const handleAvailabilityToggle = (slot) => {
    setForm((prev) => {
      const exists = prev.availabilityTimes.includes(slot);

      return {
        ...prev,
        availabilityTimes: exists
          ? prev.availabilityTimes.filter((item) => item !== slot)
          : [...prev.availabilityTimes, slot],
      };
    });
  };

  const handleSave = async () => {
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim?.() || "",
      category: form.category.trim(),
      priceCents: Number(form.priceCents),
      imageUrl: form.imageUrl?.trim?.() || "",
      available: !!form.available,

      nutrition: {
        calories: toNullableNumber(form.nutrition.calories),
        protein: toNullableNumber(form.nutrition.protein),
        carbs: toNullableNumber(form.nutrition.carbs),
        fat: toNullableNumber(form.nutrition.fat),
        sugar: toNullableNumber(form.nutrition.sugar),
        salt: toNullableNumber(form.nutrition.salt),
      },

      ingredients: String(form.ingredients || "")
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean),

      allergens: String(form.allergens || "")
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean),

      availabilityTimes:
        form.availabilityTimes.length > 0
          ? form.availabilityTimes
          : ["lunch", "dinner"],
    };

    if (item?._id) await update(item._id, payload, { sync: true });
    else await create(payload, { sync: true });

    onSuccess?.();
    onOpenChange(false);
  };

  const heroImage = previewUrl || form.imageUrl;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-hidden border-l border-border bg-card p-0 text-card-foreground sm:max-w-lg">
        <div className="sticky top-0 z-10 border-b border-border bg-card px-6 py-4">
          <SheetHeader>
            <SheetTitle>{item ? "Edit Menu Item" : "Create Menu Item"}</SheetTitle>
            <SheetDescription className="text-muted-foreground">
              Manage pricing, availability, nutrition, ingredients, allergens, and image.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="h-[calc(100vh-80px)] space-y-6 overflow-y-auto px-6 py-5">
          {/* Image */}
          <div className="space-y-3">
            <Label className="font-semibold">Image</Label>

            <div className="rounded-3xl border border-border bg-muted/30 p-4">
              <div className="flex gap-4">
                <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-border bg-secondary">
                  {heroImage ? (
                    <img
                      src={heroImage}
                      alt="Menu preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-muted-foreground">
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
                    <div className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background px-4 py-2 text-sm transition hover:bg-muted/40">
                      <UploadCloud className="h-4 w-4" />
                      {file ? "Change file" : "Choose file"}
                    </div>
                  </label>

                  <Button
                    type="button"
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="w-full rounded-2xl"
                  >
                    {uploading ? "Uploading…" : "Upload"}
                  </Button>

                  {heroImage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="w-full rounded-xl"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  )}

                  {uploadErr && (
                    <div className="text-sm text-destructive">{uploadErr}</div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <Label className="text-xs text-muted-foreground">
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
                  className={themedField}
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
              className={themedField}
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
              className={cn(themedField, "min-h-[96px]")}
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
                className={themedField}
              />

              <Input
                type="number"
                min="0"
                placeholder="Price (cents)"
                value={form.priceCents}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    priceCents: e.target.value,
                  }))
                }
                className={themedField}
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/30 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-foreground">Available</div>
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

          <Separator className="bg-border" />

          {/* Nutrition */}
          <div className="space-y-4">
            <Label className="font-semibold">Nutrition</Label>

            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                min="0"
                placeholder="Calories (kcal)"
                value={form.nutrition.calories}
                onChange={(e) => handleNutritionChange("calories", e.target.value)}
                className={themedField}
              />
              <Input
                type="number"
                min="0"
                placeholder="Protein (g)"
                value={form.nutrition.protein}
                onChange={(e) => handleNutritionChange("protein", e.target.value)}
                className={themedField}
              />
              <Input
                type="number"
                min="0"
                placeholder="Carbs (g)"
                value={form.nutrition.carbs}
                onChange={(e) => handleNutritionChange("carbs", e.target.value)}
                className={themedField}
              />
              <Input
                type="number"
                min="0"
                placeholder="Fat (g)"
                value={form.nutrition.fat}
                onChange={(e) => handleNutritionChange("fat", e.target.value)}
                className={themedField}
              />
              <Input
                type="number"
                min="0"
                placeholder="Sugar (g)"
                value={form.nutrition.sugar}
                onChange={(e) => handleNutritionChange("sugar", e.target.value)}
                className={themedField}
              />
              <Input
                type="number"
                min="0"
                step="0.1"
                placeholder="Salt (g)"
                value={form.nutrition.salt}
                onChange={(e) => handleNutritionChange("salt", e.target.value)}
                className={themedField}
              />
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Ingredients & Allergens */}
          <div className="space-y-4">
            <Label className="font-semibold">Ingredients & Allergens</Label>

            <Textarea
              placeholder="Ingredients (comma separated)"
              value={form.ingredients}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  ingredients: e.target.value,
                }))
              }
              className={cn(themedField, "min-h-[90px]")}
            />

            <Textarea
              placeholder="Allergens (comma separated)"
              value={form.allergens}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  allergens: e.target.value,
                }))
              }
              className={cn(themedField, "min-h-[90px]")}
            />
          </div>

          <Separator className="bg-border" />

          {/* Availability Times */}
          {/* <div className="space-y-4">
            <Label className="font-semibold">Availability Times</Label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {AVAILABILITY_OPTIONS.map((slot) => {
                const active = form.availabilityTimes.includes(slot);

                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleAvailabilityToggle(slot)}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-sm font-medium capitalize transition",
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground">
              Select when this item should appear on the menu.
            </p>
          </div> */}

          {/* Sticky footer */}
          <div className="sticky bottom-0 bg-card pt-4 pb-2 backdrop-blur">
            <Button
              onClick={handleSave}
              className="w-full rounded-2xl"
              disabled={!canSave || saving || uploading}
            >
              {uploading ? "Uploading image…" : saving ? "Saving…" : "Save"}
            </Button>

            {!canSave && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Fill name, category, and price before saving.
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}