import { KanbanBoard } from "@/components/kanban/kanban-board";
import { PageHeader } from "@/components/layout/page-header";
import { CreateJobDialog } from "@/components/kanban/create-job-dialog";

export default function Home() {
  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        title="Jobs Board"
        description="Track jobs from quote to delivery"
        action={<CreateJobDialog />}
      />
      <div className="flex-1 overflow-hidden p-6">
        <KanbanBoard />
      </div>
    </div>
  );
}
