import React, { useState } from 'react';
import { 
  Sparkles, 
  UserCheck, 
  Trash2, 
  Plus, 
  Check, 
  X, 
  Search, 
  CheckCircle2, 
  BrainCircuit, 
  Sliders, 
  Calendar, 
  Clock, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Layers
} from 'lucide-react';
import { useWorkforce } from '../context/WorkforceContext';
import { SKILL_CATALOG, PROFICIENCY_LEVELS } from '../types/data';

export const CreateAllocateTask = () => {
  const { employees, allocateTask, setActiveReasoning, setCurrentScreen } = useWorkforce();

  // Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('High');
  const [deadlineDate, setDeadlineDate] = useState('2026-09-26');
  const [deadlineTime, setDeadlineTime] = useState('18:00');

  // SKILL REQUIREMENTS (Cart) - Only Skill, Proficiency, People, Type (Effort is removed)
  const [skillRequirements, setSkillRequirements] = useState([
    { id: 1, skill: 'React', proficiency: 'Advanced', people: 1, type: 'Must-have' },
    { id: 2, skill: 'Node.js+Stripe', proficiency: 'Expert', people: 1, type: 'Must-have' }
  ]);

  // New Skill Entry Row State
  const [newSkill, setNewSkill] = useState('TypeScript');
  const [newProficiency, setNewProficiency] = useState('Advanced');
  const [newPeople, setNewPeople] = useState(1);
  const [newType, setNewType] = useState('Must-have');

  // ALLOCATION METHOD Toggle: 'AI' or 'Manual'
  const [allocationMethod, setAllocationMethod] = useState('AI');

  // AI Suggestion State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [acceptedEmpIds, setAcceptedEmpIds] = useState([]);

  // Manual Selection State
  const [manualSearch, setManualSearch] = useState('');
  const [manualSelectedEmpIds, setManualSelectedEmpIds] = useState([]);

  // Success State
  const [allocatedSuccessData, setAllocatedSuccessData] = useState(null);

  // Cart operations
  const handleAddSkill = () => {
    if (!newSkill) return;
    setSkillRequirements(prev => [
      ...prev,
      {
        id: Date.now(),
        skill: newSkill,
        proficiency: newProficiency,
        people: Number(newPeople),
        type: newType
      }
    ]);
  };

  const handleRemoveSkill = (id) => {
    setSkillRequirements(prev => prev.filter(item => item.id !== id));
  };

  // AI Suggestions Generation
  const handleGetAiSuggestions = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      // Find employees that best match the cart requirements
      const scoredEmployees = employees.map(emp => {
        let matchScore = 0;
        const matchedSkills = [];

        skillRequirements.forEach(req => {
          const hasSkill = emp.skills.find(
            s => s.name.toLowerCase() === req.skill.toLowerCase()
          );
          if (hasSkill) {
            matchScore += (req.type === 'Must-have' ? 40 : 20);
            matchedSkills.push(`${hasSkill.name} (${hasSkill.proficiency})`);
          }
        });

        // Workload bonus (lower workload = better headroom)
        const workloadScore = Math.max(0, 100 - emp.workload) * 0.3;
        // Performance bonus
        const perfScore = emp.performanceScore * 0.2;
        // Availability penalty
        const availMultiplier = emp.availability === 'Available' ? 1.0 : emp.availability === 'Busy' ? 0.6 : 0;

        const totalScore = Math.round((matchScore + workloadScore + perfScore) * availMultiplier);

        let reason = '';
        if (emp.availability !== 'Available') {
          reason = `Currently ${emp.availability.toLowerCase()}. Sub-optimal for urgent allocation.`;
        } else if (emp.skills.some(s => s.name.includes('Stripe'))) {
          reason = `Direct match on Stripe & Node.js payment architecture. Low workload (${emp.workload}%) gives 34hrs safety margin for SLA.`;
        } else if (emp.skills.some(s => s.name === 'React')) {
          reason = `Staff React architect with ${emp.performanceScore}% past delivery score. Capable of leading frontend delivery within SLA.`;
        } else {
          reason = `Strong cross-functional full-stack skills with balanced capacity.`;
        }

        return {
          ...emp,
          matchScore: totalScore,
          matchedSkills,
          reason,
          status: 'pending' // 'pending', 'accepted', 'rejected'
        };
      });

      // Filter and sort top candidates
      scoredEmployees.sort((a, b) => b.matchScore - a.matchScore);
      const topCandidates = scoredEmployees.slice(0, 3);

      setAiSuggestions(topCandidates);
      // Auto-preselect top candidate
      setAcceptedEmpIds([topCandidates[0]?.id].filter(Boolean));
      setIsAiLoading(false);
    }, 600);
  };

  const handleToggleAcceptAi = (empId) => {
    if (acceptedEmpIds.includes(empId)) {
      setAcceptedEmpIds(prev => prev.filter(id => id !== empId));
    } else {
      setAcceptedEmpIds(prev => [...prev, empId]);
    }
  };

  const handleRejectAi = (empId) => {
    setAcceptedEmpIds(prev => prev.filter(id => id !== empId));
    setAiSuggestions(prev =>
      prev.map(e => (e.id === empId ? { ...e, status: 'rejected' } : e))
    );
  };

  // Manual Selection operations
  const toggleManualEmp = (empId) => {
    if (manualSelectedEmpIds.includes(empId)) {
      setManualSelectedEmpIds(prev => prev.filter(id => id !== empId));
    } else {
      setManualSelectedEmpIds(prev => [...prev, empId]);
    }
  };

  const filteredManualEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(manualSearch.toLowerCase()) ||
    emp.skills.some(s => s.name.toLowerCase().includes(manualSearch.toLowerCase()))
  );

  // Allocation Submission
  const handleExecuteAllocation = () => {
    const isAi = allocationMethod === 'AI';
    const assignedIds = isAi ? acceptedEmpIds : manualSelectedEmpIds;

    if (assignedIds.length === 0) {
      alert('Please select or accept at least one employee for allocation.');
      return;
    }

    const taskData = {
      title: taskTitle || 'Global Payments Gateway Integration',
      description: description || 'High-throughput transactional integration with strict 99.9% SLA guarantees.',
      priority,
      slaDeadline: `${deadlineDate}T${deadlineTime}`,
      skillsRequired: skillRequirements
    };

    const reasoning = isAi
      ? `AI autonomously optimized allocation to ${assignedIds.map(id => employees.find(e => e.id === id)?.name).join(' & ')} by evaluating multi-skill coverage, maintaining workload headroom under 75%, and targeting zero SLA degradation.`
      : `Manual manager override. Verified engineer availability and skill compliance.`;

    const result = allocateTask(taskData, assignedIds, isAi ? 'AI Suggestion' : 'Manual', reasoning);
    setAllocatedSuccessData(result);
  };

  return (
    <div>
      {/* Sub Navbar Breadcrumb */}
      <div className="sub-navbar">
        <div>
          <h1 className="page-headline">Create / Allocate Task</h1>
          <div className="breadcrumb-trail">
            <span>Material Admin</span>
            <span>&gt;</span>
            <span>Task Management</span>
            <span>&gt;</span>
            <span className="active">Single Window Allocation</span>
          </div>
        </div>

        <div className="sub-nav-actions">
          <button 
            className="action-pill-btn" 
            onClick={() => {
              setTaskTitle('Refactor Authentication Microservice to OAuth2');
              setDescription('Upgrade session-based auth to distributed JWT tokens with Redis revocation cache.');
              setPriority('High');
            }}
          >
            <Sparkles size={14} color="#4880FF" />
            <span>Load Sample Task</span>
          </button>
        </div>
      </div>

      {/* SUCCESS BANNER POST-ALLOCATION */}
      {allocatedSuccessData && (
        <div style={{
          background: 'linear-gradient(90deg, #E6F8F5 0%, #F0FDFB 100%)',
          border: '1px solid #00B69B',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 16px rgba(0, 182, 155, 0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: '#00B69B', color: '#fff', borderRadius: '50%', padding: '8px' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.0625rem', fontWeight: '800', color: '#065F46' }}>
                Task Successfully Allocated &amp; Synced to Schedule!
              </h4>
              <p style={{ fontSize: '0.8125rem', color: '#047857', marginTop: '2px' }}>
                Assigned to: <strong>{allocatedSuccessData.newAssigned.join(', ')}</strong> • All SLA guardrails verified.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="action-pill-btn"
              style={{ background: '#00B69B', color: '#ffffff', border: 'none', fontWeight: '700' }}
              onClick={() => setActiveReasoning(allocatedSuccessData)}
            >
              <BrainCircuit size={15} />
              <span>View AI Reasoning</span>
            </button>
            <button
              className="action-pill-btn"
              onClick={() => setCurrentScreen('task-board')}
            >
              <span>View in Task Board →</span>
            </button>
          </div>
        </div>
      )}

      {/* SINGLE WINDOW MAIN CARD */}
      <div className="single-window-task-card">
        <div className="task-window-header">
          <div className="task-window-title">
            <div style={{ background: '#EEF4FE', padding: '8px', borderRadius: '10px', color: '#4880FF' }}>
              <Layers size={22} />
            </div>
            <div>
              <h2>CREATE / ALLOCATE TASK</h2>
              <p style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                Configure task parameters, define required skill cart, and execute intelligent allocation in one window.
              </p>
            </div>
          </div>
          <span className="nav-badge-pill core" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
            SINGLE WINDOW MODE
          </span>
        </div>

        <div className="task-form-body">
          {/* SECTION 1: TASK BASIC INFO */}
          <div className="form-grid-2">
            <div className="form-field-group">
              <label>Task Title</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Global Payments Gateway Integration"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
            </div>

            <div className="form-field-group">
              <label>Priority</label>
              <select 
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Urgent">🚨 Urgent (Immediate SLA Intervention)</option>
                <option value="High">🔴 High (Deliver in &lt; 48 hours)</option>
                <option value="Medium">🟡 Medium (Standard Sprint Cycle)</option>
                <option value="Low">🟢 Low (Backlog / Flexible)</option>
              </select>
            </div>
          </div>

          <div className="form-field-group" style={{ marginBottom: '20px' }}>
            <label>Description</label>
            <textarea 
              className="form-textarea" 
              rows={2}
              placeholder="Describe deliverables, technical scope, and integration dependencies..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-field-group">
              <label>SLA / Deadline Date &amp; Time</label>
              <div className="datetime-split">
                <input 
                  type="date" 
                  className="form-input" 
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                />
                <input 
                  type="time" 
                  className="form-input" 
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                />
              </div>
            </div>

            <div className="form-field-group">
              <label>SLA Risk Policy</label>
              <div style={{ background: '#FAFBFD', border: '1px solid #E6EDF9', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: '#475569' }}>
                <Clock size={16} color="#4880FF" />
                <span>Automatic trigger to rebalance personnel if SLA completion drops below 85%.</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: SKILL REQUIREMENTS (CART) */}
          <div className="skill-cart-section">
            <div className="skill-cart-header">
              <h3>
                <Sparkles size={16} color="#4880FF" />
                SKILL REQUIREMENTS (Cart)
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                *Effort field removed as per system specifications.
              </span>
            </div>

            <table className="skill-cart-table">
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Skill</th>
                  <th style={{ width: '25%' }}>Proficiency</th>
                  <th style={{ width: '15%' }}>People</th>
                  <th style={{ width: '15%' }}>Type</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Remove</th>
                </tr>
              </thead>
              <tbody>
                {skillRequirements.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <strong style={{ color: '#1E293B' }}>{req.skill}</strong>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        background: req.proficiency === 'Expert' ? '#F2EFFF' : req.proficiency === 'Advanced' ? '#EEF4FE' : '#F1F5F9',
                        color: req.proficiency === 'Expert' ? '#826AF9' : req.proficiency === 'Advanced' ? '#4880FF' : '#475569'
                      }}>
                        {req.proficiency}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '700' }}>{req.people}</span>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        background: req.type === 'Must-have' ? '#FEEFEF' : '#E6F8F5',
                        color: req.type === 'Must-have' ? '#EA5455' : '#00B69B'
                      }}>
                        {req.type}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn-remove-cart-row"
                        onClick={() => handleRemoveSkill(req.id)}
                        title="Remove requirement row"
                        style={{ margin: '0 auto' }}
                      >
                        <X size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Quick Add Row in Cart */}
            <div style={{ 
              background: '#ffffff', 
              border: '1px solid #E6EDF9', 
              borderRadius: '8px', 
              padding: '12px 14px', 
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div style={{ flex: '2', minWidth: '150px' }}>
                <select 
                  className="form-select" 
                  value={newSkill} 
                  onChange={(e) => setNewSkill(e.target.value)}
                  style={{ padding: '7px 10px', fontSize: '0.8125rem' }}
                >
                  {SKILL_CATALOG.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ flex: '1', minWidth: '120px' }}>
                <select 
                  className="form-select" 
                  value={newProficiency} 
                  onChange={(e) => setNewProficiency(e.target.value)}
                  style={{ padding: '7px 10px', fontSize: '0.8125rem' }}
                >
                  {PROFICIENCY_LEVELS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div style={{ width: '80px' }}>
                <input 
                  type="number" 
                  min="1" 
                  max="10" 
                  className="form-input" 
                  value={newPeople} 
                  onChange={(e) => setNewPeople(e.target.value)}
                  style={{ padding: '7px 10px', fontSize: '0.8125rem' }}
                />
              </div>

              <div style={{ flex: '1', minWidth: '120px' }}>
                <select 
                  className="form-select" 
                  value={newType} 
                  onChange={(e) => setNewType(e.target.value)}
                  style={{ padding: '7px 10px', fontSize: '0.8125rem' }}
                >
                  <option value="Must-have">Must-have</option>
                  <option value="Nice-to-have">Nice-to-have</option>
                </select>
              </div>

              <button 
                className="btn-add-skill"
                onClick={handleAddSkill}
              >
                <Plus size={15} />
                <span>Add Skill Requirement</span>
              </button>
            </div>
          </div>

          {/* SECTION 3: ALLOCATION METHOD (AI vs Manual Toggle) */}
          <div className="allocation-method-section">
            <div className="allocation-method-header">
              <h3>ALLOCATION METHOD</h3>
              <div className="toggle-selector-group">
                <div 
                  className={`toggle-option-card ${allocationMethod === 'AI' ? 'selected' : ''}`}
                  onClick={() => setAllocationMethod('AI')}
                >
                  <input 
                    type="radio" 
                    name="allocationMethod" 
                    checked={allocationMethod === 'AI'} 
                    onChange={() => setAllocationMethod('AI')}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <div className="toggle-option-title">
                      <Sparkles size={16} color="#4880FF" />
                      <span>AI Suggestion</span>
                    </div>
                    <div className="toggle-option-desc">
                      Autonomous matching algorithm weighing skills, current workload %, SLA risk headroom, and past delivery performance.
                    </div>
                  </div>
                </div>

                <div 
                  className={`toggle-option-card ${allocationMethod === 'Manual' ? 'selected' : ''}`}
                  onClick={() => setAllocationMethod('Manual')}
                >
                  <input 
                    type="radio" 
                    name="allocationMethod" 
                    checked={allocationMethod === 'Manual'} 
                    onChange={() => setAllocationMethod('Manual')}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <div className="toggle-option-title">
                      <UserCheck size={16} color="#00B69B" />
                      <span>Manual Selection</span>
                    </div>
                    <div className="toggle-option-desc">
                      Manually search and check off engineers from the live directory with clear workload and availability transparency.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DYNAMIC CONTENT BASED ON SELECTED METHOD */}

            {/* IF AI SUGGESTION SELECTED */}
            {allocationMethod === 'AI' && (
              <div className="ai-suggestion-box">
                <div className="ai-suggestion-top">
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#1E293B' }}>
                      AI Suggested Personnel Matches
                    </h4>
                    <p style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                      Calculated against the {skillRequirements.length} skill requirements in your cart.
                    </p>
                  </div>

                  <button 
                    className="btn-get-ai"
                    onClick={handleGetAiSuggestions}
                    disabled={isAiLoading}
                  >
                    <Sparkles size={16} />
                    <span>{isAiLoading ? 'Analyzing Capacity & Skills...' : 'Get AI Suggestions'}</span>
                  </button>
                </div>

                {!aiSuggestions && !isAiLoading && (
                  <div style={{ textAlign: 'center', padding: '36px 20px', background: '#ffffff', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                    <BrainCircuit size={42} color="#94A3B8" style={{ marginBottom: '10px' }} />
                    <h4 style={{ color: '#475569', fontSize: '0.9375rem', fontWeight: '700' }}>
                      Click "Get AI Suggestions" to compute optimal resource assignments
                    </h4>
                    <p style={{ color: '#94A3B8', fontSize: '0.8125rem', marginTop: '4px' }}>
                      Reflex AI evaluates active workloads, historical velocity, location timezones, and skill matrix.
                    </p>
                  </div>
                )}

                {aiSuggestions && (
                  <div className="ai-recommendation-cards-grid">
                    {aiSuggestions.map((emp) => {
                      const isAccepted = acceptedEmpIds.includes(emp.id);
                      const isRejected = emp.status === 'rejected';

                      return (
                        <div 
                          key={emp.id} 
                          className={`ai-emp-card ${isAccepted ? 'accepted' : isRejected ? 'rejected' : ''}`}
                        >
                          <div className="ai-emp-header">
                            <img src={emp.avatar} alt={emp.name} className="ai-emp-avatar" />
                            <div className="ai-emp-info" style={{ flex: 1 }}>
                              <h4>{emp.name}</h4>
                              <p>{emp.role} • {emp.location.split(' ')[0]}</p>
                            </div>
                            <span style={{
                              background: emp.workload > 75 ? '#FEEFEF' : '#E6F8F5',
                              color: emp.workload > 75 ? '#EA5455' : '#00B69B',
                              fontSize: '0.75rem',
                              fontWeight: '800',
                              padding: '3px 8px',
                              borderRadius: '6px'
                            }}>
                              {emp.workload}% Load
                            </span>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.6875rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
                              Relevant Skills
                            </span>
                            <div className="ai-skills-wrap" style={{ marginTop: '4px' }}>
                              {emp.skills.map(s => (
                                <span key={s.name} className="ai-skill-chip">
                                  {s.name} ({s.proficiency})
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="ai-metrics-row">
                            <div className="ai-metric-item">
                              <span className="label">Performance Score</span>
                              <span className="value" style={{ color: '#00B69B' }}>
                                {emp.performanceScore}/100
                              </span>
                            </div>
                            <div className="ai-metric-item">
                              <span className="label">Availability</span>
                              <span className="value" style={{ color: emp.availability === 'Available' ? '#00B69B' : '#EA5455' }}>
                                ● {emp.availability}
                              </span>
                            </div>
                          </div>

                          {/* Reason */}
                          <div className="ai-reason-quote">
                            <strong>Reason:</strong> {emp.reason}
                          </div>

                          {/* Accept / Reject buttons */}
                          <div className="ai-emp-actions">
                            <button 
                              className="btn-accept-emp"
                              onClick={() => handleToggleAcceptAi(emp.id)}
                              style={{
                                background: isAccepted ? '#00B69B' : '#ffffff',
                                color: isAccepted ? '#ffffff' : '#00B69B',
                                border: '1px solid #00B69B'
                              }}
                            >
                              <Check size={15} />
                              <span>{isAccepted ? 'Accepted' : 'Accept'}</span>
                            </button>

                            <button 
                              className="btn-reject-emp"
                              onClick={() => handleRejectAi(emp.id)}
                            >
                              <X size={15} />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {aiSuggestions && (
                  <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn-confirm-manual"
                      style={{ background: '#4880FF' }}
                      onClick={handleExecuteAllocation}
                      disabled={acceptedEmpIds.length === 0}
                    >
                      <Sparkles size={16} />
                      <span>Confirm AI Allocation ({acceptedEmpIds.length} Selected)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* IF MANUAL SELECTION SELECTED */}
            {allocationMethod === 'Manual' && (
              <div className="manual-selection-box">
                <div className="manual-search-bar">
                  <Search size={18} color="#64748B" />
                  <input 
                    type="text" 
                    placeholder="Search Employee by Name, Role, or Skill..."
                    value={manualSearch}
                    onChange={(e) => setManualSearch(e.target.value)}
                  />
                  {manualSearch && (
                    <button 
                      onClick={() => setManualSearch('')} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <table className="manual-emp-table">
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>Select</th>
                      <th style={{ width: '25%' }}>Employee</th>
                      <th style={{ width: '30%' }}>Skills</th>
                      <th style={{ width: '15%' }}>Current Workload %</th>
                      <th style={{ width: '12%' }}>Availability</th>
                      <th style={{ width: '13%' }}>Performance Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredManualEmployees.map(emp => {
                      const isSelected = manualSelectedEmpIds.includes(emp.id);
                      return (
                        <tr 
                          key={emp.id} 
                          className={isSelected ? 'selected' : ''}
                          onClick={() => toggleManualEmp(emp.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => toggleManualEmp(emp.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img src={emp.avatar} alt={emp.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                              <div>
                                <strong style={{ color: '#1E293B', display: 'block' }}>{emp.name}</strong>
                                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{emp.role}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="ai-skills-wrap">
                              {emp.skills.slice(0, 3).map(s => (
                                <span key={s.name} className="ai-skill-chip">
                                  {s.name}
                                </span>
                              ))}
                              {emp.skills.length > 3 && (
                                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: '700' }}>
                                  +{emp.skills.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className="progress-bar-bg" style={{ width: '70px' }}>
                                <div 
                                  className="progress-bar-fill" 
                                  style={{ 
                                    width: `${emp.workload}%`,
                                    backgroundColor: emp.workload > 80 ? '#EA5455' : emp.workload > 60 ? '#FF9F43' : '#00B69B'
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '0.8125rem', fontWeight: '700' }}>{emp.workload}%</span>
                            </div>
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              color: emp.availability === 'Available' ? '#00B69B' : '#EA5455'
                            }}>
                              ● {emp.availability}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.875rem', fontWeight: '800', color: '#1E293B' }}>
                              {emp.performanceScore} / 100
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Selected Employees Bottom Tray */}
                <div className="manual-bottom-tray">
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>
                      Selected Employees ({manualSelectedEmpIds.length}):
                    </span>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {manualSelectedEmpIds.length === 0 && (
                        <span style={{ fontSize: '0.8125rem', color: '#94A3B8', fontStyle: 'italic' }}>
                          No employees checked yet. Click rows above to select.
                        </span>
                      )}
                      {manualSelectedEmpIds.map(id => {
                        const emp = employees.find(e => e.id === id);
                        return (
                          <span 
                            key={id} 
                            style={{
                              background: '#ffffff',
                              border: '1px solid #4880FF',
                              color: '#4880FF',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '0.8125rem',
                              fontWeight: '700',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            {emp?.name}
                            <X 
                              size={13} 
                              style={{ cursor: 'pointer' }} 
                              onClick={() => toggleManualEmp(id)} 
                            />
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <button 
                    className="btn-confirm-manual"
                    disabled={manualSelectedEmpIds.length === 0}
                    onClick={handleExecuteAllocation}
                  >
                    <CheckCircle2 size={16} />
                    <span>Confirm Manual Allocation</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
