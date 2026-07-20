import { Link, useLocation } from "wouter";
import { 
  Home, Compass, BrainCircuit, Map, 
  CheckSquare, BookOpen, User, Info, 
  Settings, Grid, Sparkles, Bell, LogOut,
  Briefcase, Users, TrendingUp, FileText,
  BarChart3, Building2, Activity
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  roles?: string[];
  section?: string;
};

// All available nav items - organized by role
const allNavItems: NavItem[] = [
  // Shared for all roles
  { href: "/home", label: "Home", icon: Home, section: "Core" },
  
  // STUDENT-specific items
  { href: "/dashboard", label: "Dashboard", icon: Grid, roles: ["STUDENT"], section: "Learning" },
  { href: "/career-discovery", label: "Career Discovery", icon: Compass, roles: ["STUDENT"], section: "Learning" },
  { href: "/ai-counselor", label: "AI Counselor", icon: BrainCircuit, roles: ["STUDENT"], section: "Learning" },
  { href: "/roadmap", label: "Roadmap", icon: Map, roles: ["STUDENT"], section: "Learning" },
  { href: "/assessments", label: "Assessments", icon: CheckSquare, roles: ["STUDENT"], section: "Learning" },
  { href: "/resources", label: "Resources", icon: BookOpen, roles: ["STUDENT"], section: "Learning" },

  // RECRUITER-specific items
  { href: "/company/dashboard", label: "Dashboard", icon: Grid, roles: ["RECRUITER"], section: "Recruitment" },
  { href: "/company/jobs", label: "Jobs", icon: Briefcase, roles: ["RECRUITER"], section: "Recruitment" },
  { href: "/company/applications", label: "Applications", icon: FileText, roles: ["RECRUITER"], section: "Recruitment" },
  { href: "/company/hiring-drives", label: "Hiring Drives", icon: TrendingUp, roles: ["RECRUITER"], section: "Recruitment" },
  { href: "/company/analytics", label: "Analytics", icon: BarChart3, roles: ["RECRUITER"], section: "Recruitment" },

  // PLACEMENT_OFFICER-specific items
  { href: "/placement/dashboard", label: "Dashboard", icon: Grid, roles: ["PLACEMENT_OFFICER"], section: "Placement" },
  { href: "/placement/students", label: "Students", icon: Users, roles: ["PLACEMENT_OFFICER"], section: "Placement" },
  { href: "/placement/companies", label: "Companies", icon: Building2, roles: ["PLACEMENT_OFFICER"], section: "Placement" },
  { href: "/placement/applications", label: "Applications", icon: FileText, roles: ["PLACEMENT_OFFICER"], section: "Placement" },
  { href: "/placement/analytics", label: "Analytics", icon: BarChart3, roles: ["PLACEMENT_OFFICER"], section: "Placement" },

  // ADMIN-specific items
  { href: "/admin/dashboard", label: "Dashboard", icon: Grid, roles: ["ADMIN"], section: "Administration" },
  { href: "/admin/users", label: "Users", icon: Users, roles: ["ADMIN"], section: "Administration" },
  { href: "/admin/organizations", label: "Organizations", icon: Building2, roles: ["ADMIN"], section: "Administration" },
  { href: "/admin/roadmaps", label: "Roadmaps", icon: Map, roles: ["ADMIN"], section: "Administration" },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: Activity, roles: ["ADMIN"], section: "Administration" },

  // Shared account section
  { href: "/profile", label: "Profile", icon: User, section: "Account" },
  { href: "/information", label: "Information", icon: Info, section: "Account" },
  { href: "/settings", label: "Settings", icon: Settings, section: "Account" },
];

// NavLink Component
function NavLink({ item, isActive, idx }: { item: NavItem; isActive: boolean; idx: number }) {
  return (
    <Link 
      href={item.href}
      className="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 cursor-pointer"
      style={{
        background: isActive ? "linear-gradient(90deg, #4F46E5, #625EF8)" : "transparent",
        color: isActive ? "#FFFFFF" : "#94A3B8",
        fontWeight: isActive ? "500" : "400",
        animationDelay: `${idx * 50}ms`,
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255, 255, 255, 0.1)";
          (e.currentTarget as HTMLElement).style.color = "#FFFFFF";
          (e.currentTarget as HTMLElement).style.transform = "translateX(4px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
          (e.currentTarget as HTMLElement).style.color = "#94A3B8";
          (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
        }
      }}
    >
      <item.icon className="w-4.5 h-4.5 flex-shrink-0 transition-transform duration-300" style={{ width: 18, height: 18 }} />
      <span className="text-sm transition-all duration-300">{item.label}</span>
    </Link>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();

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

  // Filter nav items by role
  const getVisibleItems = () => {
    const userRole = user?.role || "";
    return allNavItems.filter((item) => {
      // If no roles specified, show for all roles (shared items)
      if (!item.roles || item.roles.length === 0) return true;
      // Otherwise, only show if user's role is in the item's roles
      return item.roles.includes(userRole);
    });
  };

  // Group items by section
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

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <aside 
        className="w-[220px] flex-shrink-0 flex flex-col transition-all duration-300"
        style={{ backgroundColor: "#0F172A" }}
      >
        <div className="p-6 flex items-center gap-2">
          <div 
            className="p-1.5 rounded-md flex items-center justify-center transition-transform duration-300 hover:scale-110"
            style={{ background: "linear-gradient(135deg, #7666F6 0%, #625EF8 100%)" }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-white">Pragyan AI</h1>
            <p className="text-xs transition-colors duration-200" style={{ color: "#94A3B8" }}>Your Career Guide</p>
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
              <div className="nav-section-title">{section}</div>
              {items.map((item, idx) => (
                <NavLink 
                  key={`${section}-${idx}`}
                  item={item}
                  isActive={isActive(item.href, item.exact)}
                  idx={idx}
                />
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col rounded-tl-[56px] overflow-hidden transition-all duration-300" style={{ backgroundColor: "#F7F8FC" }}>
        {/* Header */}
        <header 
          className="h-20 px-8 flex items-center justify-end border-b shrink-0 transition-all duration-300"
          style={{ 
            backgroundColor: "#FFFFFF",
            borderColor: "#E5E7EB"
          }}
        >
          <div className="flex items-center gap-4">
            <button 
              className="relative p-2 transition-all duration-300 rounded-full hover:bg-gray-100"
              style={{ color: "#94A3B8" }}
            >
              <Bell className="w-6 h-6 transition-transform duration-300 hover:scale-110" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            </button>
            <button
              onClick={() => {
                void logout().then(() => navigate("/auth"));
              }}
              className="p-2 transition-all duration-300 rounded-full hover:bg-gray-100"
              style={{ color: "#94A3B8" }}
            >
              <LogOut className="w-5 h-5 transition-transform duration-300 hover:scale-110" />
            </button>
            <Avatar className="w-10 h-10 border transition-transform duration-300 hover:scale-110" style={{ borderColor: "#E5E7EB" }}>
              <AvatarFallback className="font-medium transition-colors duration-300" style={{ backgroundColor: "#FF8C42", color: "#FFFFFF" }}>
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 transition-all duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}
