import { supabase, isSupabaseConfigured } from './supabase';
import type { UserProfile, UserRole } from '@/types';

const LOCAL_PROFILES_KEY_PREFIX = 'infodesk_user_profile_';

function getLocalProfile(authUserId: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(`${LOCAL_PROFILES_KEY_PREFIX}${authUserId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocalProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(
      `${LOCAL_PROFILES_KEY_PREFIX}${profile.auth_user_id}`,
      JSON.stringify(profile)
    );
  } catch (e) {
    console.warn('Failed to cache profile locally:', e);
  }
}

export const PARTICIPANT_PROFILE_KEY = 'infodesk_participant_profile';

export function getStoredParticipantProfile(): Partial<UserProfile> | null {
  try {
    const raw = localStorage.getItem(PARTICIPANT_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredParticipantProfile(profile: Partial<UserProfile>): void {
  try {
    localStorage.setItem(PARTICIPANT_PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Failed to save participant profile:', e);
  }
}

/**
 * Retrieves a user profile by authenticated user ID (auth_user_id).
 */
export async function fetchUserProfile(authUserId: string): Promise<UserProfile | null> {
  if (!authUserId) {
    // Return stored participant profile if available
    const local = getStoredParticipantProfile();
    return local ? (local as UserProfile) : null;
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', authUserId)
        .maybeSingle();

      if (!error && data) {
        saveLocalProfile(data as UserProfile);
        saveStoredParticipantProfile(data as UserProfile);
        return data as UserProfile;
      }
    } catch (e) {
      console.warn('Error fetching profile from Supabase, falling back to cache:', e);
    }
  }

  // Fallback to locally cached profile by auth_user_id
  const cached = getLocalProfile(authUserId) || (getStoredParticipantProfile() as UserProfile | null);
  return cached;
}

/**
 * Creates a new user profile with safe default role ('user') and timezone ('Asia/Kolkata').
 */
export async function createUserProfile(params: {
  auth_user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role?: UserRole;
  timezone?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  college_name?: string;
  student_id?: string;
  course?: string;
  department?: string;
  other_info?: string;
}): Promise<UserProfile> {
  // Check if profile already exists to avoid overwriting customized data
  const existing = await fetchUserProfile(params.auth_user_id);
  if (existing) {
    return existing;
  }

  const newProfile: UserProfile = {
    auth_user_id: params.auth_user_id,
    full_name: params.full_name || params.email.split('@')[0] || 'User',
    email: params.email,
    avatar_url: params.avatar_url,
    role: params.role || 'user',
    timezone: params.timezone || 'Asia/Kolkata',
    phone: params.phone || '',
    date_of_birth: params.date_of_birth || '',
    address: params.address || '',
    city: params.city || '',
    state: params.state || '',
    pincode: params.pincode || '',
    college_name: params.college_name || '',
    student_id: params.student_id || '',
    course: params.course || '',
    department: params.department || '',
    other_info: params.other_info || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(newProfile, { onConflict: 'auth_user_id' })
        .select()
        .single();

      if (!error && data) {
        saveLocalProfile(data as UserProfile);
        saveStoredParticipantProfile(data as UserProfile);
        return data as UserProfile;
      }
      if (error) {
        console.warn('Database profile creation notice:', error.message);
      }
    } catch (e) {
      console.warn('Could not insert profile to Supabase database, using local storage:', e);
    }
  }

  // Save to local profile storage
  saveLocalProfile(newProfile);
  saveStoredParticipantProfile(newProfile);
  return newProfile;
}

/**
 * Updates an existing user profile by auth_user_id.
 */
export async function updateUserProfile(
  authUserId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> {
  const existing = await fetchUserProfile(authUserId);
  const updatedProfile: UserProfile = {
    auth_user_id: authUserId,
    full_name: updates.full_name ?? existing?.full_name ?? 'User',
    email: updates.email ?? existing?.email ?? '',
    avatar_url: updates.avatar_url ?? existing?.avatar_url,
    role: existing?.role ?? 'user',
    timezone: updates.timezone ?? existing?.timezone ?? 'Asia/Kolkata',
    phone: updates.phone ?? existing?.phone ?? '',
    date_of_birth: updates.date_of_birth ?? existing?.date_of_birth ?? '',
    address: updates.address ?? existing?.address ?? '',
    city: updates.city ?? existing?.city ?? '',
    state: updates.state ?? existing?.state ?? '',
    pincode: updates.pincode ?? existing?.pincode ?? '',
    college_name: updates.college_name ?? existing?.college_name ?? '',
    student_id: updates.student_id ?? existing?.student_id ?? '',
    course: updates.course ?? existing?.course ?? '',
    department: updates.department ?? existing?.department ?? '',
    other_info: updates.other_info ?? existing?.other_info ?? '',
    created_at: existing?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: updatedProfile.full_name,
          email: updatedProfile.email,
          avatar_url: updatedProfile.avatar_url,
          timezone: updatedProfile.timezone,
          phone: updatedProfile.phone,
          date_of_birth: updatedProfile.date_of_birth,
          address: updatedProfile.address,
          city: updatedProfile.city,
          state: updatedProfile.state,
          pincode: updatedProfile.pincode,
          college_name: updatedProfile.college_name,
          student_id: updatedProfile.student_id,
          course: updatedProfile.course,
          department: updatedProfile.department,
          other_info: updatedProfile.other_info,
          updated_at: updatedProfile.updated_at,
        })
        .eq('auth_user_id', authUserId)
        .select()
        .single();

      if (!error && data) {
        saveLocalProfile(data as UserProfile);
        saveStoredParticipantProfile(data as UserProfile);
        return data as UserProfile;
      }
    } catch (e) {
      console.warn('Could not update profile in Supabase:', e);
    }
  }

  saveLocalProfile(updatedProfile);
  saveStoredParticipantProfile(updatedProfile);
  return updatedProfile;
}
