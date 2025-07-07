import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL");
  console.error("   SUPABASE_SERVICE_KEY");
  console.error("\nPlease ensure these are set in your .env.local file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createDemoUser() {
  console.log("🚀 Creating demo user account...\n");

  try {
    // 1. Create demo user with confirmed email
    console.log("📧 Creating user: demo@blipee.com");
    
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: "demo@blipee.com",
        password: "demo123456",
        email_confirm: true, // This confirms the email immediately
        user_metadata: {
          full_name: "Demo User",
          phone: "+1 (555) 123-4567",
          preferred_language: "en",
          timezone: "America/New_York",
        },
      });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        console.log("⚠️  User already exists. Attempting to update...");
        
        // Get existing user
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users?.users.find(u => u.email === "demo@blipee.com");
        
        if (existingUser) {
          // Update user password
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: "demo123456" }
          );
          
          if (updateError) {
            console.error("❌ Error updating user password:", updateError);
            return;
          }
          
          console.log("✅ Updated existing user password");
          
          // Use existing user ID for organization creation
          await createOrganization(existingUser.id);
          return;
        }
      } else {
        console.error("❌ Error creating demo user:", authError);
        return;
      }
    }

    const demoUserId = authData!.user.id;
    console.log("✅ Created demo user with ID:", demoUserId);

    // 2. Ensure user profile is created (trigger should handle this, but let's be sure)
    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", demoUserId)
      .single();

    if (profileError && profileError.code === "PGRST116") {
      // Profile doesn't exist, create it manually
      console.log("📝 Creating user profile manually...");
      
      const { error: createProfileError } = await supabase
        .from("user_profiles")
        .insert({
          id: demoUserId,
          email: "demo@blipee.com",
          full_name: "Demo User",
          phone: "+1 (555) 123-4567",
          preferences: {
            theme: "dark",
            notifications: true,
          },
          ai_personality_settings: {
            tone: "professional",
            verbosity: "balanced",
          },
          onboarding_completed: false,
          preferred_language: "en",
          timezone: "America/New_York",
        });

      if (createProfileError) {
        console.error("❌ Error creating user profile:", createProfileError);
        return;
      }
      
      console.log("✅ Created user profile");
    } else {
      console.log("✅ User profile already exists");
    }

    // 3. Create organization
    await createOrganization(demoUserId);

  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

async function createOrganization(userId: string) {
  console.log("\n🏢 Creating Demo Organization...");

  try {
    // Check if organization already exists
    const { data: existingOrgs } = await supabase
      .from("organization_members")
      .select("organization_id, organizations(name, slug)")
      .eq("user_id", userId)
      .eq("role", "subscription_owner");

    if (existingOrgs && existingOrgs.length > 0) {
      console.log("✅ User already has an organization:", existingOrgs[0].organizations);
      return;
    }

    // Create new organization
    const { data: orgData, error: orgError } = await supabase.rpc(
      "create_organization_with_owner",
      {
        org_name: "Demo Organization",
        org_slug: "demo-organization",
        owner_id: userId,
        org_data: {
          subscription_tier: "professional",
          industry: "technology",
          company_size: "medium",
        },
      },
    );

    if (orgError) {
      console.error("❌ Error creating organization:", orgError);
      
      // If the RPC doesn't exist, create manually
      if (orgError.code === "42883") {
        console.log("📝 Creating organization manually...");
        
        // Create organization
        const { data: newOrg, error: createOrgError } = await supabase
          .from("organizations")
          .insert({
            name: "Demo Organization",
            slug: "demo-organization",
            subscription_tier: "professional",
            subscription_status: "active",
            metadata: {
              industry: "technology",
              company_size: "medium",
              created_by: userId,
            },
          })
          .select()
          .single();

        if (createOrgError) {
          console.error("❌ Error creating organization:", createOrgError);
          return;
        }

        // Add user as owner
        const { error: memberError } = await supabase
          .from("organization_members")
          .insert({
            organization_id: newOrg.id,
            user_id: userId,
            role: "subscription_owner",
            is_owner: true,
            invitation_status: "accepted",
            joined_at: new Date().toISOString(),
          });

        if (memberError) {
          console.error("❌ Error adding user to organization:", memberError);
          return;
        }

        console.log("✅ Created organization:", newOrg.id);
        
        // Create a demo building
        await createDemoBuilding(newOrg.id);
      }
      return;
    }

    console.log("✅ Created organization:", orgData);
    
    // Create a demo building
    await createDemoBuilding(orgData);

  } catch (error) {
    console.error("❌ Error in organization creation:", error);
  }
}

async function createDemoBuilding(organizationId: string) {
  console.log("\n🏗️  Creating demo building...");

  try {
    const { data: building, error: buildingError } = await supabase
      .from("buildings")
      .insert({
        organization_id: organizationId,
        name: "Demo Building",
        slug: "demo-building",
        address_line1: "123 Demo Street",
        city: "San Francisco",
        state_province: "CA",
        postal_code: "94105",
        country: "US",
        timezone: "America/Los_Angeles",
        metadata: {
          size_sqft: 50000,
          floors: 5,
          year_built: 2015,
          building_type: "office",
        },
        systems_config: {
          hvac_type: "vav",
          lighting_type: "led",
          has_solar: true,
          has_battery: false,
        },
      })
      .select()
      .single();

    if (buildingError) {
      console.error("❌ Error creating building:", buildingError);
      return;
    }

    console.log("✅ Created demo building:", building.name);

  } catch (error) {
    console.error("❌ Error creating building:", error);
  }
}

// Run the script
console.log("=".repeat(50));
console.log("Blipee OS - Demo User Creation Script");
console.log("=".repeat(50));

createDemoUser()
  .then(() => {
    console.log("\n" + "=".repeat(50));
    console.log("✅ Demo user setup complete!");
    console.log("\nYou can now sign in with:");
    console.log("  Email: demo@blipee.com");
    console.log("  Password: demo123456");
    console.log("=".repeat(50));
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });