import React, { createContext, useContext, useState, useMemo } from 'react';
import { INITIAL_EMPLOYEES, INITIAL_TASKS } from '../types/data';

const WorkforceContext = createContext(null);

export const WorkforceProvider = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      type: 'info',
      title: 'AI Decision Engine Active',
      message: 'Workforce capacity telemetry synchronizing in real-time across 4 time zones.',
      timestamp: 'Just now'
    }
  ]);
  const [reallocationHistory, setReallocationHistory] = useState([
    {
      id: 'realloc-1',
      taskTitle: 'Global Payments Gateway Integration',
      taskId: 'TASK-101',
      trigger: 'SLA Escalation (Payment Gateway Launch)',
      previousAssigned: ['Elena Rostova (85% busy)'],
      newAssigned: ['Marcus Vance (40% busy)', 'Sarah Chen (65% busy)'],
      reasoning: 'Rebalanced to Marcus Vance & Sarah Chen because Elena Rostova had 85% workload and was at risk of breaching the SLA deadline. Marcus has dedicated Stripe expertise with 60% headroom.',
      slaImpact: 'SLA Risk reduced from 78% High Risk to 12% Low Risk',
      timestamp: '2 hours ago'
    }
  ]);

  const [activeReasoning, setActiveReasoning] = useState(null); // When non-null, opens ReasoningModal
  const [unreadCount, setUnreadCount] = useState(1);

  const addNotification = (notif) => {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: 'Just now',
      ...notif
    };
    setNotifications(prev => [newNotif, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Toggle Employee availability (e.g. Available -> Sick or On Leave)
  const toggleEmployeeAvailability = (empId, newStatus) => {
    setEmployees(prev =>
      prev.map(emp => {
        if (emp.id === empId) {
          const updated = { ...emp, availability: newStatus };
          if (newStatus === 'Sick' || newStatus === 'On Leave') {
            updated.workload = 0;
          } else if (emp.availability === 'Sick' || emp.availability === 'On Leave') {
            updated.workload = 45; // default restored
          }
          return updated;
        }
        return emp;
      })
    );

    const emp = employees.find(e => e.id === empId);
    if (newStatus === 'Sick' || newStatus === 'On Leave') {
      addNotification({
        type: 'reallocation',
        title: `Resource Unavailable: ${emp?.name || 'Engineer'}`,
        message: `${emp?.name} marked as "${newStatus}". Dynamic reallocation triggered for active tasks.`,
        priority: 'high'
      });
      // Check if employee has active tasks, reallocate them
      tasks.forEach(t => {
        if (t.assignedTo.includes(empId) && t.status !== 'Completed') {
          handleAutoReallocateForUnavailable(t.id, empId, emp?.name, newStatus);
        }
      });
    }
  };

  // Dynamic automatic reallocation when an engineer becomes unavailable
  const handleAutoReallocateForUnavailable = (taskId, unavailableEmpId, empName, reason) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Find best replacement candidate who is available and not the same engineer
    const candidates = employees.filter(e => e.id !== unavailableEmpId && e.availability === 'Available');
    // Sort by lowest workload and highest performance
    candidates.sort((a, b) => a.workload - b.workload);
    const replacement = candidates[0];

    if (replacement) {
      const updatedAssigned = task.assignedTo.map(id => id === unavailableEmpId ? replacement.id : id);

      setTasks(prev =>
        prev.map(t => t.id === taskId ? { ...t, assignedTo: updatedAssigned, status: 'In Progress' } : t)
      );

      // Increase replacement workload
      setEmployees(prev =>
        prev.map(e => e.id === replacement.id ? { ...e, workload: Math.min(100, e.workload + 25) } : e)
      );

      const reallocEvent = {
        id: `realloc-${Date.now()}`,
        taskTitle: task.title,
        taskId: task.id,
        trigger: `${empName} unavailable (${reason})`,
        previousAssigned: [empName],
        newAssigned: [replacement.name],
        reasoning: `${empName} became unavailable (${reason}). The AI Engine reassigned ${task.title} to ${replacement.name} due to optimal skill alignment, low current workload (${replacement.workload}%), and 94%+ SLA adherence score.`,
        slaImpact: '0 hours SLA delay. Reassignment completed autonomously in 140ms.',
        timestamp: 'Just now'
      };

      setReallocationHistory(prev => [reallocEvent, ...prev]);

      addNotification({
        type: 'reallocation',
        title: `Dynamic Reallocation Executed: ${task.title}`,
        message: `Reassigned from ${empName} to ${replacement.name}. Click to view AI reasoning.`,
        reasoningData: reallocEvent
      });
    }
  };

  // Simulate urgent high-priority task arrival
  const triggerUrgentTaskSimulation = () => {
    const urgentTask = {
      id: `TASK-P0-${Math.floor(100 + Math.random() * 900)}`,
      title: 'CRITICAL: Multi-Region Payment Webhook Drop Spike',
      description: 'Stripe webhook 500 error cascade affecting 12,000 checkout events. Immediate senior triage and fix required.',
      priority: 'Urgent',
      slaDeadline: new Date(Date.now() + 4 * 3600 * 1000).toISOString().slice(0, 16),
      status: 'In Progress',
      assignedTo: ['emp-2', 'emp-1'], // Preempting Marcus and Sarah
      skillsRequired: [
        { skill: 'Node.js+Stripe', proficiency: 'Expert', people: 1, type: 'Must-have' },
        { skill: 'Node.js', proficiency: 'Expert', people: 1, type: 'Must-have' }
      ],
      reallocationHistory: [
        {
          timestamp: 'Just now',
          reason: 'Urgent P0 Production Incident Preemption',
          action: 'Preempted non-urgent tasks to allocate Marcus Vance & Sarah Chen'
        }
      ]
    };

    setTasks(prev => [urgentTask, ...prev]);

    const reallocEvent = {
      id: `realloc-p0-${Date.now()}`,
      taskTitle: urgentTask.title,
      taskId: urgentTask.id,
      trigger: 'Urgent P0 Incident Arrived (4h SLA)',
      previousAssigned: ['Unassigned'],
      newAssigned: ['Marcus Vance', 'Sarah Chen'],
      reasoning: 'Critical Stripe gateway outage required immediate expert allocation. AI preempted scheduled refactoring tasks from Marcus Vance (Payments Expert) and Sarah Chen (Staff Engineer), prioritizing the critical revenue stream with 100% skill match.',
      slaImpact: 'Avoided $45,000/hr payment failure risk. SLA confidence: 99.4%.',
      timestamp: 'Just now'
    };

    setReallocationHistory(prev => [reallocEvent, ...prev]);

    addNotification({
      type: 'reallocation',
      title: 'P0 Incident Triggered Dynamic Preemption',
      message: 'Marcus Vance & Sarah Chen autonomously mobilized to solve critical payment outage.',
      reasoningData: reallocEvent
    });

    // Switch to Reallocation Center to show the result
    setCurrentScreen('reallocation');
  };

  // Allocate new task
  const allocateTask = (newTaskData, assignedEmpIds, allocationMethod, reasoning = null) => {
    const taskId = `TASK-${Math.floor(100 + Math.random() * 900)}`;
    const fullTask = {
      id: taskId,
      title: newTaskData.title,
      description: newTaskData.description,
      priority: newTaskData.priority,
      slaDeadline: newTaskData.slaDeadline,
      status: assignedEmpIds.length > 0 ? 'Allocated' : 'Backlog',
      assignedTo: assignedEmpIds,
      skillsRequired: newTaskData.skillsRequired,
      reallocationHistory: [
        {
          timestamp: 'Just now',
          reason: `${allocationMethod} Allocation`,
          action: `Assigned to ${assignedEmpIds.map(id => employees.find(e => e.id === id)?.name).filter(Boolean).join(', ')}`
        }
      ]
    };

    setTasks(prev => [fullTask, ...prev]);

    // Update workloads
    setEmployees(prev =>
      prev.map(emp => {
        if (assignedEmpIds.includes(emp.id)) {
          return {
            ...emp,
            workload: Math.min(100, emp.workload + 15),
            activeTasks: [...emp.activeTasks, newTaskData.title]
          };
        }
        return emp;
      })
    );

    const assignedNames = assignedEmpIds
      .map(id => employees.find(e => e.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    const reasoningPayload = {
      id: `alloc-${taskId}`,
      taskTitle: newTaskData.title,
      taskId: taskId,
      trigger: `${allocationMethod} Resource Allocation`,
      previousAssigned: ['Unassigned'],
      newAssigned: assignedNames.split(', '),
      reasoning: reasoning || `Allocated to ${assignedNames} based on optimal skill requirements fit (${newTaskData.skillsRequired.map(s => s.skill).join(', ')}), balanced current capacity, and historical SLA performance.`,
      slaImpact: 'Task scheduled within SLA deadline with 96% projected completion safety margin.',
      timestamp: 'Just now'
    };

    addNotification({
      type: 'success',
      title: `Task Successfully Allocated (${taskId})`,
      message: `Assigned to ${assignedNames}. Click to view AI allocation reasoning.`,
      reasoningData: reasoningPayload
    });

    return reasoningPayload;
  };

  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const availableEmployees = employees.filter(e => e.availability === 'Available').length;
    const avgWorkload = Math.round(employees.reduce((acc, curr) => acc + curr.workload, 0) / totalEmployees);
    const activeTasksCount = tasks.filter(t => t.status !== 'Completed').length;
    const urgentTasksCount = tasks.filter(t => t.priority === 'Urgent' && t.status !== 'Completed').length;

    return {
      totalEmployees,
      availableEmployees,
      avgWorkload,
      activeTasksCount,
      urgentTasksCount,
      reallocationEventsCount: reallocationHistory.length
    };
  }, [employees, tasks, reallocationHistory]);

  return (
    <WorkforceContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        employees,
        setEmployees,
        tasks,
        setTasks,
        notifications,
        unreadCount,
        setUnreadCount,
        reallocationHistory,
        activeReasoning,
        setActiveReasoning,
        addNotification,
        removeNotification,
        toggleEmployeeAvailability,
        triggerUrgentTaskSimulation,
        allocateTask,
        stats
      }}
    >
      {children}
    </WorkforceContext.Provider>
  );
};

export const useWorkforce = () => {
  const context = useContext(WorkforceContext);
  if (!context) {
    throw new Error('useWorkforce must be used within a WorkforceProvider');
  }
  return context;
};
