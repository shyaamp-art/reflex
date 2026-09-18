'use client';

import React, { useState } from 'react';
import {
  Settings,
  Code2,
  Users,
  MapPin,
  Clock,
  Shield,
  Plus,
  Trash2,
  Save,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Chip } from '@/components/ui/chip';
import { INITIAL_SKILLS } from '@/lib/data/mockData';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [skills, setSkills] = useState(INITIAL_SKILLS);
  const [newSkill, setNewSkill] = useState('');
  const [slaLookahead, setSlaLookahead] = useState(4);
  const [slaWindow, setSlaWindow] = useState(1);

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    setSkills((prev) => [...prev, { name: newSkill.trim().toLowerCase(), created_at: new Date().toISOString() }]);
    setNewSkill('');
    toast.success('Skill added to directory');
  };

  const handleDeleteSkill = (name: string) => {
    setSkills((prev) => prev.filter((s) => s.name !== name));
    toast.info(`Removed ${name} from skills directory`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Workforce System Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage master skill directories, organization teams, SLA thresholds, and role assignments.
        </p>
      </div>

      <Tabs defaultValue="skills" className="space-y-4">
        <TabsList className="bg-muted/40 p-1 flex-wrap h-auto">
          <TabsTrigger value="skills" className="text-xs">1. Skills</TabsTrigger>
          <TabsTrigger value="teams" className="text-xs">2. Teams</TabsTrigger>
          <TabsTrigger value="locations" className="text-xs">3. Locations</TabsTrigger>
          <TabsTrigger value="sla" className="text-xs">4. SLA Thresholds</TabsTrigger>
          <TabsTrigger value="priorities" className="text-xs">5. Priorities</TabsTrigger>
          <TabsTrigger value="proficiencies" className="text-xs">6. Proficiencies</TabsTrigger>
          <TabsTrigger value="users" className="text-xs">7. Users & Roles</TabsTrigger>
        </TabsList>

        {/* Tab 1: Skills */}
        <TabsContent value="skills">
          <Card>
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Master Skill Catalog</CardTitle>
                <CardDescription className="text-xs">Global dictionary of assignable competencies</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="New skill (e.g. rust)..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="h-8 text-xs w-40"
                />
                <Button size="sm" onClick={handleAddSkill}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="divide-y divide-border/60">
                {skills.map((s) => (
                  <div key={s.name} className="py-2.5 flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold">{s.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteSkill(s.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Teams */}
        <TabsContent value="teams">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold">Engineering Teams</CardTitle>
              <CardDescription className="text-xs">Free-text departments and squad units</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {['Frontend', 'Backend', 'QA', 'Platform'].map((team) => (
                <div key={team} className="p-3 bg-muted/30 rounded-lg border flex items-center justify-between">
                  <span className="text-sm font-semibold">{team}</span>
                  <Chip variant="outline">Active Squad</Chip>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Locations */}
        <TabsContent value="locations">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold">Authorized Operating Hubs</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {['San Francisco, US (PST)', 'Bengaluru, IN (IST)', 'London, UK (GMT)', 'Berlin, DE (CET)', 'Tokyo, JP (JST)'].map((loc) => (
                <div key={loc} className="p-3 bg-muted/30 rounded-lg border flex items-center justify-between">
                  <span className="text-sm font-semibold">{loc}</span>
                  <Chip variant="assigned">Geo Node</Chip>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: SLA Thresholds */}
        <TabsContent value="sla">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold">SLA Surveillance Automation</CardTitle>
              <CardDescription className="text-xs">Continuous evaluation cron parameters</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Lookahead Window (Hours)</label>
                <Input
                  type="number"
                  value={slaLookahead}
                  onChange={(e) => setSlaLookahead(Number(e.target.value))}
                />
                <p className="text-[11px] text-muted-foreground">Tasks nearing deadline within this duration trigger warning alerts.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Recheck Frequency (Hours)</label>
                <Input
                  type="number"
                  value={slaWindow}
                  onChange={(e) => setSlaWindow(Number(e.target.value))}
                />
              </div>

              <Button onClick={() => toast.success('SLA parameters updated in cron runner')}>
                <Save className="w-4 h-4 mr-1.5" /> Save Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Priorities */}
        <TabsContent value="priorities">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold">Priorities Matrix (Read-Only)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 gap-3">
              <div className="p-3 border rounded-lg bg-red-50/20 border-red-200">
                <span className="font-bold text-red-600 block text-sm">CRITICAL</span>
                <span className="text-xs text-muted-foreground">Immediate escalation, 2-4h response</span>
              </div>
              <div className="p-3 border rounded-lg bg-orange-50/20 border-orange-200">
                <span className="font-bold text-orange-600 block text-sm">HIGH</span>
                <span className="text-xs text-muted-foreground">Same-day priority allocation</span>
              </div>
              <div className="p-3 border rounded-lg bg-amber-50/20 border-amber-200">
                <span className="font-bold text-amber-600 block text-sm">MEDIUM</span>
                <span className="text-xs text-muted-foreground">Standard sprint commitment</span>
              </div>
              <div className="p-3 border rounded-lg bg-slate-50 border-slate-200">
                <span className="font-bold text-slate-600 block text-sm">LOW</span>
                <span className="text-xs text-muted-foreground">Backlog fill & non-urgent</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 6: Proficiencies */}
        <TabsContent value="proficiencies">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold">Proficiency Tiers (Read-Only)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'].map((level) => (
                <div key={level} className="p-3 rounded-lg border flex items-center justify-between">
                  <span className="font-mono font-bold text-xs">{level}</span>
                  <Chip variant="outline">Verified Scale</Chip>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 7: Users & Roles */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold">System RBAC Users</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="p-3 rounded-lg border flex items-center justify-between">
                <div>
                  <span className="font-semibold text-sm">Alex Rivera (manager@reflex.local)</span>
                  <span className="text-xs text-muted-foreground block">Role: MANAGER</span>
                </div>
                <Chip variant="completed">Active Manager</Chip>
              </div>

              <div className="p-3 rounded-lg border flex items-center justify-between">
                <div>
                  <span className="font-semibold text-sm">Priya Sharma (priya@reflex.local)</span>
                  <span className="text-xs text-muted-foreground block">Role: EMPLOYEE</span>
                </div>
                <Chip variant="assigned">Active Employee</Chip>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
