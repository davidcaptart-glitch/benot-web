"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/admin",           label: "Dashboard",     icon: "▪" },
  { href: "/admin/orders",    label: "Pedidos",        icon: "▪" },
  { href: "/admin/providers", label: "Proveedores",    icon: "▪" },
  { href: "/admin/products",  label: "Productos",      icon: "▪" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
  }

  return (
    <aside className="w-52 min-h-screen bg-black flex flex-col flex-shrink-0">
      {/* Brand */}
      <div className="px-5 pt-7 pb-6 border-b border-white/10">
        <p className="font-bebas tracking-[0.25em] text-white text-xl leading-none">BENOT</p>
        <p className="font-bebas tracking-[0.2em] text-[#FF1E1E] text-[10px] mt-0.5">BACKOFFICE</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4">
        {NAV.map(({ href, label, icon }) => {
          const isActive =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-5 py-2.5 text-xs tracking-widest font-semibold transition-colors ${
                isActive
                  ? "text-[#FF1E1E] bg-white/5"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className={`text-[6px] ${isActive ? "text-[#FF1E1E]" : "text-white/30"}`}>
                {icon}
              </span>
              {label.toUpperCase()}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-5 pb-6 border-t border-white/10 pt-4">
        <button
          onClick={handleLogout}
          className="w-full text-left text-white/30 hover:text-white text-[10px] tracking-widest transition-colors"
        >
          CERRAR SESIÓN →
        </button>
      </div>
    </aside>
  );
}
