import React from 'react';

function ProjectSelector({ hubs, projects, onHubChange, onProjectChange, selectedHub, selectedProject }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <select 
        value={selectedHub || ''} 
        onChange={(e) => onHubChange(e.target.value)}
        style={{
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          padding: '6px 12px',
          borderRadius: '4px',
          fontSize: '0.8rem',
          outline: 'none'
        }}
      >
        <option value="" disabled>Select Hub</option>
        {hubs.map(hub => (
          <option key={hub.id} value={hub.id}>{hub.attributes.name}</option>
        ))}
      </select>

      <select 
        value={selectedProject || ''} 
        onChange={(e) => onProjectChange(projects.find(p => p.id === e.target.value))}
        style={{
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          padding: '6px 12px',
          borderRadius: '4px',
          fontSize: '0.8rem',
          outline: 'none'
        }}
        disabled={!selectedHub}
      >
        <option value="" disabled>Select Project</option>
        {projects.map(project => (
          <option key={project.id} value={project.id}>{project.attributes.name}</option>
        ))}
      </select>
    </div>
  );
}

export default ProjectSelector;
