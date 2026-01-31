import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtdzotfhixgwqujdhkbv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0ZHpvdGZoaXhnd3F1amRoa2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTE0MjMsImV4cCI6MjA4NDcyNzQyM30.R00o2oik8hexR-wPpO0v7v0tef8JWY0QojkZB6Cf1_k';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
