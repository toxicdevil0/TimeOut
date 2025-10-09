import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Timer, 
  Bell, 
  Palette, 
  Shield,
  Database,
  User,
  Smartphone,
  Volume2,
  Moon,
  Sun,
  Monitor,
  Download,
  Trash2,
  RefreshCw
} from "lucide-react";

export const SettingsView = () => {
  const [settings, setSettings] = useState({
    // Timer Settings
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    autoStartBreaks: true,
    autoStartPomodoros: false,
    longBreakInterval: 4,
    
    // Notifications
    soundEnabled: true,
    desktopNotifications: true,
    soundVolume: 50,
    notificationSound: "bell",
    
    // Appearance
    theme: "system",
    accentColor: "blue",
    sidebarCollapsed: false,
    compactMode: false,
    
    // Productivity
    dailyGoal: 8,
    showMotivationalQuotes: true,
    trackDetailedStats: true,
    weeklyReports: true,
    
    // Privacy & Data
    shareAnonymousData: false,
    syncAcrossDevices: true,
    dataRetention: "1year"
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    // Reset to default values
    setSettings({
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      autoStartBreaks: true,
      autoStartPomodoros: false,
      longBreakInterval: 4,
      soundEnabled: true,
      desktopNotifications: true,
      soundVolume: 50,
      notificationSound: "bell",
      theme: "system",
      accentColor: "blue",
      sidebarCollapsed: false,
      compactMode: false,
      dailyGoal: 8,
      showMotivationalQuotes: true,
      trackDetailedStats: true,
      weeklyReports: true,
      shareAnonymousData: false,
      syncAcrossDevices: true,
      dataRetention: "1year"
    });
  };

  const exportData = () => {
    // Placeholder for data export functionality
    console.log("Exporting user data...");
  };

  const clearData = () => {
    // Placeholder for data clearing functionality
    console.log("Clearing user data...");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Customize your TimeOut experience</p>
        </div>
        <Button onClick={resetSettings} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>

      <Tabs defaultValue="timer" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="timer">Timer</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        {/* Timer Settings */}
        <TabsContent value="timer" className="space-y-6">
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Timer className="mr-2 h-5 w-5" />
                Timer Durations
              </CardTitle>
              <CardDescription>Configure your focus and break session lengths</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="focus-duration">Focus Session</Label>
                  <div className="space-y-2">
                    <Input
                      id="focus-duration"
                      type="number"
                      value={settings.focusDuration}
                      onChange={(e) => updateSetting("focusDuration", parseInt(e.target.value))}
                      className="text-center"
                      min="1"
                      max="60"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      {settings.focusDuration} minutes
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="short-break">Short Break</Label>
                  <div className="space-y-2">
                    <Input
                      id="short-break"
                      type="number"
                      value={settings.shortBreakDuration}
                      onChange={(e) => updateSetting("shortBreakDuration", parseInt(e.target.value))}
                      className="text-center"
                      min="1"
                      max="30"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      {settings.shortBreakDuration} minutes
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="long-break">Long Break</Label>
                  <div className="space-y-2">
                    <Input
                      id="long-break"
                      type="number"
                      value={settings.longBreakDuration}
                      onChange={(e) => updateSetting("longBreakDuration", parseInt(e.target.value))}
                      className="text-center"
                      min="1"
                      max="60"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      {settings.longBreakDuration} minutes
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-start breaks</Label>
                    <p className="text-sm text-muted-foreground">Automatically start break sessions</p>
                  </div>
                  <Switch
                    checked={settings.autoStartBreaks}
                    onCheckedChange={(checked) => updateSetting("autoStartBreaks", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-start pomodoros</Label>
                    <p className="text-sm text-muted-foreground">Automatically start focus sessions after breaks</p>
                  </div>
                  <Switch
                    checked={settings.autoStartPomodoros}
                    onCheckedChange={(checked) => updateSetting("autoStartPomodoros", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Long break interval</Label>
                  <p className="text-sm text-muted-foreground">
                    Take a long break after every {settings.longBreakInterval} focus sessions
                  </p>
                  <Slider
                    value={[settings.longBreakInterval]}
                    onValueChange={(value) => updateSetting("longBreakInterval", value[0])}
                    max={8}
                    min={2}
                    step={1}
                    className="py-4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Notifications & Sounds
              </CardTitle>
              <CardDescription>Control how TimeOut notifies you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Sound notifications</Label>
                  <p className="text-sm text-muted-foreground">Play sounds when sessions start/end</p>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => updateSetting("soundEnabled", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Desktop notifications</Label>
                  <p className="text-sm text-muted-foreground">Show system notifications</p>
                </div>
                <Switch
                  checked={settings.desktopNotifications}
                  onCheckedChange={(checked) => updateSetting("desktopNotifications", checked)}
                />
              </div>

              {settings.soundEnabled && (
                <>
                  <div className="space-y-3">
                    <Label>Notification sound</Label>
                    <Select
                      value={settings.notificationSound}
                      onValueChange={(value) => updateSetting("notificationSound", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bell">Bell</SelectItem>
                        <SelectItem value="chime">Chime</SelectItem>
                        <SelectItem value="ding">Ding</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Volume2 className="h-4 w-4" />
                      <Label>Volume: {settings.soundVolume}%</Label>
                    </div>
                    <Slider
                      value={[settings.soundVolume]}
                      onValueChange={(value) => updateSetting("soundVolume", value[0])}
                      max={100}
                      min={0}
                      step={5}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="mr-2 h-5 w-5" />
                Appearance & Theme
              </CardTitle>
              <CardDescription>Customize the look and feel of TimeOut</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Theme</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value) => updateSetting("theme", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center">
                        <Sun className="mr-2 h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center">
                        <Moon className="mr-2 h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center">
                        <Monitor className="mr-2 h-4 w-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Accent Color</Label>
                <Select
                  value={settings.accentColor}
                  onValueChange={(value) => updateSetting("accentColor", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Compact mode</Label>
                  <p className="text-sm text-muted-foreground">Reduce spacing and padding for smaller screens</p>
                </div>
                <Switch
                  checked={settings.compactMode}
                  onCheckedChange={(checked) => updateSetting("compactMode", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Collapse sidebar by default</Label>
                  <p className="text-sm text-muted-foreground">Start with sidebar minimized</p>
                </div>
                <Switch
                  checked={settings.sidebarCollapsed}
                  onCheckedChange={(checked) => updateSetting("sidebarCollapsed", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Productivity Settings */}
        <TabsContent value="productivity" className="space-y-6">
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Productivity & Goals
              </CardTitle>
              <CardDescription>Set your productivity preferences and goals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Daily pomodoro goal</Label>
                <p className="text-sm text-muted-foreground">
                  Aim for {settings.dailyGoal} focus sessions per day
                </p>
                <Slider
                  value={[settings.dailyGoal]}
                  onValueChange={(value) => updateSetting("dailyGoal", value[0])}
                  max={16}
                  min={1}
                  step={1}
                  className="py-4"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show motivational quotes</Label>
                  <p className="text-sm text-muted-foreground">Display inspiring quotes during breaks</p>
                </div>
                <Switch
                  checked={settings.showMotivationalQuotes}
                  onCheckedChange={(checked) => updateSetting("showMotivationalQuotes", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Track detailed statistics</Label>
                  <p className="text-sm text-muted-foreground">Record granular productivity data</p>
                </div>
                <Switch
                  checked={settings.trackDetailedStats}
                  onCheckedChange={(checked) => updateSetting("trackDetailedStats", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Weekly reports</Label>
                  <p className="text-sm text-muted-foreground">Receive weekly productivity summaries</p>
                </div>
                <Switch
                  checked={settings.weeklyReports}
                  onCheckedChange={(checked) => updateSetting("weeklyReports", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy & Data Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Privacy & Data Management
              </CardTitle>
              <CardDescription>Control your data and privacy settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Sync across devices</Label>
                  <p className="text-sm text-muted-foreground">Keep your data synchronized across all devices</p>
                </div>
                <Switch
                  checked={settings.syncAcrossDevices}
                  onCheckedChange={(checked) => updateSetting("syncAcrossDevices", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Share anonymous usage data</Label>
                  <p className="text-sm text-muted-foreground">Help improve TimeOut by sharing anonymous analytics</p>
                </div>
                <Switch
                  checked={settings.shareAnonymousData}
                  onCheckedChange={(checked) => updateSetting("shareAnonymousData", checked)}
                />
              </div>

              <div className="space-y-3">
                <Label>Data retention period</Label>
                <p className="text-sm text-muted-foreground">How long to keep your historical data</p>
                <Select
                  value={settings.dataRetention}
                  onValueChange={(value) => updateSetting("dataRetention", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3months">3 months</SelectItem>
                    <SelectItem value="6months">6 months</SelectItem>
                    <SelectItem value="1year">1 year</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center">
                  <Database className="mr-2 h-4 w-4" />
                  Data Management
                </h4>
                
                <div className="flex space-x-3">
                  <Button onClick={exportData} variant="outline" className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Export My Data
                  </Button>
                  
                  <Button onClick={clearData} variant="destructive" className="flex-1">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All Data
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Export your data to keep a backup, or permanently delete all your TimeOut data.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button variant="outline">Cancel</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  );
};