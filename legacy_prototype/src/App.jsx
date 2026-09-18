import React from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ReasoningModal } from './components/ReasoningModal';
import { NotificationToast } from './components/NotificationToast';
import { useWorkforce } from './context/WorkforceContext';

// Pages
import { ManagerDashboard } from './pages/ManagerDashboard';
import { CreateAllocateTask } from './pages/CreateAllocateTask';
import { TaskBoard } from './pages/TaskBoard';
import { EmployeeList } from './pages/EmployeeList';
import { ReallocationCenter } from './pages/ReallocationCenter';
import { SkillGapAnalysis } from './pages/SkillGapAnalysis';
import { LandingLogin } from './pages/LandingLogin';

export function App() {
  const { currentScreen } = useWorkforce();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <ManagerDashboard />;
      case 'create-task':
        return <CreateAllocateTask />;
      case 'task-board':
        return <TaskBoard />;
      case 'employees':
        return <EmployeeList />;
      case 'reallocation':
        return <ReallocationCenter />;
      case 'skill-gaps':
        return <SkillGapAnalysis />;
      case 'landing':
        return <LandingLogin />;
      default:
        return <ManagerDashboard />;
    }
  };

  return (
    <div className="app-container">
      {/* Top Royal Blue Bar matching Material Admin 3.0 */}
      <Header />

      <div className="main-layout">
        {/* Left Navigation Sidebar */}
        <Sidebar />

        {/* Dynamic Page Content */}
        <main className="content-wrapper">
          {renderScreen()}
        </main>
      </div>

      {/* Explainable AI Decision Reasoning Modal */}
      <ReasoningModal />

      {/* Floating Dynamic Notification & Reallocation Toasts */}
      <NotificationToast />
    </div>
  );
}

export default App;
