import {
  Building2,
  Droplets,
  FileText,
  Home,
  LayoutDashboard,
  Megaphone,
  Settings2,
  Wrench,
  Zap,
} from "lucide-react";

export const LANDLORD_NAV_ITEMS = [
  { id: "Dashboard",     label: "Dashboard",     icon: LayoutDashboard, badge: null },
  { id: "Properties",    label: "Properties",    icon: Building2,       badge: "2" },
  { id: "Units",         label: "Units",         icon: Home,            badge: "4" },
  { id: "Requests",      label: "Requests",      icon: Wrench,          badge: "3", badgeColor: "amber" },
  { id: "Announcements", label: "Announcements", icon: Megaphone,       badge: null },
  { id: "Documents",     label: "Documents",     icon: FileText,        badge: null },
  { id: "Settings",      label: "Settings",      icon: Settings2,       badge: null },
];

export const LANDLORD_ACTIVE_REQUESTS = [
  {
    id: "req-1",
    title: "HVAC blowing warm air",
    priority: "urgent",
    status: "in_progress",
    unit_label: "2A",
    property_name: "Sunset Vista",
    created_at: "11 Aug 2026",
    icon: Zap,
  },
  {
    id: "req-2",
    title: "Leaking kitchen sink pipe",
    priority: "high",
    status: "open",
    unit_label: "101",
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
    unit_label: "2A",
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
    unit_label: "101",
    status_text: "Open",
    status_type: "open",
    date: "13 Aug 2026",
    icon: Droplets,
  },
  {
    id: "act-3",
    type: "maintenance_update",
    title: "Broken balcony door latch",
    property_name: "Maplewood Heights",
    unit_label: "101",
    status_text: "Case closed by tenant",
    status_type: "closed",
    date: "10 Aug 2026",
    icon: Wrench,
  },
  {
    id: "act-4",
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
    unit_label: "101",
    tenant_name: "Sarah Jenkins",
    property_name: "Maplewood Heights",
    has_maintenance: true,
  },
  {
    id: "unit-2",
    initials: "2A",
    unit_label: "2A",
    tenant_name: "Alex Rivera",
    property_name: "Sunset Vista",
    has_maintenance: true,
  },
];

export const TENANT_TABS = [
  { id: "home",     label: "Home",     icon: Home },
  { id: "requests", label: "Requests", icon: Wrench },
  { id: "news",     label: "News",     icon: Megaphone },
  { id: "docs",     label: "Docs",     icon: FileText },
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
