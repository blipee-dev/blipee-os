import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user profile from app_users table using admin client to avoid RLS issues
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('app_users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // If no profile exists, return user auth data
    const profileData = profile || {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
      name: user.user_metadata?.full_name || '',
      phone: user.user_metadata?.phone || '',
      avatar_url: user.user_metadata?.avatar_url || '',
      department: '',
      title: '',
      bio: '',
      metadata: {},
    };

    return NextResponse.json({ 
      success: true,
      data: profileData 
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, email, phone, bio, department, title, location } = body;

    // Check if profile exists using admin client
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('app_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    // Log for debugging

    let result;

    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabaseAdmin
        .from('app_users')
        .update({
          name: name || '',
          email: email || user.email,
          phone: phone || '',
          department: department || '',
          title: title || '',
          bio: bio || '',
          location: location || '',
          updated_at: new Date().toISOString(),
        })
        .eq('auth_user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        console.error('Update payload:', {
          name, email, phone, department, title, bio, location
        });
        return NextResponse.json(
          { error: `Failed to update profile: ${error.message}` },
          { status: 500 }
        );
      }
      result = data;
    } else {
      // Create new profile
      const insertData = {
        auth_user_id: user.id,
        name: name || user.user_metadata?.full_name || '',
        email: email || user.email,
        phone: phone || '',
        department: department || '',
        title: title || '',
        bio: bio || '',
        location: location || '',
        role: 'viewer', // Default role
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };


      const { data, error } = await supabaseAdmin
        .from('app_users')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        console.error('Insert payload:', insertData);
        return NextResponse.json(
          { error: `Failed to create profile: ${error.message}` },
          { status: 500 }
        );
      }
      result = data;
    }

    // Also update auth user metadata
    const { error: updateAuthError } = await supabase.auth.updateUser({
      data: {
        full_name: name,
        phone: phone,
      }
    });

    if (updateAuthError) {
      console.error('Error updating auth metadata:', updateAuthError);
    }

    return NextResponse.json({ 
      success: true,
      data: result,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Handle profile photo upload
    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size and type
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed' },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath);

    // Update user profile with new avatar URL using admin client
    const { error: updateError } = await supabaseAdmin
      .from('app_users')
      .update({ 
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('auth_user_id', user.id);

    if (updateError) {
      console.error('Error updating avatar URL:', updateError);
      // Try to delete the uploaded file
      await supabase.storage.from('profile-images').remove([filePath]);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Update auth user metadata
    await supabase.auth.updateUser({
      data: { avatar_url: publicUrl }
    });

    return NextResponse.json({ 
      success: true,
      data: { avatar_url: publicUrl },
      message: 'Profile photo updated successfully'
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}