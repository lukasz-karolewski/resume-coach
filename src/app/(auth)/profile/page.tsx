import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/server";

export default async function ProfilePage() {
  const userInformation = await api.profile.getUserInfo.query();

  return (
    <div className="grid w-full gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account identity and import workflow.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <CardTitle>Account information</CardTitle>
          <Button variant="secondary">Import your LinkedIn profile</Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">
                {userInformation?.name || "Not provided"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">
                {userInformation?.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
