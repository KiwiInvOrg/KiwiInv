"use client";

import { useCustomers, useDeleteCustomer } from "@/lib/hooks/use-customers";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export default function CustomersPage() {
  const { data: customers, isLoading } = useCustomers();
  const deleteCustomer = useDeleteCustomer();

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete customer "${name}"? This will fail if they have jobs.`)) return;
    deleteCustomer.mutate(id);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Customers</h1>
        <CustomerFormDialog />
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
      ) : customers && customers.length > 0 ? (
        <div className="space-y-3">
          {customers.map((customer) => (
            <Card key={customer.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <div className="flex gap-4 text-sm text-zinc-500 mt-0.5">
                    {customer.email && <span>{customer.email}</span>}
                    {customer.phone && <span>{customer.phone}</span>}
                    {customer.address && <span>{customer.address}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CustomerFormDialog
                    customer={customer}
                    trigger={
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    }
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(customer.id, customer.name)}
                    disabled={deleteCustomer.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-zinc-500 text-center py-12">
          No customers yet. Create one to get started.
        </p>
      )}
    </div>
  );
}
