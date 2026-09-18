import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  BrainCircuit, 
  Activity, 
  Lock, 
  Mail, 
  CheckCircle2,
  Users,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useWorkforce } from '../context/WorkforceContext';

export const LandingLogin = () => {
  const { setCurrentScreen } = useWorkforce();
  const [email, setEmail] = useState('malinda-h@zmail.zh');
  const [password, setPassword] = useState('••••••••••••');
  const [role, setRole] = useState('manager'); // 'manager' or 'engineer'

  const handleLogin = (e) => {
    e.preventDefault();
    if (role === 'manager') {
      setCurrentScreen('dashboard');
    } else {
      setCurrentScreen('task-board');
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: 'radial-gradient(circle at 10% 20%, #EEF4FE 0%, #F4F7FE 60%, #FFFFFF 100%)',
      padding: '40px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1100px',
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '40px',
        alignItems: 'center'
      }}>
        {/* Left Hero Section */}
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(72, 128, 255, 0.12)',
            color: '#4880FF',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.8125rem',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '18px'
          }}>
            <BrainCircuit size={16} />
            <span>Reflex AI • Autonomous Workforce Agent</span>
          </div>

          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#0F172A',
            lineHeight: '1.2',
            letterSpacing: '-0.02em',
            marginBottom: '16px'
          }}>
            Dynamic Resource Allocation for Fast-Moving Engineering Teams
          </h1>

          <p style={{
            fontSize: '1.0625rem',
            color: '#475569',
            lineHeight: '1.6',
            marginBottom: '28px'
          }}>
            Balance competing tasks, skill proficiencies, SLAs, and continuous real-time availability changes with an autonomous AI decision system.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
            {[
              { title: 'Single Window Task Creation', desc: 'Define skill carts (proficiency, count, must-have) with zero effort friction.' },
              { title: 'Explainable AI Decisions', desc: 'Transparent reasoning weighing skills, workload %, and SLA headroom.' },
              { title: 'Continuous Dynamic Reallocation', desc: 'Instant automated re-optimization when engineers report sick or P0 tasks arrive.' }
            ].map((feat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ background: '#E6F8F5', color: '#00B69B', padding: '4px', borderRadius: '50%', marginTop: '2px' }}>
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.9375rem', color: '#1E293B' }}>{feat.title}</strong>
                  <p style={{ fontSize: '0.8125rem', color: '#64748B' }}>{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="action-pill-btn"
              style={{ background: '#4880FF', color: '#ffffff', border: 'none', padding: '12px 24px', fontWeight: '800', fontSize: '0.9375rem' }}
              onClick={() => setCurrentScreen('create-task')}
            >
              <Sparkles size={16} />
              <span>Launch Single Window Task Allocator</span>
            </button>
            <button
              className="action-pill-btn"
              style={{ padding: '12px 20px', fontWeight: '700' }}
              onClick={() => setCurrentScreen('dashboard')}
            >
              <span>Explore Dashboard</span>
            </button>
          </div>
        </div>

        {/* Right Auth / Login Card */}
        <div className="card" style={{
          padding: '36px 32px',
          boxShadow: '0 12px 36px rgba(43, 83, 174, 0.12)',
          border: '1px solid #DCE6F8'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '54px',
              height: '54px',
              background: '#EEF4FE',
              color: '#4880FF',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto'
            }}>
              <Lock size={26} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1E293B' }}>
              Sign In to Reflex AI
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '4px' }}>
              Material Admin 3.0 Enterprise Portal
            </p>
          </div>

          {/* Role Switcher */}
          <div style={{
            display: 'flex',
            background: '#F1F5F9',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            <button
              type="button"
              onClick={() => setRole('manager')}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: '700',
                background: role === 'manager' ? '#ffffff' : 'transparent',
                color: role === 'manager' ? '#4880FF' : '#64748B',
                cursor: 'pointer',
                boxShadow: role === 'manager' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Manager View
            </button>
            <button
              type="button"
              onClick={() => setRole('engineer')}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: '700',
                background: role === 'engineer' ? '#ffffff' : 'transparent',
                color: role === 'engineer' ? '#4880FF' : '#64748B',
                cursor: 'pointer',
                boxShadow: role === 'engineer' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Engineer View
            </button>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-field-group" style={{ marginBottom: '16px' }}>
              <label>Work Email</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="email" 
                  className="form-input" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-field-group" style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Password</label>
                <a href="#forgot" style={{ fontSize: '0.75rem', color: '#4880FF', textDecoration: 'none', fontWeight: '600' }}>
                  Forgot?
                </a>
              </div>
              <input 
                type="password" 
                className="form-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-confirm-manual"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '12px',
                fontSize: '0.9375rem',
                marginBottom: '16px'
              }}
            >
              <span>Access {role === 'manager' ? 'Manager Dashboard' : 'Task Workspace'}</span>
              <ArrowRight size={16} />
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94A3B8' }}>
              Pre-configured demo credentials active. Simply click sign in.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
