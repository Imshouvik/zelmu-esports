import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijzkiuutjfmllnkdketi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqemtpdXV0amZtbGxua2RrZXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTU3MjQsImV4cCI6MjA2NTgzMTcyNH0.jY1MyjjQrG1bjqeHgVbbRemaXXM2b0PXrW_YG19vzO0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 