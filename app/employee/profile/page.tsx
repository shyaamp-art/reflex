'use client';

import React, { useState } from 'react';
import { User, Mail, MapPin, Clock, Plus, Trash2, Save, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Chip } from '@/components/ui/chip';
import { getStoredSession } from '@/lib/auth';
import { toast } from 'sonner';

export default function EmployeeProfileSelfPage() {
  const session = getStoredSession();

  const [team, setTeam] = useState('Backend');
  const [location, setLocation] = useState('Bengaluru, IN (IST)');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  const [skills, setSkills] = useState([
    { name: 'node.js', proficiency: 'EXPERT' },
    { name: 'stripe', proficiency: 'ADVANCED' },
    { name: 'sql', proficiency: 'ADVANCED' },
    { name: 'testing', proficiency: 'INTERMEDIATE' },
  ]);

  const [newSkill, setNewSkill] = useState('');

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    setSkills((prev) => [...prev, { name: newSkill.trim().toLowerCase(), proficiency: 'INTERMEDIATE' }]);
    setNewSkill('');
    toast.success('Skill added to profile');
  };

  const handleSave = () => {
    toast.success('Profile and skills updated successfully');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Profile & Competency Matrix</h1>
        <p className="text-sm text-muted-foreground">
          Maintain your contact hub, timezone preferences, and verified technical proficiencies.
        </p>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-semibold">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Full Name (System Managed)</label>
              <Input value={session.name} disabled className="bg-muted/50" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Work Email (System Managed)</label>
              <Input value={session.email} disabled className="bg-muted/50" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Assigned Team</label>
              <Input value={team} onChange={(e) => setTeam(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Location Hub</label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">Local Timezone</label>
              <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Skills & Experience</CardTitle>
            <CardDescription className="text-xs">Technologies you are ready to be allocated to</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Input
              placeholder="e.g. docker"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="h-8 text-xs w-32"
            />
            <Button size="sm" onClick={handleAddSkill}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="divide-y divide-border/60">
            {skills.map((s, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <span className="font-mono text-sm font-semibold">{s.name}</span>
                <div className="flex items-center gap-2">
                  <Chip variant="secondary">{s.proficiency}</Chip>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setSkills((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="font-semibold shadow-sm">
          <Save className="w-4 h-4 mr-1.5" /> Save Changes
        </Button>
      </div>
    </div>
  );
}
