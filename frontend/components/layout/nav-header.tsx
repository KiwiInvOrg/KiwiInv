"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Board" },
  { href: "/customers", label: "Customers" },
  { href: "/templates", label: "Templates" },
];

export function NavHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-white">
      <div className="flex h-14 items-center px-6 gap-6">
        <Link href="/" className="font-bold text-lg tracking-tight">
          Kiwi Cabins
        </Link>
        <nav className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                pathname === link.href
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
