import { Link, useLocation, useSearch } from "wouter";
import { useRef, useState } from "react";
import {
  Home, Compass, BrainCircuit, Map,
  CheckSquare, BookOpen, Grid, Sparkles,
  ChevronRight,
  FileText, BarChart3, Building2, Activity,
  MessageSquare, Briefcase, TrendingUp, Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationCenter";
import { AccountMenu } from "@/components/AccountMenu";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  roles?: string[];
  section?: string;
};

const allNavItems: NavItem[] = [
  { href: "/home", label: "Home", icon: Home, section: "Core" },
  { href: "/dashboard", label: "Dashboard", icon: Grid, roles: ["STUDENT"], section: "Learning" },
  { href: "/career-discovery", label: "Career Discovery", icon: Compass, roles: ["STUDENT"], section: "Learning" },
  { href: "/ai-counselor", label: "AI Counselor", icon: BrainCircuit, roles: ["STUDENT"], section: "Learning" },
  { href: "/roadmap", label: "Roadmap", icon: Map, roles: ["STUDENT"], section: "Learning" },
  { href: "/assessments", label: "Assessments", icon: CheckSquare, roles: ["STUDENT"], section: "Learning" },
  { href: "/resources", label: "Resources", icon: BookOpen, roles: ["STUDENT"], section: "Learning" },

  { href: "/company/dashboard", label: "Dashboard", icon: Grid, roles: ["RECRUITER"], section: "Recruitment" },
  { href: "/company/jobs", label: "Jobs", icon: Briefcase, roles: ["RECRUITER"], section: "Recruitment" },
  { href: "/company/applications", label: "Applications", icon: FileText, roles: ["RECRUITER"], section: "Recruitment" },
  { href: "/company/hiring-drives", label: "Hiring Drives", icon: TrendingUp, roles: ["RECRUITER"], section: "Recruitment" },
  { href: "/company/analytics", label: "Analytics", icon: BarChart3, roles: ["RECRUITER"], section: "Recruitment" },

  { href: "/placement/dashboard", label: "Dashboard", icon: Grid, roles: ["PLACEMENT_OFFICER"], section: "Placement" },
  { href: "/placement/students", label: "Students", icon: Users, roles: ["PLACEMENT_OFFICER"], section: "Placement" },
  { href: "/placement/companies", label: "Companies", icon: Building2, roles: ["PLACEMENT_OFFICER"], section: "Placement" },
  { href: "/placement/applications", label: "Applications", icon: FileText, roles: ["PLACEMENT_OFFICER"], section: "Placement" },
  { href: "/placement/analytics", label: "Analytics", icon: BarChart3, roles: ["PLACEMENT_OFFICER"], section: "Placement" },

  { href: "/admin/dashboard", label: "Dashboard", icon: Grid, roles: ["ADMIN"], section: "Administration" },
  { href: "/admin/users", label: "Users", icon: Users, roles: ["ADMIN"], section: "Administration" },
  { href: "/admin/organizations", label: "Organizations", icon: Building2, roles: ["ADMIN"], section: "Administration" },
  { href: "/admin/roadmaps", label: "Roadmaps", icon: Map, roles: ["ADMIN"], section: "Administration" },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare, roles: ["ADMIN"], section: "Administration" },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: Activity, roles: ["ADMIN"], section: "Administration" },
];

function NavLink({ item, isActive, idx, compact }: { item: NavItem; isActive: boolean; idx: number; compact: boolean }) {
  return (
    <Link
      href={item.href}
      className={`nav-item flex items-center gap-3 rounded-xl transition-all duration-300 cursor-pointer ${
        compact ? "px-2.5 py-2" : "px-3 py-2.5"
      } ${
        isActive
          ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
          : "text-gray-400 hover:text-white hover:bg-white/10"
      }`}
      style={{ animationDelay: `${idx * 50}ms` }}
    >
      <item.icon className={`flex-shrink-0 transition-transform duration-300 ${compact ? "w-4 h-4" : "w-4.5 h-4.5"}`} />
      <span className={`transition-all duration-300 ${compact ? "text-xs" : "text-sm"}`}>{item.label}</span>
    </Link>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const search = useSearch();
  const { user, getRoleDisplayName } = useAuth();
  const compactSidebar = Boolean((user?.preferences as Record<string, unknown> | undefined)?.compactSidebar);
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const initials = (user?.fullName || user?.email || "U")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

  const isActive = (href: string, exact = false) => {
    if (exact) return location === href;
    return location.startsWith(href);
  };

  const getVisibleItems = () => {
    const userRole = user?.role || "";
    return allNavItems.filter((item) => {
      if (!item.roles || item.roles.length === 0) return true;
      return item.roles.includes(userRole);
    });
  };

  const groupedItems = () => {
    const items = getVisibleItems();
    const groups: Record<string, NavItem[]> = {};

    items.forEach((item) => {
      const section = item.section || "Core";
      if (!groups[section]) groups[section] = [];
      groups[section].push(item);
    });

    return groups;
  };

  const displayName = user?.fullName || user?.email?.split("@")?.[0] || "Pragyan User";
  const roleLabel = getRoleDisplayName();

  return (
    <div className="flex h-screen w-full">
      <aside className={`${compactSidebar ? "w-[190px]" : "w-[220px]"} flex-shrink-0 flex flex-col transition-all duration-300 bg-slate-900`}>
        <div className="p-6 flex items-center gap-2">
          <div className="p-1.5 rounded-md flex items-center justify-center transition-transform duration-300 hover:scale-110 bg-gradient-to-br from-purple-600 to-purple-500">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-white">Pragyan AI</h1>
            <p className="text-xs transition-colors duration-200 text-slate-400">Your Career Guide</p>
          </div>
        </div>

        <nav className="flex-1 px-3 flex flex-col gap-0.5 overflow-y-auto py-2">
          <style>{`
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateX(-10px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
            .nav-item {
              animation: slideIn 0.3s ease-out forwards;
            }
            .nav-section-title {
              font-size: 0.65rem;
              font-weight: 700;
              letter-spacing: 0.05em;
              text-transform: uppercase;
              padding: 12px 12px 8px;
              margin-top: 8px;
              color: #475569;
            }
          `}</style>

          {Object.entries(groupedItems()).map(([section, items]) => (
            <div key={section}>
              {items.map((item, idx) => (
                <NavLink
                  key={`${section}-${idx}`}
                  item={item}
                  isActive={isActive(item.href, item.exact)}
                  idx={idx}
                  compact={compactSidebar}
                />
              ))}
            </div>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-white/10 transition-colors duration-200">
          <button
            ref={triggerRef}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
            className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all duration-300 text-left hover:bg-white/5"
          >
            <Avatar className="h-9 w-9 border border-white/10 bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex-shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <AvatarFallback>{initials}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-semibold text-white">{displayName}</div>
              <div className="truncate text-[11px] text-slate-400">{roleLabel}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </button>
          
          <AccountMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            triggerRef={triggerRef}
            compact={compactSidebar}
          />
        </div>
      </aside>

      <main className="flex-1 flex flex-col rounded-tl-[56px] overflow-hidden transition-all duration-300 bg-slate-50">
        <div className="flex items-center justify-end px-6 pt-4 pb-0 gap-2">
          <NotificationBell />
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-all duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}
