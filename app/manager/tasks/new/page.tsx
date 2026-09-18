'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Sparkles,
  UserCheck,
  Plus,
  Trash2,
  AlertTriangle,
  Search,
  Check,
  X,
  ChevronRight,
  ShieldCheck,
  Clock,
  ArrowRight,
  SlidersHorizontal,
  Star,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Chip } from '@/components/ui/chip';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useUiStore } from '@/lib/store/ui';
import { INITIAL_EMPLOYEES, INITIAL_SKILLS } from '@/lib/data/mockData';
import { AiSuggestion, Employee, Priority, Proficiency, RequirementType, RequiredLocation } from '@/lib/types';

// Zod Schema matching Section 5.3
const skillRowSchema = z.object({
  skill_name: z.string().min(1, 'Skill is required'),
  proficiency: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const),
  people_required: z.number().min(1, 'At least 1 person'),
  requirement_type: z.enum(['MUST_HAVE', 'NICE_TO_HAVE'] as const),
});

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120, 'Max 120 characters'),
  description: z.string().min(1, 'Description is required').max(2000, 'Max 2000 characters'),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const),
  sla_deadline: z.string().min(1, 'SLA Deadline is required'),
  estimated_effort: z.number().min(1, 'Estimated effort must be > 0'),
  effort_unit: z.enum(['hours', 'days'] as const),
  required_location: z.enum(['REMOTE', 'ONSITE', 'HYBRID'] as const),
  project_client: z.string().optional(),
  tags: z.string().optional(),
  skills: z.array(skillRowSchema).refine(
    (skills) => skills.some((s) => s.requirement_type === 'MUST_HAVE'),
    { message: 'At least one MUST_HAVE skill requirement is mandatory before allocation' }
  ),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export default function CreateTaskPage() {
  const router = useRouter();
  const openDrawerModal = useUiStore((s) => s.openDrawerModal);

  const [allocationMode, setAllocationMode] = useState<'AI' | 'MANUAL'>('AI');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [acceptedCandidates, setAcceptedCandidates] = useState<{ employee: Employee; roleNote: string }[]>([]);

  // Manual Mode State
  const [manualSearch, setManualSearch] = useState('');
  const [manualTeamFilter, setManualTeamFilter] = useState('ALL');
  const [manualSelected, setManualSelected] = useState<Map<string, { employee: Employee; roleNote: string }>>(
    new Map()
  );

  // Default SLA: 5 days from now
  const defaultSla = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 16);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: 'Payment Integration',
      description: 'Implement end-to-end payment gateway with Stripe webhook processing and fault-tolerant retry engine.',
      priority: 'HIGH',
      sla_deadline: defaultSla,
      estimated_effort: 40,
      effort_unit: 'hours',
      required_location: 'REMOTE',
      project_client: 'Checkout Modernization',
      tags: 'stripe, payments, node.js',
      skills: [
        { skill_name: 'node.js', proficiency: 'EXPERT', people_required: 1, requirement_type: 'MUST_HAVE' },
        { skill_name: 'stripe', proficiency: 'EXPERT', people_required: 1, requirement_type: 'MUST_HAVE' },
        { skill_name: 'testing', proficiency: 'INTERMEDIATE', people_required: 1, requirement_type: 'NICE_TO_HAVE' },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'skills',
  });

  // Handle Get AI Suggestions
  const handleGetAiSuggestions = () => {
    const isValid = form.trigger(['title', 'skills']);
    if (!isValid) return;

    setIsGeneratingAi(true);
    setTimeout(() => {
      // 3 realistic candidates matching demo flow
      const suggestions: AiSuggestion[] = [
        {
          employee: INITIAL_EMPLOYEES.find((e) => e.name === 'Arjun Mehta') || INITIAL_EMPLOYEES[2],
          score: 94,
          reason: 'Highest raw skill match (Expert Node.js & Stripe), but skipped due to 92% existing workload creating critical SLA safety risk.',
          breakdown: {
            skillMatch: 99,
            workload: 18, // Overloaded penalty
            slaSafety: 35,
            performance: 98,
            location: 90,
          },
        },
        {
          employee: INITIAL_EMPLOYEES.find((e) => e.name === 'Vikram Malhotra') || INITIAL_EMPLOYEES[1],
          score: 92,
          reason: 'Optimal candidate: Expert in Stripe & Node.js, 30% current workload with high available capacity and zero SLA conflicts.',
          breakdown: {
            skillMatch: 95,
            workload: 92,
            slaSafety: 98,
            performance: 94,
            location: 90,
          },
        },
        {
          employee: INITIAL_EMPLOYEES.find((e) => e.name === 'Priya Sharma') || INITIAL_EMPLOYEES[0],
          score: 86,
          reason: 'Strong backend profile (Node.js Expert, Stripe Advanced), 45% workload, good SLA track record.',
          breakdown: {
            skillMatch: 88,
            workload: 85,
            slaSafety: 90,
            performance: 96,
            location: 95,
          },
        },
      ];

      setAiSuggestions(suggestions);
      setIsGeneratingAi(false);
      toast.success('Generated 3 AI allocation proposals based on workforce matrix');
    }, 600);
  };

  const handleAcceptCandidate = (s: AiSuggestion) => {
    if (acceptedCandidates.some((c) => c.employee.id === s.employee.id)) {
      toast.info(`${s.employee.name} is already selected`);
      return;
    }
    setAcceptedCandidates((prev) => [...prev, { employee: s.employee, roleNote: 'Primary Payment Architect' }]);
    setAiSuggestions((prev) => prev.filter((item) => item.employee.id !== s.employee.id));
    toast.success(`Accepted ${s.employee.name} for task allocation`);
  };

  const handleRejectCandidate = (s: AiSuggestion) => {
    setAiSuggestions((prev) => prev.filter((item) => item.employee.id !== s.employee.id));
    toast.info(`Candidate rejected from recommendation list`);
  };

  const handleViewBreakdown = (s: AiSuggestion) => {
    openDrawerModal('reasoning', {
      candidateName: s.employee.name,
      score: s.score,
      reason: s.reason,
      breakdown: s.breakdown,
    });
  };

  // Manual mode selection toggle
  const toggleManualSelection = (emp: Employee) => {
    setManualSelected((prev) => {
      const next = new Map(prev);
      if (next.has(emp.id)) {
        next.delete(emp.id);
      } else {
        next.set(emp.id, { employee: emp, roleNote: 'Backend + Payments' });
      }
      return next;
    });
  };

  const handleFinalSubmit = form.handleSubmit((values) => {
    if (allocationMode === 'AI' && acceptedCandidates.length === 0) {
      toast.error('Please accept at least one AI suggested candidate or switch to manual selection');
      return;
    }

    if (allocationMode === 'MANUAL' && manualSelected.size === 0) {
      toast.error('Please select at least one employee from the list');
      return;
    }

    const assignedNames =
      allocationMode === 'AI'
        ? acceptedCandidates.map((c) => c.employee.name).join(', ')
        : Array.from(manualSelected.values())
            .map((c) => c.employee.name)
            .join(', ');

    toast.success(`Task "${values.title}" created and allocated to ${assignedNames}!`);
    router.push('/manager/tasks');
  });

  const filteredEmployees = INITIAL_EMPLOYEES.filter((emp) => {
    const matchSearch =
      emp.name.toLowerCase().includes(manualSearch.toLowerCase()) ||
      emp.role_title?.toLowerCase().includes(manualSearch.toLowerCase());
    const matchTeam = manualTeamFilter === 'ALL' || emp.team === manualTeamFilter;
    return matchSearch && matchTeam;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-28">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create / Allocate Task</h1>
        <p className="text-sm text-muted-foreground">
          Define task scope, configure skill requirements cart, and execute autonomous or manual allocation in a single window.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={handleFinalSubmit} className="space-y-8">
          {/* SECTION A: Basic Task Info */}
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-semibold">Section A · Task Specification</CardTitle>
              <CardDescription className="text-xs">Primary attributes, priority level, and SLA constraints</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Task Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Payment Integration" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Describe scope, acceptance criteria, and architecture notes..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CRITICAL">CRITICAL (Red)</SelectItem>
                          <SelectItem value="HIGH">HIGH (Orange)</SelectItem>
                          <SelectItem value="MEDIUM">MEDIUM (Amber)</SelectItem>
                          <SelectItem value="LOW">LOW (Slate)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sla_deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SLA / Hard Deadline *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 items-end">
                  <FormField
                    control={form.control}
                    name="estimated_effort"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Estimated Effort *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="effort_unit"
                    render={({ field }) => (
                      <FormItem className="w-28">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="hours">Hours</SelectItem>
                            <SelectItem value="days">Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="required_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Requirement</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="REMOTE">REMOTE</SelectItem>
                          <SelectItem value="ONSITE">ONSITE</SelectItem>
                          <SelectItem value="HYBRID">HYBRID</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="project_client"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project / Client</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Checkout Core" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (Comma separated)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. stripe, payments, node.js" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* SECTION B: Skill Requirements (Cart) */}
          <Card>
            <CardHeader className="border-b pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Section B · Skill Requirements Cart</CardTitle>
                <CardDescription className="text-xs">
                  At least one MUST_HAVE requirement is required. Duplicate skills are disallowed.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    skill_name: 'sql',
                    proficiency: 'INTERMEDIATE',
                    people_required: 1,
                    requirement_type: 'NICE_TO_HAVE',
                  })
                }
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Skill Requirement
              </Button>
            </CardHeader>

            <CardContent className="p-6 space-y-3">
              {fields.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 rounded-lg border bg-muted/20 items-center"
                >
                  <div className="md:col-span-4">
                    <Label className="text-[11px] text-muted-foreground block mb-1">Skill</Label>
                    <Select
                      defaultValue={form.watch(`skills.${index}.skill_name`)}
                      onValueChange={(val) => form.setValue(`skills.${index}.skill_name`, val)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select skill" />
                      </SelectTrigger>
                      <SelectContent>
                        {INITIAL_SKILLS.map((s) => (
                          <SelectItem key={s.name} value={s.name}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-3">
                    <Label className="text-[11px] text-muted-foreground block mb-1">Proficiency</Label>
                    <Select
                      defaultValue={form.watch(`skills.${index}.proficiency`)}
                      onValueChange={(val: Proficiency) => form.setValue(`skills.${index}.proficiency`, val)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BEGINNER">BEGINNER</SelectItem>
                        <SelectItem value="INTERMEDIATE">INTERMEDIATE</SelectItem>
                        <SelectItem value="ADVANCED">ADVANCED</SelectItem>
                        <SelectItem value="EXPERT">EXPERT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-[11px] text-muted-foreground block mb-1">People</Label>
                    <Input
                      type="number"
                      min={1}
                      className="h-9"
                      defaultValue={form.watch(`skills.${index}.people_required`)}
                      onChange={(e) => form.setValue(`skills.${index}.people_required`, Number(e.target.value))}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-[11px] text-muted-foreground block mb-1">Requirement</Label>
                    <Select
                      defaultValue={form.watch(`skills.${index}.requirement_type`)}
                      onValueChange={(val: RequirementType) => form.setValue(`skills.${index}.requirement_type`, val)}
                    >
                      <SelectTrigger className="h-9 font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MUST_HAVE" className="text-red-600 font-bold">
                          MUST_HAVE
                        </SelectItem>
                        <SelectItem value="NICE_TO_HAVE">NICE_TO_HAVE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-1 flex justify-end md:justify-center pt-2 md:pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      disabled={fields.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {form.formState.errors.skills?.root && (
                <p className="text-xs text-destructive mt-2">{form.formState.errors.skills.root.message}</p>
              )}
            </CardContent>
          </Card>

          {/* SECTION C: Allocation Method */}
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-semibold">Section C · Allocation Methodology</CardTitle>
              <CardDescription className="text-xs">Choose between autonomous AI decisioning or direct manual selection</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setAllocationMode('AI')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                    allocationMode === 'AI'
                      ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                      : 'border-border/60 hover:border-primary/40'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      AI Autonomous Suggestion
                      {allocationMode === 'AI' && <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.2 rounded font-bold">Active</span>}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Multi-factor scoring: skill match, workload headroom, SLA risk safety, and historical ratings.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setAllocationMode('MANUAL')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                    allocationMode === 'MANUAL'
                      ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                      : 'border-border/60 hover:border-primary/40'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-muted text-foreground mt-0.5">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      Manual Selection
                      {allocationMode === 'MANUAL' && <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.2 rounded font-bold">Active</span>}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Filter engineers by team, availability, and load. Manually assign role notes and confirmed seats.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION D: Dynamic Content Based on Method */}
          {allocationMode === 'AI' ? (
            <Card>
              <CardHeader className="border-b pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Section D-AI · AI Recommendations Matrix</CardTitle>
                  <CardDescription className="text-xs">
                    Review explainable match scores, inspect factor breakdowns, and accept candidates.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={handleGetAiSuggestions}
                  disabled={isGeneratingAi}
                  className="font-semibold shadow-sm"
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  {isGeneratingAi ? 'Evaluating Candidates...' : 'Get AI Suggestions'}
                </Button>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                {/* Accepted Candidates Section */}
                {acceptedCandidates.length > 0 && (
                  <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> Selected Candidates ({acceptedCandidates.length})
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 text-muted-foreground"
                        onClick={() => setAcceptedCandidates([])}
                      >
                        Clear All
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {acceptedCandidates.map((c, i) => (
                        <div key={c.employee.id} className="flex items-center justify-between gap-4 bg-background p-3 rounded-lg border">
                          <div>
                            <span className="font-semibold text-sm">{c.employee.name}</span>
                            <span className="text-xs text-muted-foreground block">{c.employee.role_title} · {c.employee.team}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Role note (e.g. Lead Architect)"
                              value={c.roleNote}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAcceptedCandidates((prev) =>
                                  prev.map((item, idx) => (idx === i ? { ...item, roleNote: val } : item))
                                );
                              }}
                              className="h-8 text-xs w-48"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setAcceptedCandidates((prev) => prev.filter((_, idx) => idx !== i))}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Candidate Suggestion Cards matching Spec Section 5.3 Exact Layout */}
                {aiSuggestions.length === 0 && acceptedCandidates.length === 0 ? (
                  <div className="p-12 text-center border border-dashed rounded-xl space-y-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Ready to evaluate workforce</h4>
                      <p className="text-xs text-muted-foreground">
                        Click <strong>[Get AI Suggestions]</strong> above to evaluate available engineers against required Stripe & Node.js skills.
                      </p>
                    </div>
                  </div>
                ) : (
                  aiSuggestions.map((s) => {
                    // Color coding on the Score: 80-100 green, 60-79 amber, <60 slate
                    const scoreColor =
                      s.score >= 80
                        ? 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40'
                        : s.score >= 60
                        ? 'text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40'
                        : 'text-slate-600 border-slate-300 bg-slate-100 dark:bg-slate-800';

                    return (
                      <div
                        key={s.employee.id}
                        className="border rounded-xl p-5 bg-card hover:shadow-md transition-shadow space-y-3.5"
                      >
                        {/* Top Header: Avatar, Name, Role and Score */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20">
                              {s.employee.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-foreground">{s.employee.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {s.employee.role_title} · {s.employee.team} · {s.employee.location}
                              </p>
                            </div>
                          </div>

                          <div className={`px-3 py-1 rounded-full border font-mono font-bold text-sm ${scoreColor}`}>
                            Score: {s.score} / 100
                          </div>
                        </div>

                        {/* Skills & Metrics */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-xs font-semibold text-muted-foreground mr-1">Skills:</span>
                          <Chip variant="secondary" className="font-mono text-[11px]">Node.js Expert</Chip>
                          <Chip variant="secondary" className="font-mono text-[11px]">Stripe Expert</Chip>
                          <Chip variant="secondary" className="font-mono text-[11px]">SQL Advanced</Chip>
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground border-y py-2.5 gap-4">
                          <div className="flex items-center gap-2">
                            <span>Workload: <strong>{s.employee.current_workload_percent}%</strong></span>
                            <div className="w-20 bg-muted h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  s.employee.current_workload_percent > 85
                                    ? 'bg-red-500'
                                    : s.employee.current_workload_percent > 60
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${s.employee.current_workload_percent}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                            <Check className="w-4 h-4" /> Available
                          </div>

                          <div className="flex items-center gap-1">
                            <span>Performance:</span>
                            <span className="text-amber-500 flex items-center">
                              ★★★★<span className="text-muted-foreground/40">★</span>
                            </span>
                            <span className="font-mono font-semibold ml-1">({s.employee.performance_score})</span>
                          </div>
                        </div>

                        {/* Why / Reason Section (ALWAYS SHOWN) */}
                        <div className="p-3 rounded-lg bg-muted/40 text-xs space-y-1">
                          <span className="font-bold uppercase text-[10px] text-muted-foreground block">
                            Why:
                          </span>
                          <p className="text-foreground font-medium leading-relaxed">{s.reason}</p>
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleAcceptCandidate(s)}
                              className="font-semibold shadow-sm"
                            >
                              <Check className="w-4 h-4 mr-1" /> Accept
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectCandidate(s)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              Reject
                            </Button>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewBreakdown(s)}
                            className="text-xs text-primary font-medium flex items-center gap-1"
                          >
                            View Details <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          ) : (
            /* SECTION D-MANUAL */
            <Card>
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-base font-semibold">Section D-Manual · Direct Staffing Directory</CardTitle>
                <CardDescription className="text-xs">Filter employees and select assignees</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Search and Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-8 relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search employee by name (e.g. Priya)..."
                      value={manualSearch}
                      onChange={(e) => setManualSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <Select value={manualTeamFilter} onValueChange={setManualTeamFilter}>
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

                {/* Employee List */}
                <div className="border rounded-lg max-h-96 overflow-y-auto divide-y divide-border/60">
                  {filteredEmployees.map((emp) => {
                    const isSelected = manualSelected.has(emp.id);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => toggleManualSelection(emp)}
                        className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Controlled by row click
                            className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <p className="font-semibold text-sm">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {emp.role_title} · {emp.team} · {emp.location}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                          <div className="text-right">
                            <span className="font-mono font-medium block">{emp.current_workload_percent}% load</span>
                            <span className="text-[10px] text-emerald-600 font-semibold">Available</span>
                          </div>
                          <div className="text-amber-500 font-mono font-bold">★ {emp.performance_score}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Sticky Panel */}
                {manualSelected.size > 0 && (
                  <div className="p-4 rounded-xl border border-primary/40 bg-primary/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-primary">
                        Selected Assignees ({manualSelected.size})
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => setManualSelected(new Map())}
                      >
                        Clear Selection
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {Array.from(manualSelected.values()).map(({ employee, roleNote }) => (
                        <div key={employee.id} className="flex items-center justify-between gap-3 bg-background p-2.5 rounded-lg border">
                          <div>
                            <span className="font-semibold text-xs">{employee.name}</span>
                            <span className="text-[11px] text-muted-foreground block">{employee.team}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Role note (e.g. Backend + Payments)"
                              value={roleNote}
                              onChange={(e) => {
                                const val = e.target.value;
                                setManualSelected((prev) => {
                                  const next = new Map(prev);
                                  next.set(employee.id, { employee, roleNote: val });
                                  return next;
                                });
                              }}
                              className="h-8 text-xs w-48"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => toggleManualSelection(employee)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* SECTION E: Sticky Footer */}
          <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border/70 p-4 z-40 shadow-2xl">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/manager/tasks')}
              >
                Cancel
              </Button>

              <div className="flex items-center gap-3">
                {allocationMode === 'AI' ? (
                  <Button type="submit" className="font-semibold shadow-md shadow-primary/20">
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Create Task & Confirm AI Allocation ({acceptedCandidates.length})
                  </Button>
                ) : (
                  <Button type="submit" className="font-semibold shadow-md shadow-primary/20">
                    <UserCheck className="w-4 h-4 mr-1.5" />
                    Create Task & Confirm Manual Allocation ({manualSelected.size})
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
