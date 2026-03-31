import { useState } from "react"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import {
  Monitor,
  Moon,
  Sun,
  Palette,
  LayoutTemplate,
  Globe,
  Clock,
  Calendar,
  Zap,
  Save,
  Sidebar,
  Activity,
  CheckCircle2,
  Settings
} from "lucide-react"
import { useTheme } from "next-themes"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSettingsStore, ThemeType } from "@/store/settingsStore"
import { useToast } from "@/hooks/use-toast"

export function GeneralSettings() {
  const { t } = useTranslation(['settings', 'common'])
  const { theme, setTheme } = useSettingsStore()
  const { setTheme: setNextTheme } = useTheme()
  const { toast } = useToast()

  const [accentColor, setAccentColor] = useState('purple')
  const [density, setDensity] = useState('comfortable')
  const [language, setLanguage] = useState('en')
  const [timezone, setTimezone] = useState('UTC')
  const [startWeek, setStartWeek] = useState('monday')

  const [enableAnimations, setEnableAnimations] = useState(true)
  const [autoSave, setAutoSave] = useState(false)
  const [compactSidebar, setCompactSidebar] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))
    setIsSaving(false)
    
    toast({
      description: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>✓ Settings saved successfully</span>
        </div>
      ),
    })
  }

  const handleThemeChange = async (value: ThemeType) => {
    await setTheme(value)
    setNextTheme(value)
  }

  const colors = [
    { id: 'purple', class: 'bg-purple-500' },
    { id: 'blue', class: 'bg-blue-500' },
    { id: 'green', class: 'bg-emerald-500' },
    { id: 'orange', class: 'bg-orange-500' },
  ]

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.1, duration: 0.4 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  }

  return (
    <motion.div 
      className="space-y-6 pb-24 relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Appearance Card */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-[16px] border-white/10 bg-white/[0.02] shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.2)] hover:-translate-y-1">
          <CardHeader className="p-[24px] pb-4 border-b border-white/5">
            <CardTitle className="text-xl flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-400" />
              Appearance
            </CardTitle>
            <CardDescription className="text-white/50">
              Customize how the application looks and feels.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-[24px] space-y-8">
            {/* Theme Mode Segmented Control */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-white/80">Theme Mode</Label>
              <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-lg max-w-md">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    theme === 'light' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Sun className="h-4 w-4" /> Light
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    theme === 'dark' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Moon className="h-4 w-4" /> Dark
                </button>
                <button
                  onClick={() => handleThemeChange('system')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    theme === 'system' ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Monitor className="h-4 w-4" /> System
                </button>
              </div>
            </div>

            {/* Accent Color */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-white/80">Accent Color</Label>
              <div className="flex gap-4">
                {colors.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setAccentColor(c.id)}
                    className={`w-8 h-8 rounded-full ${c.class} ring-offset-2 ring-offset-[#050510] transition-all duration-200 ${
                      accentColor === c.id ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* UI Density */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-white/80 flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4 text-white/50" />
                UI Density
              </Label>
              <Select value={density} onValueChange={setDensity}>
                <SelectTrigger className="max-w-md bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select density" />
                </SelectTrigger>
                <SelectContent className="bg-[#0f0f1a] border-white/10 text-white">
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Preferences Card */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-[16px] border-white/10 bg-white/[0.02] shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.2)] hover:-translate-y-1">
          <CardHeader className="p-[24px] pb-4 border-b border-white/5">
            <CardTitle className="text-xl flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-400" />
              Preferences
            </CardTitle>
            <CardDescription className="text-white/50">
              Set your personal preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-[24px] space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl">
              {/* Language */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-white/80 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-white/50" />
                  Language
                </Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f0f1a] border-white/10 text-white">
                    <SelectItem value="en">English (US)</SelectItem>
                    <SelectItem value="zh">中文 (Simplified)</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Timezone */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-white/80 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-white/50" />
                  Timezone
                </Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f0f1a] border-white/10 text-white">
                    <SelectItem value="UTC">UTC (Universal Time)</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time (US)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (US)</SelectItem>
                    <SelectItem value="Asia/Shanghai">China Standard Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Week On */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-white/80 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-white/50" />
                  Start Week On
                </Label>
                <Select value={startWeek} onValueChange={setStartWeek}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f0f1a] border-white/10 text-white">
                    <SelectItem value="sunday">Sunday</SelectItem>
                    <SelectItem value="monday">Monday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Interface Behavior Card */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-[16px] border-white/10 bg-white/[0.02] shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.2)] hover:-translate-y-1">
          <CardHeader className="p-[24px] pb-4 border-b border-white/5">
            <CardTitle className="text-xl flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              Interface Behavior
            </CardTitle>
            <CardDescription className="text-white/50">
              Control how the interface behaves.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-[24px] space-y-6 max-w-2xl">
            {/* Enable Animations */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-white/90">Enable Animations</Label>
                <p className="text-xs text-white/50">Show smooth transitions and hover effects</p>
              </div>
              <Switch 
                checked={enableAnimations} 
                onCheckedChange={setEnableAnimations}
                className="data-[state=checked]:bg-purple-500"
              />
            </div>

            {/* Auto Save */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-white/90">Auto Save Settings</Label>
                <p className="text-xs text-white/50">Save changes instantly without button click</p>
              </div>
              <Switch 
                checked={autoSave} 
                onCheckedChange={setAutoSave}
                className="data-[state=checked]:bg-purple-500"
              />
            </div>

            {/* Compact Sidebar */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-white/90 flex items-center gap-2">
                  <Sidebar className="h-4 w-4" /> Compact Sidebar
                </Label>
                <p className="text-xs text-white/50">Use a minimalist sidebar with icons only</p>
              </div>
              <Switch 
                checked={compactSidebar} 
                onCheckedChange={setCompactSidebar}
                className="data-[state=checked]:bg-purple-500"
              />
            </div>

            {/* Reduce Motion */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-white/90 flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Reduce Motion
                </Label>
                <p className="text-xs text-white/50">Disable all non-essential animations for accessibility</p>
              </div>
              <Switch 
                checked={reduceMotion} 
                onCheckedChange={setReduceMotion}
                className="data-[state=checked]:bg-purple-500"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sticky Save Button */}
      <motion.div 
        variants={itemVariants}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 md:left-auto md:right-8 md:translate-x-0"
      >
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="h-12 px-8 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_16px_48px_rgba(168,85,247,0.4)]"
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-white/50 border-t-white animate-spin" />
              Saving...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </div>
          )}
        </Button>
      </motion.div>
    </motion.div>
  )
}
