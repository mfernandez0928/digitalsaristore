import { createClient } from '@supabase/supabase-js';

let supabaseInstance: ReturnType<typeof createClient> | null = null;
let isMockMode = false;

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase configuration missing. Falling back to Mock Mode.');
    isMockMode = true;
    return null;
  }

  // Sanitize and validate URL
  const sanitizedUrl = supabaseUrl.replace(/['"]/g, '').trim().replace(/\/$/, '');
  const sanitizedKey = supabaseAnonKey.replace(/['"]/g, '').trim();

  try {
    // Check for swapped values
    if (sanitizedUrl.startsWith('eyJ')) {
      throw new Error('Swapped Configuration: It looks like you put the Supabase Anon Key in the VITE_SUPABASE_URL field. Please swap them in the Secrets panel.');
    }

    if (sanitizedKey.startsWith('https://')) {
      throw new Error('Swapped Configuration: It looks like you put the Supabase URL in the VITE_SUPABASE_ANON_KEY field. Please swap them in the Secrets panel.');
    }

    if (!sanitizedUrl.startsWith('https://')) {
      throw new Error('Invalid Supabase URL. It must start with https:// (e.g., https://xyz.supabase.co).');
    }

    if (sanitizedUrl.includes('localhost')) {
      throw new Error('Supabase URL cannot be localhost. Please use your project URL from the Supabase dashboard.');
    }

    // Comprehensive Stripe key detection
    const stripePrefixes = ['sb_publishable_', 'pk_test_', 'pk_live_', 'sk_test_', 'sk_live_', 'sb_'];
    const foundStripePrefix = stripePrefixes.find(p => sanitizedKey.toLowerCase().startsWith(p.toLowerCase()));
    
    if (foundStripePrefix) {
      throw new Error(`Configuration Error: You have provided a Stripe key (starting with "${foundStripePrefix}") in the VITE_SUPABASE_ANON_KEY field. Supabase keys always start with "eyJ". Please go to your Supabase Dashboard -> Project Settings -> API and copy the "anon public" key.`);
    }

    if (!sanitizedKey.startsWith('eyJ')) {
      throw new Error('Invalid Supabase Anon Key format. Supabase keys are long strings that must start with "eyJ". Please check your VITE_SUPABASE_ANON_KEY in the Secrets panel.');
    }

    supabaseInstance = createClient(sanitizedUrl, sanitizedKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    return supabaseInstance;
  } catch (err) {
    console.warn('Supabase initialization failed. Falling back to Mock Mode:', err);
    isMockMode = true;
    return null;
  }
};

export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const supabase = getSupabase();
    if (!supabase || isMockMode) return false;
    
    const { data, error } = await supabase.storage.listBuckets();
    if (error) return false;
    return true;
  } catch (err) {
    return false;
  }
};

const BUCKET_NAME = 'product-images';

export const uploadProductImage = async (file: File): Promise<{ url: string; path: string }> => {
  const supabase = getSupabase();

  if (isMockMode || !supabase) {
    console.log('Mock Mode: Simulating image upload');
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Use a placeholder image based on the file name or just a random one
    const randomId = Math.floor(Math.random() * 1000);
    const mockUrl = `https://picsum.photos/seed/${randomId}/800/800`;
    return { url: mockUrl, path: `mock/products/${file.name}` };
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `products/${fileName}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      if (uploadError.message.includes('bucket not found')) {
        throw new Error(`Supabase error: The bucket "${BUCKET_NAME}" was not found. Please create a public bucket named "${BUCKET_NAME}" in your Supabase storage.`);
      }
      if (uploadError.message.includes('row-level security policy')) {
        throw new Error(`Supabase RLS Error: Your storage bucket "${BUCKET_NAME}" has Row Level Security enabled but no policy allows uploads. Please run the SQL fix in the Supabase SQL Editor.`);
      }
      throw new Error(`Supabase upload error: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return { url: publicUrl, path: filePath };
  } catch (err: any) {
    console.error('Supabase Upload Error:', err);
    throw err;
  }
};

export const deleteProductImage = async (path: string): Promise<void> => {
  const supabase = getSupabase();
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    console.error('Supabase delete error:', error.message);
  }
};
