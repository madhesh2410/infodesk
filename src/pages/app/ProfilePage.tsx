import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { fetchUserProfile, updateUserProfile, getStoredParticipantProfile, saveStoredParticipantProfile } from '@/lib/profile-service';
import type { UserProfile } from '@/types';

export default function ProfilePage() {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [course, setCourse] = useState('');
  const [department, setDepartment] = useState('');
  const [otherInfo, setOtherInfo] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let profile: UserProfile | Partial<UserProfile> | null = null;
        if (user?.id) {
          profile = await fetchUserProfile(user.id);
        }
        if (!profile) {
          profile = getStoredParticipantProfile();
        }

        if (profile) {
          setFullName(profile.full_name || user?.full_name || '');
          setEmail(profile.email || user?.email || '');
          setPhone(profile.phone || '');
          setDateOfBirth(profile.date_of_birth || '');
          setAddress(profile.address || '');
          setCity(profile.city || '');
          setState(profile.state || '');
          setPincode(profile.pincode || '');
          setCollegeName(profile.college_name || '');
          setStudentId(profile.student_id || '');
          setCourse(profile.course || '');
          setDepartment(profile.department || '');
          setOtherInfo(profile.other_info || '');
        } else if (user) {
          setFullName(user.full_name || '');
          setEmail(user.email || '');
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<UserProfile> = {
        full_name: fullName,
        email: email || user?.email,
        phone,
        date_of_birth: dateOfBirth,
        address,
        city,
        state,
        pincode,
        college_name: collegeName,
        student_id: studentId,
        course,
        department,
        other_info: otherInfo,
      };

      if (user?.id) {
        await updateUserProfile(user.id, payload);
      }
      // Always store locally so participant forms auto-fill seamlessly
      saveStoredParticipantProfile(payload);

      toast.success('Profile Saved!', 'Your personal profile has been updated and will auto-fill future forms.');
    } catch (err: any) {
      toast.error('Failed to save profile', err.message || 'An error occurred.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading your personal profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl pb-12">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title text-2xl font-bold text-gray-900">Personal Profile</h1>
          <p className="page-description text-gray-500 mt-1">
            Store your personal, contact, and academic details once for intelligent form auto-fill.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary self-start sm:self-auto flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Save Profile</span>
            </>
          )}
        </button>
      </div>

      {/* Auto-fill Info Banner */}
      <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-sm flex items-start gap-3 shadow-xs">
        <div className="p-1 bg-blue-100 rounded-md text-blue-700 shrink-0 mt-0.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-blue-950">Smart Form Auto-Fill Enabled</p>
          <p className="text-xs text-blue-800 mt-0.5 leading-relaxed">
            When you open an InfoDesk form, questions requesting your Name, Email, Phone, College, Student ID, or Department will be automatically populated with this data. You can always review and edit your answers before submitting.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Basic Identity */}
        <div className="card p-6 bg-white rounded-xl border border-gray-200 shadow-xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Personal & Contact Information
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Basic identity details used across registration forms.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Madhesh M"
                className="input text-sm w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. madhesh@example.com"
                className="input text-sm w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="input text-sm w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={e => setDateOfBirth(e.target.value)}
                className="input text-sm w-full"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Address */}
        <div className="card p-6 bg-white rounded-xl border border-gray-200 shadow-xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              Address Details
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Location information for official documents and applications.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Address / Street</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Flat / Door No., Street name"
                className="input text-sm w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Chennai"
                className="input text-sm w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={e => setState(e.target.value)}
                placeholder="e.g. Tamil Nadu"
                className="input text-sm w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode / ZIP</label>
              <input
                type="text"
                value={pincode}
                onChange={e => setPincode(e.target.value)}
                placeholder="e.g. 600044"
                className="input text-sm w-full"
              />
            </div>
          </div>
        </div>

        {/* Section 3: College / Academic / Organization */}
        <div className="card p-6 bg-white rounded-xl border border-gray-200 shadow-xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
              Academic & Organization Details
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Institutional affiliations and identifiers.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">College / Organization</label>
              <input
                type="text"
                value={collegeName}
                onChange={e => setCollegeName(e.target.value)}
                placeholder="e.g. Sri Sairam Engineering College"
                className="input text-sm w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Student / Employee ID</label>
              <input
                type="text"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                placeholder="e.g. SEC-2026-IT042"
                className="input text-sm w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Course / Degree</label>
              <input
                type="text"
                value={course}
                onChange={e => setCourse(e.target.value)}
                placeholder="e.g. B.Tech"
                className="input text-sm w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                placeholder="e.g. Information Technology"
                className="input text-sm w-full"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Other information */}
        <div className="card p-6 bg-white rounded-xl border border-gray-200 shadow-xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              Other Information
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Additional details or notes.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Notes / Bio / Alternate Contacts</label>
            <textarea
              rows={3}
              value={otherInfo}
              onChange={e => setOtherInfo(e.target.value)}
              placeholder="Any additional information you often supply on forms..."
              className="input text-sm w-full"
            />
          </div>
        </div>

        {/* Footer save button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary px-6 py-2.5 flex items-center gap-2"
          >
            {saving ? 'Saving Profile...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
