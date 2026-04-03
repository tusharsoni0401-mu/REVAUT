import {
  LayoutDashboard, MessageSquare, Mic2, BarChart3,
  Settings, History, ChevronDown, MapPin, LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useReviewStore } from "@/stores/useReviewStore";
import { useLocationStore } from "@/stores/useLocationStore";
import { useAuth, signOut } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Reviews", url: "/reviews", icon: MessageSquare },
  { title: "Brand Voice", url: "/brand-voice", icon: Mic2 },
  { title: "Insights", url: "/insights", icon: BarChart3 },
  { title: "Backfill Queue", url: "/backfill", icon: History },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pendingCount = useReviewStore((s) => s.pendingCount());
  const locations = useLocationStore((s) => s.locations);
  const activeLocationId = useLocationStore((s) => s.activeLocationId);
  const setActiveLocation = useLocationStore((s) => s.setActiveLocation);
  const activeLocation = useLocationStore((s) => s.activeLocation());
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              RA
            </div>
            <div>
              <p className="text-sm font-semibold">Review Autopilot</p>
              <p className="text-xs text-muted-foreground">AI Review Manager</p>
            </div>
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            RA
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-2 hover:bg-accent/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {!collapsed && item.url === "/reviews" && pendingCount > 0 && (
                        <Badge className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                          {pendingCount}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-2">
        {!collapsed && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full rounded-lg border bg-accent/50 p-3 text-left hover:bg-accent transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{activeLocation.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{activeLocation.address}</p>
                    </div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[260px] p-1" side="top" align="start">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground px-2 py-1.5">Switch location</p>
                {locations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => setActiveLocation(loc.id)}
                    className={`w-full text-left rounded-md px-2 py-2 text-sm transition-colors ${
                      loc.id === activeLocationId
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent"
                    }`}
                  >
                    <p className="font-medium text-xs">{loc.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{loc.address}</p>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* User row */}
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <p className="text-xs text-muted-foreground truncate min-w-0">
              {user?.email ?? ""}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={handleSignOut}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
