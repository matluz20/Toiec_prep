import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getGuestId() {
  let guestId = localStorage.getItem('toeic_guest_id');
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substr(2, 12);
    localStorage.setItem('toeic_guest_id', guestId);
  }
  return guestId;
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) console.error('Login error:', error);
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function saveProgressToCloud(userId, progress, isGuest = false) {
  const { error } = await supabase
    .from('progress')
    .upsert({
      user_id: userId,
      is_guest: isGuest,
      display_name: progress.username || null,
      xp: progress.xp,
      streak: progress.streak,
      quizzes: progress.quizzes,
      best_score: progress.best_score,
      earned_badges: progress.earned_badges,
      username: progress.username,
      challenge_done: progress.challenge_done,
      perfect_scores: progress.perfect_scores,
      fast_answers: progress.fast_answers,
      updated_at: new Date(),
    }, { onConflict: 'user_id' });
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

export async function fetchLeaderboard() {
  const { data, error } = await supabase
    .from('progress')
    .select('user_id, display_name, username, xp, best_score, is_guest')
    .not('username', 'is', null)
    .order('xp', { ascending: false })
    .limit(50);
  if (error) { console.error('Leaderboard error:', error); return []; }
  return data || [];
}

// Check if username is already taken
export async function checkUsernameAvailable(username) {
  const { data } = await supabase
    .from('progress')
    .select('username')
    .eq('username', username)
    .single();
  return !data; // true = available
}

// Update username only
export async function updateUsername(userId, username) {
  const { error } = await supabase
    .from('progress')
    .update({ username, display_name: username })
    .eq('user_id', userId);
  if (error) {
    if (error.code === '23505') return { error: 'Username already taken' };
    return { error: error.message };
  }
  return { error: null };
}