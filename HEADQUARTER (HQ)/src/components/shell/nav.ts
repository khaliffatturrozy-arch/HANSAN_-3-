export interface NavItem {
  label: string;
  href: string;
  implemented: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/hq", implemented: true },
  { label: "Orders", href: "/hq/orders", implemented: true },
  { label: "Outlets", href: "/hq/outlets", implemented: true },
  { label: "Users", href: "/hq/users", implemented: true },
  { label: "Catalog", href: "/hq/catalog", implemented: true },
  { label: "Inventory", href: "/hq/inventory", implemented: true },
  { label: "Outlet config", href: "/hq/catalog/outlets", implemented: true },
];






