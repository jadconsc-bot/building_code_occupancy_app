/**
 * Settings Page
 * User account and application preferences
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  Palette,
  LogOut,
  Mail,
  KeyRound,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function Settings() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme, switchable } = useTheme();

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [analysisAlerts, setAnalysisAlerts] = useState(true);
  const [projectUpdates, setProjectUpdates] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>

        <Tabs defaultValue="account">
          <TabsList className="mb-6">
            <TabsTrigger value="account" className="gap-2">
              <User className="w-4 h-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="w-4 h-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* ── Account ─────────────────────────────────────────────────────── */}
          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profile</CardTitle>
                <CardDescription>Your account details from your OAuth provider</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary text-primary-foreground flex items-center justify-center rounded-full text-xl font-bold">
                    {user?.name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="font-semibold">{user?.name ?? "—"}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {user?.email ?? "—"}
                    </p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      Authenticated via OAuth
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="display-name">Display Name</Label>
                  <Input
                    id="display-name"
                    defaultValue={user?.name ?? ""}
                    placeholder="Your display name"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Display name is managed by your OAuth provider and cannot be changed here.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    defaultValue={user?.email ?? ""}
                    placeholder="your@email.com"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Email is managed by your OAuth provider.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="text-base text-red-600">Danger Zone</CardTitle>
                <CardDescription>Irreversible account actions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={logout}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Notifications ────────────────────────────────────────────────── */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Email Notifications</CardTitle>
                <CardDescription>Choose what emails you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Analysis complete alerts</p>
                    <p className="text-xs text-muted-foreground">Notify when a drawing analysis finishes</p>
                  </div>
                  <Switch checked={analysisAlerts} onCheckedChange={setAnalysisAlerts} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Project updates</p>
                    <p className="text-xs text-muted-foreground">Notify on project status changes</p>
                  </div>
                  <Switch checked={projectUpdates} onCheckedChange={setProjectUpdates} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Email digest</p>
                    <p className="text-xs text-muted-foreground">Weekly summary of activity</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Appearance ───────────────────────────────────────────────────── */}
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Theme</CardTitle>
                <CardDescription>Choose how CodeComply looks</CardDescription>
              </CardHeader>
              <CardContent>
                {switchable ? (
                  <div className="grid grid-cols-2 gap-3">
                    {(["light", "dark"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => theme !== t && toggleTheme?.()}
                        className={`rounded-lg border-2 p-4 text-sm font-medium capitalize transition-colors
                          ${theme === t
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"}`}
                      >
                        {t === "light" ? "☀️ Light" : "🌙 Dark"}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Theme switching is not enabled for this deployment. The current theme is{" "}
                    <span className="font-medium">{theme}</span>.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Security ─────────────────────────────────────────────────────── */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Authentication</CardTitle>
                <CardDescription>Your account security details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                  <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">OAuth 2.0 Secured</p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Your account is protected via OAuth. Passwords are managed by your identity provider.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Signed in as</Label>
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted text-sm">
                    <KeyRound className="w-4 h-4 text-muted-foreground" />
                    {user?.email ?? "—"}
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-1">Session</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    You are currently signed in. Signing out will end your session on this device.
                  </p>
                  <Button variant="outline" className="gap-2" onClick={logout}>
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
