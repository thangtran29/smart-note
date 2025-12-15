'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/supabase/types';

type GetProfileResult = { success: true; profile: Profile } | { success: false; error: string };
type UpdateProfileResult = { success: true; profile: Profile } | { success: false; error: string };

export async function getProfile(): Promise<GetProfileResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return { success: false, error: 'Failed to fetch profile' };
  }

  return { success: true, profile: data as Profile };
}

export async function updateProfile(input: { username?: string }): Promise<UpdateProfileResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const updateData: { username?: string } = {};
  if (input.username !== undefined) {
    updateData.username = input.username.trim() || null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData as never)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: 'Failed to update profile' };
  }

  revalidatePath('/settings/profile');
  return { success: true, profile: data as Profile };
}

