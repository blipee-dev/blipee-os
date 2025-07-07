import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createDemoData() {
  console.log("🚀 Creating demo data...");

  try {
    // 1. Create demo user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: "demo@blipee.com",
        password: "demo123456",
        email_confirm: true,
        user_metadata: {
          full_name: "Demo User",
        },
      });

    if (authError) {
      console.error("Error creating demo user:", authError);
      return;
    }

    const demoUserId = authData.user.id;
    console.log("✅ Created demo user:", demoUserId);

    // 2. Create demo organization
    const { data: orgData, error: orgError } = await supabase.rpc(
      "create_organization_with_owner",
      {
        org_name: "Acme Corporation",
        org_slug: "acme-corp",
        owner_id: demoUserId,
        org_data: {
          subscription_tier: "professional",
          industry: "technology",
          company_size: "large",
        },
      },
    );

    if (orgError) {
      console.error("Error creating organization:", orgError);
      return;
    }

    const orgId = orgData;
    console.log("✅ Created organization:", orgId);

    // 3. Create demo buildings
    const buildings = [
      {
        name: "Acme HQ",
        address: "123 Tech Street, San Francisco, CA 94105",
        city: "San Francisco",
        size_sqft: 150000,
        floors: 12,
        age_category: "modern",
        occupancy_types: [
          "offices",
          "meeting_rooms",
          "cafeteria",
          "data_center",
        ],
        status: "active",
        metadata: {
          systems_baseline: {
            lighting: ["led_installed", "sensors_installed"],
            hvac: ["smart_thermostats", "building_automation"],
            energy: ["sub_metering", "power_monitoring"],
          },
        },
      },
      {
        name: "Acme Research Lab",
        address: "456 Innovation Blvd, Palo Alto, CA 94301",
        city: "Palo Alto",
        size_sqft: 75000,
        floors: 4,
        age_category: "brand_new",
        occupancy_types: ["offices", "manufacturing", "warehouse"],
        status: "active",
      },
      {
        name: "Acme Distribution Center",
        address: "789 Logistics Way, Austin, TX 78701",
        city: "Austin",
        size_sqft: 200000,
        floors: 2,
        age_category: "aging",
        occupancy_types: ["warehouse", "offices"],
        status: "pending_setup",
      },
    ];

    for (const building of buildings) {
      const { data, error } = await supabase
        .from("buildings")
        .insert({
          organization_id: orgId,
          slug: building.name.toLowerCase().replace(/\s+/g, "-"),
          ...building,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating building:", error);
      } else {
        console.log("✅ Created building:", data.name);
      }
    }

    // 4. Create additional team members
    const teamMembers = [
      {
        email: "sarah@acme.com",
        full_name: "Sarah Johnson",
        role: "site_manager",
      },
      {
        email: "mike@acme.com",
        full_name: "Mike Chen",
        role: "facility_manager",
      },
      {
        email: "alex@acme.com",
        full_name: "Alex Rodriguez",
        role: "technician",
      },
    ];

    for (const member of teamMembers) {
      // Create user profile
      const { data: userData } = await supabase
        .from("user_profiles")
        .insert({
          email: member.email,
          full_name: member.full_name,
          onboarding_completed: true,
        })
        .select()
        .single();

      if (userData) {
        // Add to organization
        await supabase.from("organization_members").insert({
          organization_id: orgId,
          user_id: userData.id,
          role: member.role,
          invitation_status: "pending",
          invited_by: demoUserId,
          invited_at: new Date().toISOString(),
        });

        console.log("✅ Added team member:", member.email);
      }
    }

    // 5. Create sample work orders
    const { data: buildingData } = await supabase
      .from("buildings")
      .select("id")
      .eq("organization_id", orgId)
      .eq("name", "Acme HQ")
      .single();

    if (buildingData) {
      const workOrders = [
        {
          building_id: buildingData.id,
          created_by: demoUserId,
          title: "AC not cooling in conference room 3A",
          description: "Temperature reads 78°F despite thermostat set to 72°F",
          priority: "high",
          status: "open",
          category: "hvac",
          area: "Floor 3 - Conference Room 3A",
        },
        {
          building_id: buildingData.id,
          created_by: demoUserId,
          title: "Replace burnt out lights in parking garage",
          description: "Multiple lights out on Level B2",
          priority: "medium",
          status: "open",
          category: "lighting",
          area: "Parking Garage - Level B2",
        },
      ];

      for (const wo of workOrders) {
        await supabase.from("work_orders").insert(wo);
      }
      console.log("✅ Created sample work orders");
    }

    console.log("\n🎉 Demo data created successfully!");
    console.log("\nYou can now sign in with:");
    console.log("Email: demo@blipee.com");
    console.log("Password: demo123456");
  } catch (error) {
    console.error("❌ Error creating demo data:", error);
  }
}

// Run the script
createDemoData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
