import React, { useState } from 'react';
import { Layout, MessageSquare, AlertCircle, FileText, Bell, Search, Settings, HelpCircle } from 'lucide-react';
import Dashboard from './components/Dashboard';

function App() {
  const [activeProject, setActiveProject] = useState('Gateway Hospital Project');

  const mockData = [
    {
      title: 'High Priority Issues',
      subtitle: 'Project: ' + activeProject,
      items: [
        { title: 'ISS-102: Foundation Crack in Sector B', subtitle: 'Detailed inspection required for the structural integrity of the north-east corner.', status: 'Open', priority: 'High', meta: 'Assigned: John Doe · 2h ago' },
        { title: 'ISS-098: HVAC Ducting Conflict', subtitle: 'Clash detected between HVAC ducts and fire suppression pipes on level 2.', status: 'Open', priority: 'High', meta: 'Assigned: Jane Smith · 5h ago' },
        { title: 'ISS-105: Missing Stairwell Railing', subtitle: 'Safety concern: railing missing on staircase 3 leading to basement.', status: 'Pending', priority: 'High', meta: 'Assigned: Mike Ross · 1d ago' },
      ]
    },
    {
      title: 'Recent RFIs',
      subtitle: 'Official Responses Needed',
      items: [
        { title: 'RFI-045: Window Glazing Spec', subtitle: 'Clarification needed on the solar heat gain coefficient for external glazing.', status: 'Open', priority: 'Medium', meta: 'Due: Feb 20 · 2 comments' },
        { title: 'RFI-042: Lobby Flooring Material', subtitle: 'Request for approval of alternative terrazzo finish for main entrance.', status: 'Closed', priority: 'Low', meta: 'Resolved · Feb 15' },
      ]
    },
    {
      title: 'Submittals Due',
      subtitle: 'Awaiting Review',
      items: [
        { title: 'SUB-021: Structural Steel Shop Drawings', subtitle: 'Batch 3 drawings for the main atrium framework.', status: 'Pending', priority: 'Medium', meta: 'Due Tomorrow · 5 files' },
        { title: 'SUB-018: Concrete Mix Design', subtitle: 'Mix design for high-strength footings in parking area.', status: 'Open', priority: 'High', meta: 'Due: Feb 18 · 1 file' },
      ]
    },
    {
      title: 'Project Activity',
      subtitle: 'Live Updates',
      items: [
        { title: 'Alice Wong added a comment', subtitle: 'On Issue ISS-102: "Structural engineer scheduled for Tuesday."', status: 'Pending', priority: 'Low', meta: '15m ago' },
        { title: 'Steve Miller uploaded a file', subtitle: 'New revision of Site Drainage Plan v3.pdf', status: 'Open', priority: 'Low', meta: '1h ago' },
        { title: 'Project status updated to "On Track"', subtitle: 'General milestone reached for phase 1 excavation.', status: 'Closed', priority: 'Medium', meta: '4h ago' },
      ]
    }
  ];

  return (
    <div className="app-container">
      <nav className="sidebar">
        <Layout className="sidebar-icon active" />
        <MessageSquare className="sidebar-icon" />
        <Bell className="sidebar-icon" />
        <Search className="sidebar-icon" />
        <div style={{ flex: 1 }}></div>
        <HelpCircle className="sidebar-icon" />
        <Settings className="sidebar-icon" />
      </nav>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ 
          padding: '12px 20px', 
          borderBottom: '1px solid var(--border-color)', 
          background: 'var(--bg-dark)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{activeProject}</h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Autodesk Construction Cloud · ACC Dashboard</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={{ 
              background: 'var(--accent-blue)', 
              color: 'white', 
              border: 'none', 
              padding: '6px 12px', 
              borderRadius: '4px',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}>+ Add Column</button>
          </div>
        </header>
        <Dashboard columns={mockData} />
      </main>
    </div>
  );
}

export default App;
