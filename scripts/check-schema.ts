import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkSchema() {
  const { data, error } = await supabase
    .from('skills')
    .select('skill_name, credits_per_call, usd_per_call')
    .order('skill_name');

  if (error) {
    console.error('Error fetching skills:', error);
    return;
  }
  console.log('\n📊 Current Pricing in Supabase skills table:');
  console.table(data);
}

checkSchema();
