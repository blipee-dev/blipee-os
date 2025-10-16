"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building, Loader2, Plus, Users } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";

interface Organization {
  id: string;
  name: string;
  slug: string;
  buildings?: { count: number };
  users?: { count: number };
}

export function OrganizationSetup() {
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [showExisting, setShowExisting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    size: "small",
    createSampleBuildings: true,
  });
  const { refreshSession } = useAuth();
  const router = useRouter();

  // Load existing organizations for super admin
  const loadOrganizations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/setup-organization");
      if (response.ok) {
        const data = await response.json();
        if (data.isSuperAdmin && data.organizations.length > 0) {
          setOrganizations(data.organizations);
          setShowExisting(true);
        }
      }
    } catch (error) {
      console.error("Error loading organizations:", error);
    }
    setIsLoading(false);
  };

  // Create new organization
  const createOrganization = async () => {
    if (!formData.name.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/auth/setup-organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();

        // Refresh session to get new organization data
        await refreshSession();

        // Redirect to main app
        router.push("/blipee-ai");
      } else {
        const error = await response.json();
        console.error("Failed to create organization:", error);
        alert(`Error: ${error.error || "Failed to create organization"}`);
      }
    } catch (error) {
      console.error("Error creating organization:", error);
      alert("Failed to create organization. Please try again.");
    }
    setIsCreating(false);
  };

  // Select existing organization (for super admin)
  const selectOrganization = async (orgId: string) => {
    setIsLoading(true);
    try {
      // Update session with selected organization
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          organizationId: orgId,
        }),
      });

      if (response.ok) {
        await refreshSession();
        router.push("/blipee-ai");
      }
    } catch (error) {
      console.error("Error selecting organization:", error);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
              <Building className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Organization Setup
            </h1>
            <p className="text-white/60">
              Let's set up your organization to get started with BLIPEE OS
            </p>
          </div>

          {/* Show existing organizations for super admin */}
          {showExisting && organizations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-4">
                Select Existing Organization
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => selectOrganization(org.id)}
                    disabled={isLoading}
                    className="w-full p-4 backdrop-blur-xl bg-white/[0.05] border border-white/[0.1] rounded-lg hover:bg-white/[0.08] transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{org.name}</p>
                        <p className="text-white/50 text-sm">
                          {org.buildings?.[0] || 0} buildings •
                          {org.users?.[0] || 0} users
                        </p>
                      </div>
                      <Building className="w-5 h-5 text-white/30" />
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowExisting(false)}
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  Or create a new organization
                </button>
              </div>
            </div>
          )}

          {/* Create new organization form */}
          {!showExisting && (
            <div className="space-y-6">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Acme Corporation"
                  className="w-full px-4 py-3 rounded-lg backdrop-blur-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Industry
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg backdrop-blur-xl bg-white/[0.05] border border-white/[0.1] text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select Industry</option>
                  <option value="technology">Technology</option>
                  <option value="retail">Retail</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="finance">Finance</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Organization Size
                </label>
                <select
                  value={formData.size}
                  onChange={(e) =>
                    setFormData({ ...formData, size: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg backdrop-blur-xl bg-white/[0.05] border border-white/[0.1] text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="small">Small (1-50 employees)</option>
                  <option value="medium">Medium (51-500 employees)</option>
                  <option value="large">Large (501-5000 employees)</option>
                  <option value="enterprise">Enterprise (5000+ employees)</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="sampleBuildings"
                  checked={formData.createSampleBuildings}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      createSampleBuildings: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-white/20 bg-white/[0.05] text-purple-500 focus:ring-purple-500"
                />
                <label
                  htmlFor="sampleBuildings"
                  className="text-white/80 text-sm"
                >
                  Create sample building (Headquarters)
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={createOrganization}
                  disabled={isCreating || !formData.name.trim()}
                  className="flex-1 py-3 px-6 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isCreating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Create Organization
                    </>
                  )}
                </button>

                {organizations.length > 0 && (
                  <button
                    onClick={() => {
                      setShowExisting(true);
                      loadOrganizations();
                    }}
                    className="px-6 py-3 rounded-lg backdrop-blur-xl bg-white/[0.05] border border-white/[0.1] text-white font-medium hover:bg-white/[0.08] transition-colors"
                  >
                    <Users className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Super Admin Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-center"
        >
          <p className="text-white/40 text-sm">
            As a super admin, you have access to all organizations
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}