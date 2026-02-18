import React, { useState, useEffect } from 'react';
import { Layout, MessageSquare, AlertCircle, FileText, Bell, Search, Settings, HelpCircle, LogOut } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ProjectSelector from './components/ProjectSelector';
import SettingsModal from './components/SettingsModal';
import { apsService } from './services/aps';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hubs, setHubs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedHub, setSelectedHub] = useState(null);
  const [activeProject, setActiveProject] = useState(null);
  const [dashboardData, setDashboardData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Auth state from backend (session). OAuth callback is handled by backend; we just re-check after load.
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    setLoading(true);
    apsService.isAuthenticated()
      .then(setIsAuthenticated)
      .catch(() => setIsAuthenticated(false))
      .finally(() => setLoading(false));
  }, []);

  // Auto 2-legged login when credentials are stored and mode is 2legged
  useEffect(() => {
    if (isAuthenticated || loading) return;
    if (apsService.getAuthMode() !== '2legged') return;
    const { clientId, clientSecret } = apsService.getStoredCredentials();
    if (!clientId || !clientSecret) return;
    setLoading(true);
    apsService.login2Legged(clientId, clientSecret)
      .then(() => setIsAuthenticated(true))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, loading]);

  const handleSettingsSave = () => {
    const mode = apsService.getAuthMode();
    const { clientId, clientSecret } = apsService.getStoredCredentials();
    
    if (mode === '2legged' && clientId && clientSecret) {
      setLoading(true);
      apsService.login2Legged(clientId, clientSecret)
        .then(() => setIsAuthenticated(true))
        .catch(err => alert('2-legged login failed: ' + (err?.message || err)))
        .finally(() => setLoading(false));
    } else {
      setLoading(true);
      apsService.isAuthenticated()
        .then(setIsAuthenticated)
        .finally(() => setLoading(false));
    }
  };

  // Fetch Hubs
  useEffect(() => {
    if (isAuthenticated) {
      apsService.getHubs().then(setHubs).catch(err => console.error('Failed to fetch hubs:', err));
    }
  }, [isAuthenticated]);

  const handleHubChange = async (hubId) => {
    setSelectedHub(hubId);
    setLoading(true);
    try {
      const projs = await apsService.getProjects(hubId);
      setProjects(projs);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = async (project) => {
    setActiveProject(project);
    setLoading(true);
    try {
      const [issues, rfis, submittals] = await Promise.all([
        apsService.getIssues(project.id),
        apsService.getRFIs(project.id),
        apsService.getSubmittals(project.id)
      ]);

      const columns = [
        {
          title: 'Construction Issues',
          subtitle: `Project: ${project.attributes.name}`,
          items: issues.map(issue => ({
            title: `${issue.identifier || 'ISS'}: ${issue.title}`,
            subtitle: issue.description || 'No description provided.',
            status: issue.status,
            priority: issue.priority,
            meta: `Assigned: ${issue.assignedToName || 'Unassigned'} · ${new Date(issue.updatedAt).toLocaleDateString()}`
          }))
        },
        {
          title: 'Project RFIs',
          subtitle: 'Official Responses',
          items: rfis.map(rfi => ({
            title: `${rfi.identifier || 'RFI'}: ${rfi.title}`,
            subtitle: rfi.question || 'No question provided.',
            status: rfi.status,
            priority: rfi.priority || 'Medium',
            meta: `Due: ${rfi.dueDate ? new Date(rfi.dueDate).toLocaleDateString() : 'No due date'}`
          }))
        },
        {
          title: 'Submittal Items',
          subtitle: 'Awaiting Review',
          items: submittals.map(item => ({
            title: `${item.specSectionNumber || 'SUB'}: ${item.title}`,
            subtitle: item.description || 'No description.',
            status: item.status,
            priority: 'Medium',
            meta: `Due: ${item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No due date'}`
          }))
        }
      ];

      setDashboardData(columns);
    } catch (err) {
      console.error('Failed to fetch project data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => apsService.login();
  const handleLogout = () => {
    apsService.logout().then(() => {
      setIsAuthenticated(false);
      setDashboardData([]);
      setActiveProject(null);
    });
  };

  return (
    <div className="app-container">
      <nav className="sidebar">
        <Layout className="sidebar-icon active" />
        <MessageSquare className="sidebar-icon" />
        <Bell className="sidebar-icon" />
        <Search className="sidebar-icon" />
        <div style={{ flex: 1 }}></div>
        <HelpCircle className="sidebar-icon" />
        <Settings className="sidebar-icon" onClick={() => setIsSettingsOpen(true)} />
        {isAuthenticated && <LogOut className="sidebar-icon" onClick={handleLogout} />}
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
            <h1 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {activeProject ? activeProject.attributes.name : 'ACC Dashboard'}
            </h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Autodesk Construction Cloud · Real-time Data
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {isAuthenticated ? (
              <ProjectSelector 
                hubs={hubs} 
                projects={projects} 
                selectedHub={selectedHub}
                selectedProject={activeProject?.id}
                onHubChange={handleHubChange}
                onProjectChange={handleProjectChange}
              />
            ) : (
              <button 
                onClick={handleLogin}
                style={{ 
                  background: 'var(--accent-blue)', 
                  color: 'white', 
                  border: 'none', 
                  padding: '8px 16px', 
                  borderRadius: '4px',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Login with Autodesk
              </button>
            )}
          </div>
        </header>
        
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner">Loading...</div>
          </div>
        ) : (
          isAuthenticated ? (
            activeProject ? (
              <Dashboard columns={dashboardData} />
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                Please select a hub and project to view data.
              </div>
            )
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              Sign in to access your Autodesk Construction Cloud data.
            </div>
          )
        )}

        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          onSave={handleSettingsSave}
        />
      </main>
    </div>
  );
}

export default App;
