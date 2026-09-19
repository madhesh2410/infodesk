import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getInitials } from '@/lib/utils';
import { RoleBadge } from '@/components/shared/Badge';

const TABS = ['Profile', 'Organization', 'Notifications', 'Security'];

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('Profile');

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [orgName, setOrgName] = useState(user?.organization_name ?? 'Sri Sairam Demo Institution');
  const [timezone, setTimezone] = useState(user?.timezone ?? 'Asia/Kolkata');
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifNewResp, setNotifNewResp] = useState(true);
  const [notifDocs, setNotifDocs] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setTimezone(user.timezone ?? 'Asia/Kolkata');
      if (user.organization_name) setOrgName(user.organization_name);
    }
  }, [user]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({
        full_name: fullName,
        timezone,
      });
      toast.success('Settings saved!', 'Your profile preferences have been updated.');
    } catch (err: any) {
      toast.error('Failed to save settings', err.message);
    } finally {
      setSaving(false);
    }
  }

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-[var(--color-primary)]' : 'bg-gray-200'}`}
    >
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-description">Manage your account and organization preferences.</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-44 shrink-0 hidden sm:block">
          <nav className="space-y-0.5">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`nav-item w-full text-left ${activeTab === tab ? 'active' : ''}`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile tabs */}
        <div className="sm:hidden flex gap-2 overflow-x-auto pb-1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${activeTab === tab ? 'bg-[var(--color-primary)] text-white' : 'border border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 max-w-lg">
          {activeTab === 'Profile' && (
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Profile Settings</h3>
                {user?.provider === 'demo' && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    Demo Account
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-4">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={fullName}
                    className="w-16 h-16 rounded-full object-cover shrink-0 border-2 border-[var(--color-border)] shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xl font-bold shrink-0">
                    {getInitials(fullName)}
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-sm text-[var(--color-text-primary)] font-semibold">{fullName}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{user?.email}</p>
                  <div className="pt-0.5">
                    <RoleBadge role={user?.role ?? 'user'} />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="input"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your Name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  className="input bg-gray-50 text-[var(--color-text-secondary)] cursor-not-allowed"
                  value={user?.email ?? ''}
                  readOnly
                />
                <p className="form-hint">Email address is managed by your authentication provider and cannot be edited.</p>
              </div>

              <div className="form-group">
                <label className="form-label">Timezone</label>
                <select className="select" value={timezone} onChange={e => setTimezone(e.target.value)}>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'Organization' && (
            <div className="card space-y-4">
              <h3 className="text-sm font-semibold">Organization Settings</h3>
              <div className="form-group">
                <label className="form-label">Organization Name</label>
                <input className="input" value={orgName} onChange={e => setOrgName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Organization Logo</label>
                <div className="dropzone" style={{ padding: '1rem' }} onClick={() => {}}>
                  <p className="text-xs text-[var(--color-text-muted)]">Click to upload logo (PNG, SVG, max 2MB)</p>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" className="w-10 h-10 rounded border border-[var(--color-border)] cursor-pointer" defaultValue="#3730a3" />
                  <span className="text-xs text-[var(--color-text-muted)]">Used in forms and emails</span>
                </div>
              </div>
              <button onClick={handleSave} className="btn btn-primary">Save Changes</button>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div className="card space-y-4">
              <h3 className="text-sm font-semibold">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { label: 'Email notifications', desc: 'Receive important system emails', checked: notifEmail, onChange: setNotifEmail },
                  { label: 'New response alerts', desc: 'Get notified when a new response is submitted', checked: notifNewResp, onChange: setNotifNewResp },
                  { label: 'Document upload alerts', desc: 'Get notified when documents are uploaded', checked: notifDocs, onChange: setNotifDocs },
                ].map(n => (
                  <div key={n.label} className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0">
                    <div>
                      <p className="text-xs font-medium text-[var(--color-text-primary)]">{n.label}</p>
                      <p className="text-[11px] text-[var(--color-text-muted)]">{n.desc}</p>
                    </div>
                    <Toggle checked={n.checked} onChange={n.onChange} />
                  </div>
                ))}
              </div>
              <button onClick={handleSave} className="btn btn-primary">Save Preferences</button>
            </div>
          )}

          {activeTab === 'Security' && (
            <div className="card space-y-4">
              <h3 className="text-sm font-semibold">Security Settings</h3>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" className="input" placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="input" placeholder="At least 8 characters" />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="input" placeholder="Re-enter new password" />
              </div>
              <button onClick={() => toast.info('Password change coming soon in full version.')} className="btn btn-primary">
                Change Password
              </button>

              <div className="pt-4 border-t border-[var(--color-border)]">
                <h4 className="text-xs font-semibold text-[var(--color-text-primary)] mb-2">Active Sessions</h4>
                <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[var(--color-text-primary)]">Current session</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">Chrome on Windows · {new Date().toLocaleDateString('en-IN')}</p>
                  </div>
                  <span className="text-[10px] text-green-600 font-semibold">Active</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
