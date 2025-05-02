import supabase from '@/lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create freelancer_profiles table if it doesn't exist
    const { error: profilesError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'freelancer_profiles',
      columns: `
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        username text UNIQUE NOT NULL,
        full_name text NOT NULL,
        bio text,
        profile_image text,
        primary_field text,
        hourly_rate integer,
        experience_level text,
        portfolio_url text,
        linkedin_url text,
        github_url text,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
      `
    });

    if (profilesError) {
      throw profilesError;
    }

    // Create freelancer_education table if it doesn't exist
    const { error: educationError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'freelancer_education',
      columns: `
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        institution text NOT NULL,
        degree text NOT NULL,
        field_of_study text NOT NULL,
        start_date date NOT NULL,
        end_date date,
        is_current boolean DEFAULT false,
        created_at timestamp with time zone DEFAULT now()
      `
    });

    if (educationError) {
      throw educationError;
    }

    // Create freelancer_skills table if it doesn't exist
    const { error: skillsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'freelancer_skills',
      columns: `
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        skill_name text NOT NULL,
        created_at timestamp with time zone DEFAULT now()
      `
    });

    if (skillsError) {
      throw skillsError;
    }

    // Create storage bucket if it doesn't exist
    const { error: storageError } = await supabase.storage.createBucket('freelancer-images', {
      public: true
    });

    // Ignore error if bucket already exists
    if (storageError && storageError.message !== 'Bucket already exists') {
      throw storageError;
    }

    return res.status(200).json({ success: true, message: 'Tables created successfully' });
  } catch (error) {
    console.error('Error creating tables:', error);
    return res.status(500).json({ error: error.message });
  }
} 