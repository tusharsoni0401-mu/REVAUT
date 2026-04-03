import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Link2, Bell, Shield, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { openGBPAuthPopup, isConnected, clearToken } from "@/services/gbpOAuth";
import { useLocationStore } from "@/stores/useLocationStore";

const CUISINE_TYPES = [
  { value: "indian",         label: "Indian" },
  { value: "italian",        label: "Italian" },
  { value: "french",         label: "French" },
  { value: "japanese",       label: "Japanese" },
  { value: "mexican",        label: "Mexican" },
  { value: "american",       label: "American" },
  { value: "chinese",        label: "Chinese" },
  { value: "mediterranean",  label: "Mediterranean" },
];

const AUTO_MODES = [
  {
    value: "approval",
    label: "Full Approval",
    description: "Every AI response requires manual approval before posting",
  },
  {
    value: "semi-auto",
    label: "Smart Semi-Auto",
    description: "High-confidence responses auto-post, low-confidence need approval",
  },
  {
    value: "full-auto",
    label: "Full Auto",
    description: "All responses auto-post (with safety checks). Manual review optional",
  },
];

export default function SettingsPage() {
  const { toast } = useToast();

  const activeLocation  = useLocationStore((s) => s.activeLocation());
  const updateLocation  = useLocationStore((s) => s.updateLocation);
  const storeLoading    = useLocationStore((s) => s.loading);

  const [restaurantName, setRestaurantName] = useState("");
  const [address,        setAddress]        = useState("");
  const [cuisineType,    setCuisineType]    = useState("italian");
  const [autoMode,       setAutoMode]       = useState("approval");
  const [saving,         setSaving]         = useState(false);
  const [gbpConnected,   setGbpConnected]   = useState(isConnected());
  const [notifications,  setNotifications]  = useState({
    newReview:     true,
    aiResponse:    true,
    weeklyDigest:  true,
    alerts:        true,
  });

  // Populate form whenever the active location loads / changes
  useEffect(() => {
    if (!activeLocation) return;
    setRestaurantName(activeLocation.name);
    setAddress(activeLocation.address);
    setCuisineType(activeLocation.cuisineType);
    setGbpConnected(activeLocation.gbpConnected || isConnected());
  }, [activeLocation]);

  // Listen for OAuth popup callback
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "gbp-oauth-success") {
        setGbpConnected(true);
        if (activeLocation) {
          updateLocation(activeLocation.id, { gbpConnected: true }).catch(console.error);
        }
        toast({ title: "GBP Connected", description: "Google Business Profile linked successfully." });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [toast, activeLocation, updateLocation]);

  const handleConnectGBP = () => {
    const popup = openGBPAuthPopup();
    if (!popup) {
      setGbpConnected(true);
      if (activeLocation) {
        updateLocation(activeLocation.id, { gbpConnected: true }).catch(console.error);
      }
      toast({
        title: "GBP Connected (Demo)",
        description: "Popup was blocked. In production, allow popups for OAuth flow.",
      });
    }
  };

  const handleDisconnectGBP = () => {
    clearToken();
    setGbpConnected(false);
    if (activeLocation) {
      updateLocation(activeLocation.id, { gbpConnected: false }).catch(console.error);
    }
    toast({ title: "Disconnected", description: "GBP account unlinked." });
  };

  const handleSave = async () => {
    if (!activeLocation) return;
    setSaving(true);
    try {
      await updateLocation(activeLocation.id, {
        name:        restaurantName,
        address,
        cuisineType,
        gbpConnected,
      });
      toast({ title: "Settings saved", description: "Your changes have been applied." });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (storeLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your restaurant profile and integrations</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Location Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Restaurant Name</Label>
            <Input value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cuisine Type</Label>
            <Select value={cuisineType} onValueChange={setCuisineType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CUISINE_TYPES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Connected Platforms</Label>
            <div className="mt-1.5 flex gap-2 flex-wrap">
              <Badge variant="outline" className="gap-1">
                <span className={`h-2 w-2 rounded-full ${gbpConnected ? "bg-success" : "bg-muted-foreground"}`} />
                Google Business Profile
              </Badge>
              <Badge variant="outline" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                TripAdvisor
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" /> Automation Mode
          </CardTitle>
          <CardDescription>Control how AI responses are handled</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {AUTO_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => setAutoMode(mode.value)}
              className={`w-full text-left rounded-lg border p-3 transition-colors ${
                autoMode === mode.value ? "border-primary bg-primary/5" : "hover:bg-accent/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{mode.label}</span>
                {autoMode === mode.value && <Badge className="bg-primary">Active</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{mode.description}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Google Business Profile
          </CardTitle>
          <CardDescription>Connect your GBP to sync reviews automatically</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!gbpConnected ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-dashed p-4 text-center space-y-2">
                <ExternalLink className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm font-medium">Not Connected</p>
                <p className="text-xs text-muted-foreground">
                  Connect your Google Business Profile to automatically import reviews and post
                  AI-generated responses.
                </p>
                <Button onClick={handleConnectGBP}>Connect Google Business Profile</Button>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium">Setup requires:</p>
                <ol className="list-decimal list-inside space-y-0.5 ml-1">
                  <li>Google Cloud Platform project with Business Profile API enabled</li>
                  <li>OAuth 2.0 consent screen configured</li>
                  <li>Business verification completed on GBP</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-success/5 border-success/20 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success" />
                <span className="text-sm font-medium text-success">Connected</span>
              </div>
              <p className="text-xs text-muted-foreground">{restaurantName} — {address}</p>
              <Button size="sm" variant="outline" onClick={handleDisconnectGBP}>Disconnect</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(
            [
              { key: "newReview"    as const, label: "New Review Alerts",          desc: "Get notified when a new review is posted" },
              { key: "aiResponse"   as const, label: "AI Response Ready",          desc: "Notification when AI generates a response" },
              { key: "weeklyDigest" as const, label: "Weekly Digest",              desc: "Summary of review performance every Monday" },
              { key: "alerts"       as const, label: "Complaint Velocity Alerts",  desc: "Alert when complaint topics spike" },
            ] as const
          ).map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={notifications[item.key]}
                onCheckedChange={(v) => setNotifications({ ...notifications, [item.key]: v })}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button className="w-full" onClick={handleSave} disabled={saving}>
        {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : "Save Settings"}
      </Button>
    </div>
  );
}
