import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { UsersPanel } from "@/components/admin/UsersPanel";
import { InstitutionsPanel } from "@/components/admin/InstitutionsPanel";
import { DepartmentsPanel } from "@/components/admin/DepartmentsPanel";
import { FeatureFlagsPanel } from "@/components/admin/FeatureFlagsPanel";

/**
 * Administration: everything that used to need seed scripts, management
 * commands, or Django admin. Institution admins get Users + Departments for
 * their own institution; platform admins additionally manage institutions and
 * platform settings. The API enforces the same boundaries server-side.
 */
const AdminPage = () => {
  const { user } = useAuth();
  const isPlatformAdmin = !!user?.is_platform_admin;
  const [tab, setTab] = useState("users");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" /> Administration
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {isPlatformAdmin
            ? "Manage institutions, accounts, departments, and platform settings."
            : `Manage accounts and departments for ${user?.institution?.name ?? "your institution"}.`}
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          {isPlatformAdmin && <TabsTrigger value="institutions">Institutions</TabsTrigger>}
          <TabsTrigger value="departments">Departments</TabsTrigger>
          {isPlatformAdmin && <TabsTrigger value="settings">Platform settings</TabsTrigger>}
        </TabsList>
        <TabsContent value="users" className="mt-4">
          <UsersPanel />
        </TabsContent>
        {isPlatformAdmin && (
          <TabsContent value="institutions" className="mt-4">
            <InstitutionsPanel />
          </TabsContent>
        )}
        <TabsContent value="departments" className="mt-4">
          <DepartmentsPanel />
        </TabsContent>
        {isPlatformAdmin && (
          <TabsContent value="settings" className="mt-4">
            <FeatureFlagsPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default AdminPage;
