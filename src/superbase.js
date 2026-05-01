import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) console.error('Login error:', error);
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function saveProgressToCloud(userId, progress) {
  const { error } = await supabase
    .from('progress')
    .upsert({ user_id: userId, ...progress, updated_at: new Date() });
  if (error) console.error('Save error:', error);
}

export async function loadProgressFromCloud(userId) {
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data;
}