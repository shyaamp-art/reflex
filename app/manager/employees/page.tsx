'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Check,
  UserPlus,
  ArrowRight,
  Star,
  MapPin,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Chip } from '@/components/ui/chip';
import { INITIAL_EMPLOYEES } from '@/lib/data/mockData';
import { useUiStore } from '@/lib/store/ui';

export default function EmployeesPage() {
  const router = useRouter();
  const openDrawerModal = useUiStore((s) => s.openDrawerModal);

  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('ALL');

  const filteredEmployees = INITIAL_EMPLOYEES.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.role_title?.toLowerCase().includes(search.toLowerCase());
    const matchTeam = teamFilter === 'ALL' || e.team === teamFilter;
    return matchSearch && matchTeam;
  });

  const handleAssignToTask = (employeeId: string) => {
    openDrawerModal('task-picker', { employeeId });
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Employee Directory</h1>
          <p className="text-sm text-muted-foreground">
            Engineer profiles, real-time workload capacity, skill matrices, and quick staffing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="border rounded-lg p-0.5 flex bg-muted/30">
            <Button
              variant={viewMode === 'CARDS' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('CARDS')}
              className="h-8 text-xs font-semibold"
            >
              <LayoutGrid className="w-3.5 h-3.5 mr-1.5" /> Cards
            </Button>
            <Button
              variant={viewMode === 'TABLE' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('TABLE')}
              className="h-8 text-xs font-semibold"
            >
              <TableIcon className="w-3.5 h-3.5 mr-1.5" /> Table
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-card p-4 rounded-xl border">
        <div className="sm:col-span-8 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employee by name, role (e.g. Priya, Platform)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="sm:col-span-4">
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Team filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Teams</SelectItem>
              <SelectItem value="Backend">Backend</SelectItem>
              <SelectItem value="Frontend">Frontend</SelectItem>
              <SelectItem value="QA">QA</SelectItem>
              <SelectItem value="Platform">Platform</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* CARDS VIEW */}
      {viewMode === 'CARDS' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => {
            const load = emp.current_workload_percent;
            const loadColor =
              load > 85 ? 'text-red-600' : load >= 60 ? 'text-amber-600' : 'text-emerald-600';

            return (
              <Card key={emp.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <h4
                          onClick={() => router.push(`/manager/employees/${emp.id}`)}
                          className="font-bold text-sm text-foreground hover:text-primary cursor-pointer"
                        >
                          {emp.name}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-snug">{emp.role_title}</p>
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-amber-500 flex items-center gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-500" /> {emp.performance_score}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground/60" /> {emp.location}
                    </span>
                    <span className="font-semibold bg-muted px-2 py-0.5 rounded text-[10px]">
                      {emp.team}
                    </span>
                  </div>

                  {/* Workload bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Workload</span>
                      <span className={`font-mono font-bold ${loadColor}`}>{load}%</span>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          load > 85 ? 'bg-red-500' : load >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${load}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-5 border-t border-border/60 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs flex-1"
                    onClick={() => router.push(`/manager/employees/${emp.id}`)}
                  >
                    View Profile
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs flex-1"
                    onClick={() => handleAssignToTask(emp.id)}
                  >
                    Assign to Task
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs font-bold uppercase text-muted-foreground border-b">
                <tr>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Team</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Workload</th>
                  <th className="p-3.5">Perf</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5 font-semibold text-foreground">
                      <span
                        onClick={() => router.push(`/manager/employees/${emp.id}`)}
                        className="cursor-pointer hover:text-primary"
                      >
                        {emp.name}
                      </span>
                    </td>
                    <td className="p-3.5 text-xs text-muted-foreground">{emp.role_title}</td>
                    <td className="p-3.5 text-xs">{emp.team}</td>
                    <td className="p-3.5 text-xs text-muted-foreground">{emp.location}</td>
                    <td className="p-3.5 font-mono text-xs font-bold">{emp.current_workload_percent}%</td>
                    <td className="p-3.5 text-xs text-amber-500 font-bold">★ {emp.performance_score}</td>
                    <td className="p-3.5">
                      <Chip variant={emp.status === 'ACTIVE' ? 'completed' : 'unassigned'}>
                        {emp.status}
                      </Chip>
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => handleAssignToTask(emp.id)}
                      >
                        Assign Task
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
