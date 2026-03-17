"use client";

import { useCustomers, useDeleteCustomer } from "@/lib/hooks/use-customers";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CustomersPage() {
  const { data: customers, isLoading } = useCustomers();
  const deleteCustomer = useDeleteCustomer();

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete customer "${name}"? This will fail if they have jobs.`))
      return;
    deleteCustomer.mutate(id);
  }

  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        title="Customers"
        description="Manage customer information"
        action={<CustomerFormDialog />}
      />
      <div className="flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-4xl">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="h-5 w-40 animate-pulse rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : customers && customers.length > 0 ? (
            <div className="space-y-3">
              {customers.map((customer) => (
                <Card key={customer.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <div className="mt-0.5 flex gap-4 text-sm text-muted-foreground">
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
            <p className="py-12 text-center text-muted-foreground">
              No customers yet. Create one to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
