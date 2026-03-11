"use client";

import { useState } from "react";
import { useTemplates, useCreateTemplate } from "@/lib/hooks/use-templates";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

function CreateTemplateDialog() {
  const [open, setOpen] = useState(false);
  const createTemplate = useCreateTemplate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [category, setCategory] = useState("");

  function resetForm() {
    setName("");
    setDescription("");
    setBasePrice("");
    setCategory("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !category.trim()) return;

    createTemplate.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        base_price: basePrice || undefined,
        category: category.trim(),
      },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        New Template
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Template</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tpl-name">Name *</Label>
            <Input
              id="tpl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="8x10 Garden Shed"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tpl-category">Category *</Label>
            <Input
              id="tpl-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="shed"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tpl-price">Base Price</Label>
            <Input
              id="tpl-price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tpl-desc">Description</Label>
            <Textarea
              id="tpl-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Standard garden shed with..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || !category.trim() || createTemplate.isPending}
            >
              {createTemplate.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function TemplatesPage() {
  const { data: templateList, isLoading } = useTemplates();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Structure Templates</h1>
        <CreateTemplateDialog />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-5 w-40 bg-zinc-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templateList && templateList.length > 0 ? (
        <div className="space-y-3">
          {templateList.map((template) => (
            <Card key={template.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{template.name}</p>
                    <Badge variant="secondary" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-zinc-500 mt-0.5">
                    {template.base_price && <span>${template.base_price}</span>}
                    {template.description && <span>{template.description}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-zinc-500 text-center py-12">
          No templates yet. Create one to use in jobs.
        </p>
      )}
    </div>
  );
}
