"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useJob, useDeleteJob } from "@/lib/hooks/use-jobs";
import type { KanbanJob, JobStatus } from "@/types/api";

const statusColors: Record<JobStatus, string> = {
  quote: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  delivered: "bg-purple-100 text-purple-700",
};

const statusLabels: Record<JobStatus, string> = {
  quote: "Quote",
  in_progress: "In Progress",
  completed: "Completed",
  delivered: "Delivered",
};

interface JobDetailSheetProps {
  job: KanbanJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobDetailSheet({ job, open, onOpenChange }: JobDetailSheetProps) {
  const { data: detail, isLoading } = useJob(job?.id ?? "");
  const deleteJob = useDeleteJob();

  if (!job) return null;

  function handleDelete() {
    if (!job) return;
    if (!confirm(`Delete job ${job.job_number}? This cannot be undone.`)) return;
    deleteJob.mutate(job.id, {
      onSuccess: () => onOpenChange(false),
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            <span className="font-mono">{job.job_number}</span>
          </SheetTitle>
          <SheetDescription>{job.customer_name}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-4">
          <div className="flex items-center gap-2">
            <Badge className={statusColors[job.status]}>
              {statusLabels[job.status]}
            </Badge>
            {job.total_price && (
              <Badge variant="secondary">${job.total_price}</Badge>
            )}
          </div>

          {job.notes && (
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1">Notes</p>
              <p className="text-sm">{job.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            {job.expected_completion && (
              <div>
                <p className="text-xs font-medium text-zinc-500">Completion</p>
                <p>{new Date(job.expected_completion).toLocaleDateString()}</p>
              </div>
            )}
            {job.expected_delivery && (
              <div>
                <p className="text-xs font-medium text-zinc-500">Delivery</p>
                <p>{new Date(job.expected_delivery).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <p className="text-xs font-medium text-zinc-500 mb-2">Structures</p>
            {isLoading ? (
              <p className="text-sm text-zinc-400">Loading...</p>
            ) : detail?.structures && detail.structures.length > 0 ? (
              <div className="space-y-2">
                {detail.structures.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-md border p-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {s.template_name ?? s.custom_name ?? "Unnamed"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Qty: {s.quantity}
                        {s.unit_price && ` · $${s.unit_price}`}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {s.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">No structures added yet.</p>
            )}
          </div>

          <Separator />

          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteJob.isPending}
            className="w-full"
          >
            {deleteJob.isPending ? "Deleting..." : "Delete Job"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
