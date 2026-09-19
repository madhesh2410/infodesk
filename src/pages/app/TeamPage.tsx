import { useState } from 'react';
import { UserPlus, Users, MoreHorizontal, X } from 'lucide-react';
import { useDemo } from '@/context/DemoContext';
import { useToast } from '@/context/ToastContext';
import { StatusBadge, RoleBadge } from '@/components/shared/Badge';
import { Dialog, ConfirmDialog } from '@/components/shared/Dialog';
import { formatDate, getInitials } from '@/lib/utils';
import type { TeamMember } from '@/types';

export default function TeamPage() {
  const { team, inviteMember, updateMemberRole, removeMember } = useDemo();
  const toast = useToast();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'staff'>('staff');

  function handleInvite() {
    if (!inviteEmail || !inviteName) {
      toast.error('Please fill in all fields.');
      return;
    }
    inviteMember({
      user_id: `user-${Date.now()}`,
      organization_id: 'org-demo-001',
      full_name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      status: 'invited',
    });
    toast.success('Invitation sent!', `${inviteName} has been invited as ${inviteRole}.`);
    setInviteOpen(false);
    setInviteEmail('');
    setInviteName('');
    setInviteRole('staff');
  }

  function handleRemove() {
    if (!removeTarget) return;
    removeMember(removeTarget.id);
    toast.success('Member removed', `${removeTarget.full_name} has been removed.`);
    setRemoveTarget(null);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-description">Manage team members and their roles.</p>
        </div>
        <button onClick={() => setInviteOpen(true)} className="btn btn-primary shrink-0 gap-1.5">
          <UserPlus className="h-4 w-4" /> Invite Member
        </button>
      </div>

      {/* Role legend */}
      <div className="card">
        <h3 className="text-xs font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
          <Users className="h-3.5 w-3.5" /> Role Permissions
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { role: 'super_admin', label: 'Super Admin', perms: ['Manage users', 'Organization settings', 'Full access'] },
            { role: 'admin', label: 'Admin', perms: ['Manage forms', 'View all responses', 'Manage emails'] },
            { role: 'staff', label: 'Staff', perms: ['Create forms', 'View assigned responses', 'Export data'] },
          ].map(r => (
            <div key={r.role} className="bg-gray-50 rounded-lg p-3">
              <RoleBadge role={r.role} />
              <ul className="mt-2 space-y-1">
                {r.perms.map(p => (
                  <li key={p} className="text-[11px] text-[var(--color-text-secondary)] flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-[var(--color-primary)] shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Members table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex items-center justify-between">
          <h3 className="text-sm font-semibold">{team.length} Members</h3>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Last Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {team.map(member => (
                <tr key={member.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {getInitials(member.full_name)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[var(--color-text-primary)]">{member.full_name}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)]">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><RoleBadge role={member.role} /></td>
                  <td><StatusBadge status={member.status} /></td>
                  <td className="text-xs text-[var(--color-text-muted)]">{formatDate(member.joined_at)}</td>
                  <td className="text-xs text-[var(--color-text-muted)]">
                    {member.last_active ? formatDate(member.last_active) : '—'}
                  </td>
                  <td>
                    {member.role !== 'super_admin' && (
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === member.id ? null : member.id)}
                          className="btn btn-ghost btn-sm p-1.5"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                        {menuOpen === member.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                            <div className="absolute right-0 top-8 bg-white border border-[var(--color-border)] rounded-lg shadow-lg py-1 z-20 w-40 animate-scale-in">
                              <p className="px-3 py-1.5 text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Change Role</p>
                              {(['admin', 'staff'] as const).map(role => (
                                <button
                                  key={role}
                                  onClick={() => { updateMemberRole(member.id, role); toast.success('Role updated'); setMenuOpen(null); }}
                                  className={`flex items-center gap-2 w-full px-3 py-2 text-xs ${member.role === role ? 'text-[var(--color-primary)] font-medium' : 'text-[var(--color-text-secondary)]'} hover:bg-gray-50 capitalize`}
                                >
                                  {role.replace('_', ' ')}
                                  {member.role === role && ' ✓'}
                                </button>
                              ))}
                              <div className="my-1 h-px bg-gray-100" />
                              <button
                                onClick={() => { setRemoveTarget(member); setMenuOpen(null); }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                              >
                                Remove Member
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Team Member" description="Send an invitation to a new team member.">
        <div className="space-y-4 mt-2">
          <div className="form-group">
            <label className="form-label required">Full Name</label>
            <input className="input" value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="e.g. Dr. Ananya Krishnan" />
          </div>
          <div className="form-group">
            <label className="form-label required">Email Address</label>
            <input type="email" className="input" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@institution.edu" />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="select" value={inviteRole} onChange={e => setInviteRole(e.target.value as 'admin' | 'staff')}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleInvite} className="btn btn-primary flex-1 justify-center">Send Invitation</button>
            <button onClick={() => setInviteOpen(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </div>
      </Dialog>

      {/* Remove confirmation */}
      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        title="Remove Member"
        description={`Are you sure you want to remove ${removeTarget?.full_name} from the team? They will lose access immediately.`}
        confirmLabel="Remove"
        variant="destructive"
      />
    </div>
  );
}
