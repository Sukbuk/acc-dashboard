import React, { useState, useEffect } from 'react';
import { X, Save, Shield, ShieldAlert } from 'lucide-react';
import { apsService } from '../services/aps';

function SettingsModal({ isOpen, onClose, onSave }) {
  const credentials = apsService.getStoredCredentials();
  const [authMode, setAuthMode] = useState(apsService.getAuthMode());
  const [clientId, setClientId] = useState(credentials.clientId || '');
  const [clientSecret, setClientSecret] = useState(credentials.clientSecret || '');
  const [redirectUri, setRedirectUri] = useState(credentials.redirectUri || '');

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('aps_auth_mode', authMode);
    localStorage.setItem('aps_custom_client_id', clientId);
    localStorage.setItem('aps_custom_client_secret', clientSecret);
    localStorage.setItem('aps_custom_redirect_uri', redirectUri);
    onSave();
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-column)',
        width: '450px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Project Settings</h2>
          <X 
            style={{ cursor: 'pointer', color: 'var(--text-muted)' }} 
            onClick={onClose} 
            size={20}
          />
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Auth Mode Toggle */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Authentication Mode
            </label>
            <div style={{ 
              display: 'flex', 
              background: 'var(--bg-dark)', 
              padding: '4px', 
              borderRadius: '6px',
              border: '1px solid var(--border-color)'
            }}>
              <button 
                onClick={() => setAuthMode('3legged')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: authMode === '3legged' ? 'var(--accent-blue)' : 'transparent',
                  color: authMode === '3legged' ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                <Shield size={14} /> 3-Legged
              </button>
              <button 
                onClick={() => setAuthMode('2legged')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: authMode === '2legged' ? 'var(--accent-red)' : 'transparent',
                  color: authMode === '2legged' ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                <ShieldAlert size={14} /> 2-Legged
              </button>
            </div>
          </div>

          {/* Credentials Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                APS Client ID
              </label>
              <input 
                type="text" 
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Enter Client ID"
                style={{
                  width: '100%',
                  background: 'var(--bg-dark)',
                  border: '1px solid var(--border-color)',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            {authMode === '2legged' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  APS Client Secret
                </label>
                <input 
                  type="password" 
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Enter Client Secret"
                  style={{
                    width: '100%',
                    background: 'var(--bg-dark)',
                    border: '1px solid var(--border-color)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
            )}

            {authMode === '3legged' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Redirect URI
                </label>
                <input 
                  type="text" 
                  value={redirectUri}
                  onChange={(e) => setRedirectUri(e.target.value)}
                  placeholder="http://localhost:5173/callback"
                  style={{
                    width: '100%',
                    background: 'var(--bg-dark)',
                    border: '1px solid var(--border-color)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
            )}
          </div>

          {authMode === '2legged' && (
            <div style={{ 
              padding: '10px', 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.2)', 
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: '#fca5a5'
            }}>
              <strong>Warning:</strong> 2-Legged authentication stores your Client Secret in local storage. Use with caution.
            </div>
          )}
        </div>

        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button 
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            style={{
              padding: '8px 20px',
              background: 'var(--accent-blue)',
              border: 'none',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
