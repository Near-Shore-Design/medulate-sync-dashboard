import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  KeyRound,
  LogOut,
  ClipboardList,
  Building2,
  Inbox,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { students } from "@/data/mockData";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Students & Analytics", url: "/students", icon: Users },
  { title: "Case Review", url: "/cases", icon: ClipboardList },
  { title: "Inbox", url: "/inbox", icon: Inbox },
  { title: "Trainees & Assignments", url: "/licenses", icon: KeyRound },
];

export function AppSidebar() {
  const navigate = useNavigate();

  const unreadCount = students.filter((s) => s.needsPractice || s.daysRemaining <= 3).length;

  return (
    <Sidebar className="border-none">
      <SidebarHeader className="p-5 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-accent">
            <span className="text-sm font-bold text-sidebar-accent-foreground">S</span>
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight text-sidebar-foreground">
              Medulate <span className="text-sidebar-primary">Sync</span>
            </h1>
            <p className="text-[9px] font-medium uppercase tracking-widest text-sidebar-foreground/50">
              CVC Training
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-sidebar-accent/50 px-3 py-2">
          <Building2 className="h-4 w-4 text-sidebar-foreground/60" />
          <div>
            <p className="text-[11px] font-semibold text-sidebar-foreground">Mercy General Hospital</p>
            <p className="text-[9px] text-sidebar-foreground/50">Medical Education Dept.</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild size="lg">
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="!bg-sidebar-accent !text-sidebar-accent-foreground font-semibold"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                      {item.title === "Inbox" && unreadCount > 0 && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <button className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-sidebar-accent hover:text-destructive w-full">
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
