import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Search, Bell, User, Lock, Mail, FileText, CheckCircle, Save, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { students } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";

const notificationItems = () => {
  const needsAttention = students.filter((s) => s.needsPractice || s.daysRemaining <= 3);
  return needsAttention.map((s) => ({
    id: s.id,
    text: s.needsPractice
      ? `${s.name} needs more practice`
      : s.daysRemaining < 0
      ? `${s.name} is overdue`
      : `${s.name} due in ${s.daysRemaining}d`,
    type: s.daysRemaining < 0 ? "error" : s.needsPractice ? "warning" : "info",
  }));
};

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"profile" | "password" | "notifications" | null>(null);

  const [name, setName] = useState(user ? `${user.first_name} ${user.last_name}`.trim() || user.username : "");
  const [email, setEmail] = useState(user?.email || "");
  const [affiliation, setAffiliation] = useState("Mercy General Hospital");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [emailFrequency, setEmailFrequency] = useState("weekly");

  const notifications = notificationItems();
  const unreadCount = notifications.length;

  const handleSaveProfile = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSavePassword = () => {
    setPasswordSaved(true);
    setTimeout(() => { setPasswordSaved(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }, 2000);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-50 border-b bg-card shadow-card">
            <div className="flex h-14 items-center justify-between px-4 gap-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
              </div>
              <div className="hidden flex-1 max-w-md md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search students, modules, cases..."
                    className="pl-9 bg-muted/50 border-none focus-visible:ring-primary/30"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Notifications */}
                <Popover open={notifOpen} onOpenChange={setNotifOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse-soft" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="bottom" align="end" className="w-80 p-0">
                    <div className="p-3 border-b">
                      <p className="text-sm font-semibold text-foreground">Notifications</p>
                      <p className="text-[10px] text-muted-foreground">{unreadCount} students need attention</p>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => { setNotifOpen(false); navigate("/students", { state: { statusFilter: n.type === "error" ? "Overdue" : "Needs Practice" } }); }}
                          className="flex items-start gap-2.5 px-3 py-2.5 w-full text-left hover:bg-muted/50 transition-colors border-b last:border-b-0"
                        >
                          <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.type === "error" ? "bg-destructive" : n.type === "warning" ? "bg-warning" : "bg-info"}`} />
                          <p className="text-xs text-foreground">{n.text}</p>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* User Profile */}
                <Popover open={profileOpen} onOpenChange={(open) => { setProfileOpen(open); if (!open) setSettingsTab(null); }}>
                  <PopoverTrigger asChild>
                    <button className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                      <User className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="bottom" align="end" className="w-[420px] p-0 max-h-[80vh] overflow-y-auto">
                    {!settingsTab ? (
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">SM</div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{name}</p>
                            <p className="text-xs text-muted-foreground">{email}</p>
                            <p className="text-[10px] text-muted-foreground">{affiliation}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" onClick={() => setSettingsTab("profile")}>
                            <User className="h-3.5 w-3.5" /> Edit Profile
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" onClick={() => setSettingsTab("password")}>
                            <Lock className="h-3.5 w-3.5" /> Change Password
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" onClick={() => setSettingsTab("notifications")}>
                            <Mail className="h-3.5 w-3.5" /> Email & Report Settings
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs text-destructive hover:text-destructive" onClick={() => { logout(); setProfileOpen(false); }}>
                            <LogOut className="h-3.5 w-3.5" /> Sign Out
                          </Button>
                        </div>
                      </div>
                    ) : settingsTab === "profile" ? (
                      <div className="p-4 space-y-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSettingsTab(null)} className="text-xs text-primary hover:underline">← Back</button>
                          <h3 className="text-sm font-semibold text-foreground">Edit Profile</h3>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-foreground mb-1 block">Full Name</label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} className="text-sm" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-foreground mb-1 block">Email Address</label>
                            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="text-sm" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-foreground mb-1 block">Hospital / Affiliation</label>
                            <Input value={affiliation} onChange={(e) => setAffiliation(e.target.value)} className="text-sm" />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          {saved ? (
                            <p className="text-xs text-success font-medium flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Saved!</p>
                          ) : (
                            <Button size="sm" onClick={handleSaveProfile} className="gap-2"><Save className="h-3.5 w-3.5" /> Save Changes</Button>
                          )}
                        </div>
                      </div>
                    ) : settingsTab === "password" ? (
                      <div className="p-4 space-y-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSettingsTab(null)} className="text-xs text-primary hover:underline">← Back</button>
                          <h3 className="text-sm font-semibold text-foreground">Change Password</h3>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-foreground mb-1 block">Current Password</label>
                            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="text-sm" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-foreground mb-1 block">New Password</label>
                            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="text-sm" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-foreground mb-1 block">Confirm Password</label>
                            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="text-sm" />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          {passwordSaved ? (
                            <p className="text-xs text-success font-medium flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Updated!</p>
                          ) : (
                            <Button size="sm" onClick={handleSavePassword} disabled={!currentPassword || !newPassword || newPassword !== confirmPassword} className="gap-2">
                              <Lock className="h-3.5 w-3.5" /> Update Password
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 space-y-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSettingsTab(null)} className="text-xs text-primary hover:underline">← Back</button>
                          <h3 className="text-sm font-semibold text-foreground">Email & Report Settings</h3>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-foreground mb-1.5 block">Automated Progress Report Frequency</label>
                          <Select value={emailFrequency} onValueChange={setEmailFrequency}>
                            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="never">Never</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="rounded-lg border border-border p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <p className="text-xs font-semibold text-foreground">Sample Progress Report</p>
                          </div>
                          <div className="rounded bg-muted/50 p-3 space-y-2 text-[11px]">
                            <p className="font-semibold text-foreground">Medulate Sync — Weekly Progress Report</p>
                            <p className="text-muted-foreground">Period: Feb 6–13, 2026</p>
                            <div className="border-t pt-2 space-y-1">
                              <p className="text-foreground"><strong>System Usage:</strong> 148 active students, 34 active today</p>
                              <p className="text-foreground"><strong>Students Needing Attention:</strong> 6 overdue, 4 need practice</p>
                              <p className="text-foreground"><strong>Common Errors:</strong> Arterial Puncture (23), Through-and-Through (18)</p>
                              <p className="text-foreground"><strong>Avg Walkthrough Progress:</strong> 67%</p>
                            </div>
                            <div className="border-t pt-2">
                              <p className="text-primary font-medium cursor-pointer hover:underline">→ Start New Training Session</p>
                              <p className="text-primary font-medium cursor-pointer hover:underline">→ View Full Dashboard</p>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" className="w-full">Save Preferences</Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
