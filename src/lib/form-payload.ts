import type { Form } from '@/types';

/**
 * Encodes a Form object into a compact base64url string suitable for URL parameters / QR codes.
 * This enables cross-device and QR code submissions even in offline / local environments.
 */
export function encodeFormPayload(form: Form): string {
  try {
    const compact = {
      id: form.id,
      title: form.title,
      description: form.description || '',
      category: form.category || 'General',
      slug: form.slug,
      status: form.status,
      fields: form.fields,
      settings: form.settings,
    };
    const json = JSON.stringify(compact);
    const base64 = btoa(unescape(encodeURIComponent(json)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    console.warn('Failed to encode form payload:', e);
    return '';
  }
}

/**
 * Decodes a base64url string back into a Form object.
 */
export function decodeFormPayload(payload: string): Form | null {
  try {
    let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const json = decodeURIComponent(escape(atob(base64)));
    const parsed = JSON.parse(json);
    if (!parsed || !parsed.id || !parsed.title || !Array.isArray(parsed.fields)) {
      return null;
    }
    return {
      ...parsed,
      organization_id: parsed.organization_id || 'org-public',
      created_by: parsed.created_by || 'creator',
      created_at: parsed.created_at || new Date().toISOString(),
      updated_at: parsed.updated_at || new Date().toISOString(),
      response_count: parsed.response_count || 0,
    } as Form;
  } catch (e) {
    console.warn('Failed to decode form payload:', e);
    return null;
  }
}
