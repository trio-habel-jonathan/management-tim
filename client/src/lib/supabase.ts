import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase connection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lojkoonbdgicltzrxvze.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvamtvb25iZGdpY2x0enJ4dnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMDg1NjAsImV4cCI6MjA1OTU4NDU2MH0.ItBmRMw8LCZLY7Ikvb08mopK72HjtLVr92gInlLeBE0';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
