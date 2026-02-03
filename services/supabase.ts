
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wzryvjkpmzjzlddvrzks.supabase.co';
const supabaseKey = 'sb_publishable_kl3mEjOIiw4Cp4MPi4rpzg_eTSEwIQS';

export const supabase = createClient(supabaseUrl, supabaseKey);
