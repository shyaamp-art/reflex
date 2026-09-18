import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Shuffle, Info, X } from 'lucide-react';
import { useWorkforce } from '../context/WorkforceContext';

// Individual Toast Item with Auto-Dismiss (15s) and Manual Close 'X' Button
const SingleToast = ({ toast, onDismiss, onViewReasoning }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = 15000; // 15 seconds
    const intervalTime = 100;
    const step = (intervalTime / duration) * 100;

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(progressTimer);
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    // Auto-dismiss after 15 seconds
    const autoDismissTimer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(autoDismissTimer);
    };
  }, [toast.id, onDismiss]);

  return (
    <div 
      className={`toast-item ${toast.type === 'reallocation' ? 'reallocation' : toast.type === 'success' ? 'success' : ''}`}
      style={{
        position: 'relative',
        padding: '14px 36px 16px 16px',
        borderRadius: '12px',
        boxShadow: '0 8px 28px rgba(0, 0, 0, 0.14)'
      }}
    >
      {/* Icon */}
      <div style={{ flexShrink: 0, marginTop: '2px' }}>
        {toast.type === 'reallocation' ? (
          <Shuffle size={20} color="#FF9F43" />
        ) : toast.type === 'success' ? (
          <CheckCircle2 size={20} color="#00B69B" />
        ) : (
          <Info size={20} color="#4880FF" />
        )}
      </div>

      {/* Message content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: '800', color: '#111827', marginBottom: '2px' }}>
          {toast.title}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: '1.35' }}>
          {toast.message}
        </div>

        {toast.reasoningData && (
          <button
            onClick={() => onViewReasoning(toast.reasoningData)}
            style={{
              background: 'none',
              border: 'none',
              color: '#4880FF',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
              padding: '2px 0',
              marginTop: '5px',
              textDecoration: 'underline',
              display: 'inline-block'
            }}
          >
            View AI Decision Reasoning →
          </button>
        )}
      </div>

      {/* Explicit 'X' Mark to close this popup */}
      <button
        onClick={() => onDismiss(toast.id)}
        title="Close notification"
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'none',
          border: 'none',
          color: '#94A3B8',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#1E293B';
          e.currentTarget.style.backgroundColor = '#F1F5F9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#94A3B8';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <X size={15} />
      </button>

      {/* 15-second Auto-Dismiss Progress Bar indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '3px',
          width: `${progress}%`,
          background: toast.type === 'reallocation' ? '#FF9F43' : toast.type === 'success' ? '#00B69B' : '#4880FF',
          transition: 'width 0.1s linear',
          opacity: 0.65
        }}
      />
    </div>
  );
};

export const NotificationToast = () => {
  const { notifications, removeNotification, setActiveReasoning } = useWorkforce();

  // Show the 3 most recent active notifications
  const activeToasts = notifications.slice(0, 3);

  if (activeToasts.length === 0) return null;

  return (
    <div className="toast-container">
      {activeToasts.map((toast) => (
        <SingleToast
          key={toast.id}
          toast={toast}
          onDismiss={removeNotification}
          onViewReasoning={setActiveReasoning}
        />
      ))}
    </div>
  );
};
