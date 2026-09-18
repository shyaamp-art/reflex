'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  User,
  MapPin,
  Clock,
  Star,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ShieldCheck,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { INITIAL_EMPLOYEES, INITIAL_EMPLOYEE_SKILLS, INITIAL_TASKS, INITIAL_ALLOCATION_LOGS } from '@/lib/data/mockData';
import { toast } from 'sonner';
import { useUiStore } from '@/lib/store/ui';

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const openDrawerModal = useUiStore((s) => s.openDrawerModal);

  const empId = (params?.id as string) || 'emp-priya-01';
  const employee = INITIAL_EMPLOYEES.find((e) => e.id === empId) || INITIAL_EMPLOYEES[0];

  const [skills, setSkills] = useState(
    INITIAL_EMPLOYEE_SKILLS[employee.id] || [
      { skill_name: 'node.js', proficiency: 'EXPERT' },
      { skill_name: 'sql', proficiency: 'ADVANCED' },
    ]
  );

  const handleDeactivate = () => {
    openDrawerModal('confirm', {
      title: 'Deactivate Employee',
      description: `Deactivate ${employee.name}? Their active tasks will require immediate reallocation.`,
      tone: 'destructive',
      confirmLabel: 'Deactivate',
      onConfirm: () => {
        toast.warning(`${employee.name} deactivated`);
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* SECTION A: Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary font-bold text-xl flex items-center justify-center border border-primary/20">
            {employee.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{employee.name}</h1>
              <Chip variant="completed">{employee.status}</Chip>
              <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono font-bold">
                {employee.seniority}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {employee.role_title} · {employee.team} Team
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {employee.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {employee.timezone}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              toast.info('Marked as unavailable for 2 days');
            }}
          >
            Mark Unavailable
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={handleDeactivate}>
            Deactivate
          </Button>
        </div>
      </div>

      {/* SECTION B: Workload & Capacity */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-semibold">Workload & Capacity Status</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Current Workload Allocation</span>
            <span className="font-mono font-bold text-base text-foreground">
              {employee.current_workload_percent}%
            </span>
          </div>
          <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                employee.current_workload_percent > 85
                  ? 'bg-red-500'
                  : employee.current_workload_percent >= 60
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${employee.current_workload_percent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>Weekly Capacity: {employee.weekly_capacity_hours} hours</span>
            <span>Active Sprint Tasks: 2</span>
          </div>
        </CardContent>
      </Card>

      {/* SECTION C: Skills Matrix */}
      <Card>
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Verified Skill Matrix</CardTitle>
            <CardDescription className="text-xs">Technologies and proficiency ratings</CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSkills((prev) => [...prev, { skill_name: 'kubernetes', proficiency: 'INTERMEDIATE' }]);
              toast.success('Added skill requirement to profile');
            }}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Skill
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          <div className="divide-y divide-border/60">
            {skills.map((s, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-mono font-semibold text-sm">{s.skill_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Chip variant="outline">{s.proficiency}</Chip>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => setSkills((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SECTION D: Performance */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-semibold">Performance & SLA Reliability</CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="border rounded-lg p-3">
            <span className="text-xs text-muted-foreground block">Rating</span>
            <span className="text-xl font-bold text-amber-500 font-mono">
              ★ {employee.performance_score}
            </span>
          </div>
          <div className="border rounded-lg p-3">
            <span className="text-xs text-muted-foreground block">Completed Tasks</span>
            <span className="text-xl font-bold font-mono">28</span>
          </div>
          <div className="border rounded-lg p-3">
            <span className="text-xs text-muted-foreground block">On-Time SLA Adherence</span>
            <span className="text-xl font-bold text-emerald-600 font-mono">98.2%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
