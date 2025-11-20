import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Bell, Shield, Palette, Save, Eye, EyeOff, CheckCircle } from 'lucide-react';

const AccountSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updateMessage, setUpdateMessage] = useState({ type: '', text: '' });

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    department: '',
    role: ''
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    maintenanceReminders: true,
    assetUpdates: true,
    systemAlerts: true,
    weeklyReports: false
  });

  const [themeSettings, setThemeSettings] = useState({
    theme: 'light',
    accentColor: '#3498db',
    compactMode: false,
    sidebarCollapsed: false
  });

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/v1/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setProfileData({
          firstName: data.data.firstName || '',
          lastName: data.data.lastName || '',
          email: data.data.email || '',
          username: data.data.username || '',
          department: data.data.department || '',
          role: data.data.role || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdateMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/v1/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
          department: profileData.department
        })
      });

      const data = await response.json();
      if (data.success) {
        setUpdateMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Update localStorage with new user info
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        localStorage.setItem('userInfo', JSON.stringify({ ...userInfo, ...data.data }));
      } else {
        setUpdateMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setUpdateMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setUpdateMessage({ type: '', text: '' });

    if (securityData.newPassword !== securityData.confirmPassword) {
      setUpdateMessage({ type: 'error', text: 'New passwords do not match!' });
      return;
    }

    if (securityData.newPassword.length < 6) {
      setUpdateMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/v1/auth/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: securityData.currentPassword,
          newPassword: securityData.newPassword
        })
      });

      const data = await response.json();
      if (data.success) {
        setUpdateMessage({ type: 'success', text: 'Password changed successfully!' });
        setSecurityData({ 
          ...securityData, 
          currentPassword: '', 
          newPassword: '', 
          confirmPassword: '' 
        });
      } else {
        setUpdateMessage({ type: 'error', text: data.message || 'Failed to change password' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setUpdateMessage({ type: 'error', text: 'Failed to change password. Please try again.' });
    }
  };

  const handleNotificationUpdate = () => {
    alert('Notification preferences updated!');
  };

  const handleThemeUpdate = () => {
    alert('Theme settings updated!');
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Account Settings</h1>
      </div>

      {updateMessage.text && (
        <div style={{
          padding: '12px 20px',
          margin: '0 20px 20px',
          borderRadius: '6px',
          background: updateMessage.type === 'success' ? '#d4edda' : '#f8d7da',
          color: updateMessage.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${updateMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {updateMessage.type === 'success' && <CheckCircle size={18} />}
          {updateMessage.text}
        </div>
      )}

      <div className="settings-container">
        <div className="settings-sidebar">
          <nav className="settings-nav">
            <button 
              className={`settings-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={20} />
              Profile Information
            </button>
            <button 
              className={`settings-nav-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Shield size={20} />
              Security & Privacy
            </button>
            <button 
              className={`settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell size={20} />
              Notifications
            </button>
            <button 
              className={`settings-nav-item ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              <Palette size={20} />
              Appearance
            </button>
          </nav>
        </div>

        <div className="settings-content">
          {activeTab === 'profile' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Profile Information</h2>
                {profileData.role && (
                  <span style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    background: profileData.role.toLowerCase() === 'admin' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}>
                    {profileData.role}
                  </span>
                )}
              </div>
              {loading ? (
                <p>Loading profile...</p>
              ) : (
                <form onSubmit={handleProfileUpdate}>
                  <div className="form-group">
                    <label>Username (Read-only)</label>
                    <input
                      type="text"
                      value={profileData.username}
                      placeholder={profileData.username || 'Username'}
                      disabled
                      style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                    />
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                        placeholder={profileData.firstName || 'First Name'}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                        placeholder={profileData.lastName || 'Last Name'}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      placeholder={profileData.email || 'Email Address'}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Department</label>
                    <input
                      type="text"
                      value={profileData.department}
                      onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                      placeholder={profileData.department || 'Department'}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary">
                    <Save size={16} style={{ marginRight: '5px' }} />
                    Update Profile
                  </button>
                </form>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <h2>Security & Privacy</h2>
              
              <div className="security-section">
                <h3>Change Password</h3>
                <form onSubmit={handlePasswordChange}>
                  <div className="form-group">
                    <label>Current Password</label>
                    <div className="password-field">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={securityData.currentPassword}
                        onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>New Password</label>
                    <div className="password-field">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={securityData.newPassword}
                        onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={securityData.confirmPassword}
                      onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary">
                    Change Password
                  </button>
                </form>
              </div>

              <div className="security-section">
                <h3>Two-Factor Authentication</h3>
                <div className="toggle-setting">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={securityData.twoFactorEnabled}
                      onChange={(e) => setSecurityData({ ...securityData, twoFactorEnabled: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                    Enable Two-Factor Authentication
                  </label>
                  <p className="setting-description">
                    Add an extra layer of security to your account with two-factor authentication.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <h2>Notification Preferences</h2>
              
              <div className="notification-settings">
                <div className="toggle-setting">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                    Email Notifications
                  </label>
                  <p className="setting-description">Receive general notifications via email</p>
                </div>

                <div className="toggle-setting">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.maintenanceReminders}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, maintenanceReminders: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                    Maintenance Reminders
                  </label>
                  <p className="setting-description">Get notified about upcoming maintenance schedules</p>
                </div>

                <div className="toggle-setting">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.assetUpdates}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, assetUpdates: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                    Asset Updates
                  </label>
                  <p className="setting-description">Receive notifications when assets are added, modified, or removed</p>
                </div>

                <div className="toggle-setting">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.systemAlerts}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, systemAlerts: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                    System Alerts
                  </label>
                  <p className="setting-description">Important system notifications and security alerts</p>
                </div>

                <div className="toggle-setting">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.weeklyReports}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, weeklyReports: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                    Weekly Reports
                  </label>
                  <p className="setting-description">Receive weekly summary reports</p>
                </div>

                <button onClick={handleNotificationUpdate} className="btn btn-primary">
                  <Save size={16} style={{ marginRight: '5px' }} />
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="card">
              <h2>Appearance Settings</h2>
              
              <div className="appearance-settings">
                <div className="form-group">
                  <label>Theme</label>
                  <select
                    value={themeSettings.theme}
                    onChange={(e) => setThemeSettings({ ...themeSettings, theme: e.target.value })}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Accent Color</label>
                  <input
                    type="color"
                    value={themeSettings.accentColor}
                    onChange={(e) => setThemeSettings({ ...themeSettings, accentColor: e.target.value })}
                    className="color-picker"
                  />
                </div>

                <div className="toggle-setting">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={themeSettings.compactMode}
                      onChange={(e) => setThemeSettings({ ...themeSettings, compactMode: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                    Compact Mode
                  </label>
                  <p className="setting-description">Use a more compact layout to fit more content on screen</p>
                </div>

                <div className="toggle-setting">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={themeSettings.sidebarCollapsed}
                      onChange={(e) => setThemeSettings({ ...themeSettings, sidebarCollapsed: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                    Collapsed Sidebar
                  </label>
                  <p className="setting-description">Start with sidebar collapsed by default</p>
                </div>

                <button onClick={handleThemeUpdate} className="btn btn-primary">
                  <Save size={16} style={{ marginRight: '5px' }} />
                  Apply Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;