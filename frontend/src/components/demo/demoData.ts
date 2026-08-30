import {
  Building2,
  Droplets,
  FileText,
  Home,
  LayoutDashboard,
  Megaphone,
  Settings2,
  UserCheck,
  Wrench,
  Zap,
} from "lucide-react";

export const LANDLORD_NAV_ITEMS = [
  { id: "Dashboard",       label: "Dashboard",       href: "/landlord/dashboard",       icon: LayoutDashboard, description: "Overview of properties, units & cashflow" },
  { id: "Properties",      label: "Properties",      href: "/landlord/properties",      icon: Building2,       description: "Manage property listings & addresses" },
  { id: "Units",           label: "Units",           href: "/landlord/units",           icon: Home,            description: "Occupancy, leases & unit details" },
  { id: "Requests",        label: "Requests",        href: "/landlord/requests",        icon: Wrench,          description: "Maintenance & tenant work orders" },
  { id: "Announcements",   label: "Announcements",   href: "/landlord/announcements",   icon: Megaphone,       description: "Broadcast updates to your residents" },
  { id: "Documents",       label: "Documents",       href: "/landlord/documents",       icon: FileText,        description: "Upload and view leases & property files" },
  { id: "Access Requests", label: "Access Requests", href: "/landlord/access-requests", icon: UserCheck,       description: "Review and approve applicant join requests" },
];

export const LANDLORD_ACTIVE_REQUESTS = [
  {
    id: "req-1",
    title: "HVAC blowing warm air",
    priority: "urgent",
    status: "in_progress",
    unit_label: "Unit 2A",
    property_name: "Sunset Vista",
    created_at: "11 Aug 2026",
    icon: Zap,
  },
  {
    id: "req-2",
    title: "Leaking kitchen sink pipe",
    priority: "high",
    status: "open",
    unit_label: "Unit 101",
    property_name: "Maplewood Heights",
    created_at: "13 Aug 2026",
    icon: Droplets,
  },
];

export const LANDLORD_RECENT_ACTIVITY = [
  {
    id: "act-1",
    type: "maintenance_update",
    title: "HVAC blowing warm air",
    property_name: "Sunset Vista",
    unit_label: "Unit 2A",
    status_text: "In Progress",
    status_type: "in_progress",
    date: "14 Aug 2026",
    icon: Zap,
  },
  {
    id: "act-2",
    type: "maintenance_update",
    title: "Leaking kitchen sink pipe",
    property_name: "Maplewood Heights",
    unit_label: "Unit 101",
    status_text: "Open",
    status_type: "open",
    date: "13 Aug 2026",
    icon: Droplets,
  },
  {
    id: "act-3",
    type: "announcement_posted",
    title: "Scheduled Plumbing Riser Inspection",
    property_name: "Maplewood Heights",
    unit_label: "",
    status_text: "Announcement posted",
    status_type: "announcement",
    date: "9 Aug 2026",
    icon: Megaphone,
  },
];

export const LANDLORD_OCCUPIED_UNITS = [
  {
    id: "unit-1",
    initials: "101",
    unit_label: "Unit 101",
    tenant_name: "Sarah Jenkins",
    property_name: "Maplewood Heights",
    has_maintenance: true,
  },
  {
    id: "unit-2",
    initials: "2A",
    unit_label: "Unit 2A",
    tenant_name: "Alex Rivera",
    property_name: "Sunset Vista",
    has_maintenance: true,
  },
];

export const TENANT_TABS = [
  { id: "home",     label: "Home",     href: "/tenant/dashboard",     icon: Home },
  { id: "requests", label: "Requests", href: "/tenant/requests",      icon: Wrench },
  { id: "news",     label: "News",     href: "/tenant/announcements", icon: Megaphone },
  { id: "docs",     label: "Docs",     href: "/tenant/documents",     icon: FileText },
];

export const TENANT_REQUESTS = [
  {
    id: "treq-1",
    title: "Leaking kitchen sink pipe",
    status: "open",
    priority: "high",
    date: "Aug 13",
  },
  {
    id: "treq-2",
    title: "Broken balcony door latch",
    status: "resolved",
    priority: "low",
    date: "Aug 5",
  },
];
