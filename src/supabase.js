// supabase.js - Supabase Client & PostgreSQL Database Configuration for Minyara SMS

import { createClient } from '@supabase/supabase-js';

// Table names matching PostgreSQL schema
export const TABLES = {
    SETTINGS: 'settings',
    STUDENTS: 'students',
    CLASSES: 'classes',
    PAYMENTS: 'payments',
    TEACHERS: 'teachers',
    PARENTS: 'parents'
};

// Retrieve environment credentials or stored override
function getCredentials() {
    const customUrl = localStorage.getItem('minyara_supabase_url');
    const customKey = localStorage.getItem('minyara_supabase_key');

    const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    const url = customUrl || envUrl;
    const key = customKey || envKey;

    return {
        url: url.trim(),
        key: key.trim(),
        isConfigured: Boolean(url && key && !url.includes('your-project') && !url.includes('placeholder') && !key.includes('placeholder'))
    };
}

export function isSupabaseConfigured() {
    return getCredentials().isConfigured;
}

let clientInstance = null;

export function getSupabase() {
    const creds = getCredentials();
    if (!clientInstance) {
        const targetUrl = creds.url || 'https://placeholder-project.supabase.co';
        const targetKey = creds.key || 'placeholder-anon-key';
        
        clientInstance = createClient(targetUrl, targetKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true
            },
            db: {
                schema: 'public'
            }
        });
    }
    return clientInstance;
}

export function updateSupabaseCredentials(url, key) {
    if (url) localStorage.setItem('minyara_supabase_url', url.trim());
    else localStorage.removeItem('minyara_supabase_url');

    if (key) localStorage.setItem('minyara_supabase_key', key.trim());
    else localStorage.removeItem('minyara_supabase_key');

    // Force client recreation with new credentials
    clientInstance = null;
    return getSupabase();
}

export const supabase = getSupabase();

/**
 * Health check: tests connection to Supabase database
 * @returns {Promise<{connected: boolean, message: string, url: string}>}
 */
export async function testSupabaseConnection() {
    const creds = getCredentials();
    if (!creds.isConfigured) {
        return {
            connected: false,
            isConfigured: false,
            message: 'Supabase credentials not configured yet. Operating in resilient local state.',
            url: creds.url || 'Not Set'
        };
    }

    try {
        const client = getSupabase();
        const { data, error } = await client.from(TABLES.SETTINGS).select('id').limit(1);
        if (error) {
            return {
                connected: false,
                isConfigured: true,
                message: `Connection Error: ${error.message}`,
                url: creds.url
            };
        }
        return {
            connected: true,
            isConfigured: true,
            message: 'Connected to Supabase PostgreSQL Database',
            url: creds.url
        };
    } catch (err) {
        return {
            connected: false,
            isConfigured: true,
            message: `Connection failed: ${err.message}`,
            url: creds.url
        };
    }
}

/**
 * Real-time table subscription helper
 */
export function subscribeToTable(tableName, callback) {
    if (!isSupabaseConfigured()) return null;
    try {
        const client = getSupabase();
        const channel = client
            .channel(`sms-realtime-${tableName}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, payload => {
                if (callback) callback(payload);
            })
            .subscribe();
        return channel;
    } catch(e) {
        return null;
    }
}
