import React, { useState, useEffect, useCallback } from 'react';
import {
  UserSession,
  Task,
  Employee,
  AllocationProposal,
  AppEvent,
  AllocationLog,
  SkillGapEvent,
  AgentSettings,
  AllocationSuggestionResult,
} from './types/index.js';
import { api } from './lib/api.js';
import { Header } from './components/shell/Header.js';
import { Sidebar } from './components/shell/Sidebar.js';
import { ManagerDashboard } from './pages/manager/ManagerDashboard.js';
import { ManagerTasks } from './pages/manager/ManagerTasks.js';
import { ManagerEmployees } from './pages/manager/ManagerEmployees.js';
import { ManagerReallocations } from './pages/manager/ManagerReallocations.js';
import { ManagerSkillGaps } from './pages/manager/ManagerSkillGaps.js';
import { ManagerAudit } from './pages/manager/ManagerAudit.js';
import { ManagerSettings } from './pages/manager/ManagerSettings.js';
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard.js';
import { EmployeeTasks } from './pages/employee/EmployeeTasks.js';
import { EmployeeAvailability } from './pages/employee/EmployeeAvailability.js';
import { EmployeeProfile } from './pages/employee/EmployeeProfile.js';
import { NewTaskModal } from './components/drawers/NewTaskModal.js';
import { AiSuggestionDrawer } from './components/drawers/AiSuggestionDrawer.js';
import { ReallocationModal } from './components/drawers/ReallocationModal.js';
import { TaskDetailModal } from './components/drawers/TaskDetailModal.js';
import { LoginPage } from './pages/LoginPage.js';

export default function App() {
  // Current user state
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Core Data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reallocations, setReallocations] = useState<AllocationProposal[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AllocationLog[]>([]);
  const [skillGaps, setSkillGaps] = useState<SkillGapEvent[]>([]);
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isAiSuggestionOpen, setIsAiSuggestionOpen] = useState(false);
  const [aiSuggestionResult, setAiSuggestionResult] = useState<AllocationSuggestionResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [pendingDraftTask, setPendingDraftTask] = useState<any | null>(null);

  const [activeReallocationProposal, setActiveReallocationProposal] = useState<AllocationProposal | null>(null);
  const [activeDetailTaskId, setActiveDetailTaskId] = useState<string | null>(null);

  // Fetch all core system state
  const refreshAllData = useCallback(async () => {
    try {
      const meRes = await api.getMe();
      setCurrentUser(meRes.user);
      if (meRes.user.role === 'EMPLOYEE') {
        const [settingsRes, skillsRes] = await Promise.all([
          api.getAgentSettings(),
          api.getSkills(),
        ]);
        setSettings(settingsRes.settings);
        setSkills(skillsRes.skills);
        setTasks([]);
        setEmployees([]);
        setReallocations([]);
        setEvents([]);
        setAuditLogs([]);
        setSkillGaps([]);
        return;
      }

      const [
        tasksRes,
        empsRes,
        reallocRes,
        evtsRes,
        auditRes,
        gapsRes,
        settingsRes,
        skillsRes,
      ] = await Promise.all([
        api.getTasks(),
        api.getEmployees(),
        api.getReallocations(),
        api.getEvents({ limit: 20 }),
        api.getAuditLogs(),
        api.getSkillGaps(),
        api.getAgentSettings(),
        api.getSkills(),
      ]);

      setTasks(tasksRes.items);
      setEmployees(empsRes.items);
      setReallocations(reallocRes.items);
      setEvents(evtsRes.items);
      setAuditLogs(auditRes.items);
      setSkillGaps(gapsRes.items);
      setSettings(settingsRes.settings);
      setSkills(skillsRes.skills);
    } catch (err) {
      console.error('Failed to load system data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleLogin = async (username: string, password: string) => {
    try {
      setLoading(true);
      const result = await api.login(username, password);
      setCurrentUser(result.user);
      setCurrentTab(result.user.role === 'EMPLOYEE' ? 'my-dashboard' : 'dashboard');
      await refreshAllData();
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  // Revalidate the session when the server rejects with 401/403: the screen
  // can show a cached manager console while the cookie is gone or belongs to
  // an employee (e.g. signed in elsewhere). Reconciling drops back to the
  // correct portal/login instead of leaving a stale UI behind cryptic alerts.
  const reconcileSessionAfterAuthFailure = useCallback(async () => {
    try {
      const meRes = await api.getMe();
      setCurrentUser((prev) =>
        prev?.authUserId === meRes.user.authUserId && prev?.role === meRes.user.role ? prev : meRes.user
      );
    } catch {
      setCurrentUser(null);
    }
  }, []);

  const handleMutationError = useCallback(
    async (err: any, fallbackMessage: string) => {
      const status = (err as any)?.status;
      if (status === 401 || status === 403) {
        await reconcileSessionAfterAuthFailure();
      }
      alert(err?.message || fallbackMessage);
    },
    [reconcileSessionAfterAuthFailure]
  );

  // Task Creation & AI Suggestion Flow
  const handleAnalyzeTaskSuggestions = async (formData: any) => {
    try {
      setPendingDraftTask(formData);
      setIsNewTaskOpen(false);
      setIsAiSuggestionOpen(true);
      setIsAiLoading(true);

      const result = await api.getAllocationSuggestions(formData);
      setAiSuggestionResult(result);
    } catch (err: any) {
      await handleMutationError(err, 'Error running AI allocation suggestions');
      setIsAiSuggestionOpen(false);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleConfirmAiAllocation = async (selectedEmployeeIds: string[]) => {
    if (!pendingDraftTask) return;
    try {
      // Existing tasks allocate in place; only brand-new drafts create a task.
      if (pendingDraftTask.existingTaskId) {
        await api.allocateExistingTask(pendingDraftTask.existingTaskId, selectedEmployeeIds, {
          allocation_mode: 'AI',
        });
      } else {
        await api.createTask({
          ...pendingDraftTask,
          allocation_mode: 'AI',
          selected_employee_ids: selectedEmployeeIds,
        });
      }
      setIsAiSuggestionOpen(false);
      setPendingDraftTask(null);
      setAiSuggestionResult(null);
      refreshAllData();
      setCurrentTab('tasks');
    } catch (err: any) {
      await handleMutationError(err, 'Error creating task with allocations');
    }
  };

  // Reallocation Actions
  const handleApproveReallocation = async (proposalId: string, note?: string) => {
    try {
      await api.approveReallocation(proposalId, note);
      setActiveReallocationProposal(null);
      refreshAllData();
    } catch (err: any) {
      await handleMutationError(err, 'Error approving reallocation');
    }
  };

  const handleOverrideReallocation = async (proposalId: string, employeeIds: string[], reason: string) => {
    try {
      await api.overrideReallocation(proposalId, employeeIds, reason);
      setActiveReallocationProposal(null);
      refreshAllData();
    } catch (err: any) {
      await handleMutationError(err, 'Error committing manual override');
    }
  };

  // Task Status & Release
  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      await api.updateTaskStatus(taskId, status, currentUser?.name);
      refreshAllData();
    } catch (err: any) {
      await handleMutationError(err, 'Error updating task status');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      refreshAllData();
    } catch (err: any) {
      await handleMutationError(err, 'Error deleting task');
    }
  };

  const handleReleaseAllocation = async (taskId: string, allocationId: string) => {
    try {
      await api.releaseAllocation(taskId, allocationId);
      refreshAllData();
    } catch (err: any) {
      await handleMutationError(err, 'Error releasing allocation');
    }
  };

  const handleRequestSuggestionsForExistingTask = async (task: Task) => {
    const payload = {
      existingTaskId: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      sla_deadline: task.sla_deadline,
      estimated_effort: task.estimated_effort,
      tags: task.tags,
      required_location: task.required_location,
      skill_requirements: task.skill_requirements,
    };
    handleAnalyzeTaskSuggestions(payload);
  };

  if (loading || (currentUser && !settings)) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 text-slate-600">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent mb-4" />
        <p className="font-bold text-slate-800 text-sm tracking-tight">REFLEX DECISION ENGINE</p>
        <p className="text-xs text-slate-400 mt-1">Bootstrapping deterministic allocation & AI models...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // SLA At-Risk count — uses the configurable lookahead and includes breached.
  const lookaheadHours = settings?.sla_lookahead_hours || 4;
  const lookaheadMs = lookaheadHours * 60 * 60 * 1000;
  const now = Date.now();
  const atRiskCount = tasks.filter((t) => {
    const diff = new Date(t.sla_deadline).getTime() - now;
    return t.status !== 'COMPLETED' && diff <= lookaheadMs;
  }).length;

  const pendingReallocationsCount = reallocations.filter((p) => p.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-slate-100/60 font-sans text-slate-900 flex flex-col antialiased">
      {/* Universal Top Header */}
      <Header
        currentUser={currentUser}
        onNewTaskClick={() => setIsNewTaskOpen(true)}
        pendingReallocationsCount={pendingReallocationsCount}
        atRiskCount={atRiskCount}
        onNavigate={setCurrentTab}
      />

      {/* Main Body Layout */}
      <div className="flex flex-1">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          userRole={currentUser.role}
          pendingReallocationsCount={pendingReallocationsCount}
          atRiskTasksCount={atRiskCount}
        />

        {/* Content Viewport */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {/* Manager Views */}
          {currentUser.role === 'MANAGER' && currentTab === 'dashboard' && (
            <ManagerDashboard
              tasks={tasks}
              employees={employees}
              reallocations={reallocations}
              events={events}
              skillGaps={skillGaps}
              onNavigate={setCurrentTab}
              onOpenReallocationModal={setActiveReallocationProposal}
              onNewTaskClick={() => setIsNewTaskOpen(true)}
            />
          )}

          {currentUser.role === 'MANAGER' && currentTab === 'tasks' && (
            <ManagerTasks
              tasks={tasks}
              onNewTaskClick={() => setIsNewTaskOpen(true)}
              onSelectTask={(task) => setActiveDetailTaskId(task.id)}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onDeleteTask={handleDeleteTask}
              onRequestSuggestionsForTask={handleRequestSuggestionsForExistingTask}
            />
          )}

          {currentUser.role === 'MANAGER' && currentTab === 'reallocations' && (
            <ManagerReallocations
              proposals={reallocations}
              employees={employees}
              onOpenModal={setActiveReallocationProposal}
              onApproveDirect={(id) => handleApproveReallocation(id)}
            />
          )}

          {currentUser.role === 'MANAGER' && currentTab === 'employees' && (
            <ManagerEmployees employees={employees} />
          )}

          {currentUser.role === 'MANAGER' && currentTab === 'skill-gaps' && (
            <ManagerSkillGaps
              skillGaps={skillGaps}
              onReviewSkillGap={async (skill) => {
                await api.reviewSkillGap(skill);
                refreshAllData();
              }}
            />
          )}

          {currentUser.role === 'MANAGER' && currentTab === 'audit' && <ManagerAudit logs={auditLogs} />}

          {currentUser.role === 'MANAGER' && currentTab === 'settings' && (
            <ManagerSettings
              settings={settings!}
              onUpdateSettings={async (updated) => {
                const res = await api.updateAgentSettings(updated);
                setSettings(res.settings);
              }}
              skills={skills}
              onAddSkill={async (skill) => {
                const res = await api.addSkill(skill);
                setSkills(res.skills);
              }}
            />
          )}

          {/* Employee Portal Views */}
          {currentTab === 'my-dashboard' && (
            <EmployeeDashboard
              currentUser={currentUser}
              onNavigate={setCurrentTab}
              onOpenLeaveModal={() => setCurrentTab('availability')}
            />
          )}

          {currentTab === 'my-tasks' && <EmployeeTasks currentUser={currentUser} />}

          {currentTab === 'availability' && (
            <EmployeeAvailability currentUser={currentUser} />
          )}

          {currentTab === 'profile' && (
            <EmployeeProfile currentUser={currentUser} availableSkills={skills} />
          )}
        </main>
      </div>

      {/* Interactive Modals & Drawers */}
      <NewTaskModal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        onAnalyzeSuggestions={handleAnalyzeTaskSuggestions}
        availableSkills={skills}
      />

      <AiSuggestionDrawer
        isOpen={isAiSuggestionOpen}
        onClose={() => setIsAiSuggestionOpen(false)}
        result={aiSuggestionResult}
        isLoading={isAiLoading}
        onConfirmSelection={handleConfirmAiAllocation}
        taskTitle={pendingDraftTask?.title || 'New Task'}
      />

      <ReallocationModal
        isOpen={!!activeReallocationProposal}
        onClose={() => setActiveReallocationProposal(null)}
        proposal={activeReallocationProposal}
        employees={employees}
        onApprove={handleApproveReallocation}
        onOverride={handleOverrideReallocation}
      />

      <TaskDetailModal
        taskId={activeDetailTaskId}
        onClose={() => setActiveDetailTaskId(null)}
        onUpdateStatus={handleUpdateTaskStatus}
        onReleaseAllocation={handleReleaseAllocation}
        onRequestSuggestions={handleRequestSuggestionsForExistingTask}
      />
    </div>
  );
}
