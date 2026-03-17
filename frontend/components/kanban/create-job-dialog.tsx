"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCustomers } from "@/lib/hooks/use-customers";
import { useCreateJob } from "@/lib/hooks/use-jobs";

export function CreateJobDialog() {
  const [open, setOpen] = useState(false);
  const { data: customerList } = useCustomers();
  const createJob = useCreateJob();

  const [customerId, setCustomerId] = useState("");
  const [expectedCompletion, setExpectedCompletion] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [notes, setNotes] = useState("");

  function resetForm() {
    setCustomerId("");
    setExpectedCompletion("");
    setExpectedDelivery("");
    setTotalPrice("");
    setNotes("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) return;

    createJob.mutate(
      {
        customer_id: customerId,
        expected_completion: expectedCompletion || undefined,
        expected_delivery: expectedDelivery || undefined,
        total_price: totalPrice || undefined,
        notes: notes || undefined,
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
      <DialogTrigger render={<Button size="sm" className="bg-brand-green hover:bg-brand-green-dark text-primary-foreground" />}>
        New Job
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customerList?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="completion">Expected Completion</Label>
              <Input
                id="completion"
                type="date"
                value={expectedCompletion}
                onChange={(e) => setExpectedCompletion(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery">Expected Delivery</Label>
              <Input
                id="delivery"
                type="date"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Total Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Job description or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!customerId || createJob.isPending}>
              {createJob.isPending ? "Creating..." : "Create Job"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
