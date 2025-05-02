import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting database setup...');

    // Create profiles table
    await supabase.from('profiles').select('count').limit(1).catch(async (err) => {
      console.log('Creating profiles table...');
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id),
          full_name TEXT,
          avatar_url TEXT,
          bio TEXT,
          updated_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
    });

    // Create freelancer_profiles table
    await supabase.from('freelancer_profiles').select('count').limit(1).catch(async (err) => {
      console.log('Creating freelancer_profiles table...');
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS public.freelancer_profiles (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id),
          username TEXT UNIQUE,
          hourly_rate NUMERIC(10, 2) DEFAULT 0,
          portfolio_url TEXT,
          linkedin_url TEXT,
          github_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
    });

    // Create freelancer_education table
    await supabase.from('freelancer_education').select('count').limit(1).catch(async (err) => {
      console.log('Creating freelancer_education table...');
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS public.freelancer_education (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id),
          institution TEXT NOT NULL,
          department TEXT,
          degree TEXT,
          graduation_year INTEGER,
          is_current BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
    });

    // Create freelancer_skills table
    await supabase.from('freelancer_skills').select('count').limit(1).catch(async (err) => {
      console.log('Creating freelancer_skills table...');
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS public.freelancer_skills (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id),
          skill_name TEXT NOT NULL,
          proficiency_level TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
    });

    // Create storage bucket if it doesn't exist
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets.some(bucket => bucket.name === 'profile-images')) {
        await supabase.storage.createBucket('profile-images', {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024, // 5MB limit
        });
        console.log('Created profile-images bucket');
      }
    } catch (bucketError) {
      console.log('Storage API error:', bucketError);
    }

    // Respond with success
    return res.status(200).json({ 
      message: 'Database setup successful',
      tables: [
        'profiles',
        'freelancer_profiles',
        'freelancer_education',
        'freelancer_skills'
      ]
    });
  } catch (error) {
    console.error('Database setup error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to set up database'
    });
  }
} 