# Account Owner & Organization Creation Validation

## Core Principle
**One Account Owner Per Organization** - This is the foundational rule that ensures clear ownership and prevents conflicts.

## Organization Creation Flow

### Step 1: User Authentication
```typescript
// User must be authenticated first
const { data: { user }, error } = await supabase.auth.getUser();

if (!user) {
  throw new Error("Must be logged in to create organization");
}
```

### Step 2: Create Organization
```typescript
// When creating organization, user automatically becomes account_owner
const createOrganization = async (orgData) => {
  // Start transaction
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: orgData.name,
      slug: orgData.slug,
      legal_name: orgData.legal_name,
      account_owner_id: user.id, // Set owner immediately
      created_by: user.id
    })
    .select()
    .single();

  if (orgError) {
    // Handle unique constraint violations
    if (orgError.code === '23505') {
      throw new Error("Organization slug already exists");
    }
    throw orgError;
  }

  // Automatically assign account_owner role
  const { error: roleError } = await supabase
    .from('user_organization_roles')
    .insert({
      user_id: user.id,
      organization_id: org.id,
      role: 'account_owner',
      assigned_by: user.id,
      assigned_at: new Date()
    });

  if (roleError) {
    // Rollback organization creation if role assignment fails
    await supabase.from('organizations').delete().eq('id', org.id);
    throw new Error("Failed to assign owner role");
  }

  return org;
};
```

## Validation Rules

### 1. Organization Creation Validations

```typescript
interface OrganizationValidation {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-\.]+$/,
    message: "Organization name must be 2-100 characters"
  },
  
  slug: {
    required: true,
    unique: true, // Database constraint
    pattern: /^[a-z0-9-]+$/,
    minLength: 3,
    maxLength: 50,
    message: "Slug must be lowercase letters, numbers, and hyphens"
  },
  
  legal_name: {
    required: false,
    maxLength: 200,
    message: "Legal name must be under 200 characters"
  },
  
  industry_primary: {
    required: true,
    enum: ['Manufacturing', 'Retail', 'Healthcare', 'Technology', ...],
    message: "Must select a primary industry"
  },
  
  headquarters_address: {
    required: true,
    validate: (address) => {
      return address.country && address.city;
    },
    message: "Must provide at least country and city"
  }
}
```

### 2. Account Owner Specific Rules

```typescript
const accountOwnerRules = {
  // Only ONE account_owner per organization
  uniqueOwner: async (orgId: string) => {
    const { count } = await supabase
      .from('user_organization_roles')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('role', 'account_owner');
    
    if (count > 0) {
      throw new Error("Organization already has an account owner");
    }
  },
  
  // Account owner cannot leave organization
  cannotLeave: (role: string) => {
    if (role === 'account_owner') {
      throw new Error("Account owner must transfer ownership before leaving");
    }
  },
  
  // Account owner cannot be demoted
  cannotDemote: (currentRole: string, newRole: string) => {
    if (currentRole === 'account_owner' && newRole !== 'account_owner') {
      throw new Error("Cannot demote account owner. Transfer ownership instead.");
    }
  }
};
```

### 3. Ownership Transfer Validation

```typescript
const transferOwnership = async (
  orgId: string, 
  currentOwnerId: string, 
  newOwnerId: string
) => {
  // Validate current user is the owner
  const { data: currentRole } = await supabase
    .from('user_organization_roles')
    .select('role')
    .eq('user_id', currentOwnerId)
    .eq('organization_id', orgId)
    .single();
  
  if (currentRole?.role !== 'account_owner') {
    throw new Error("Only current owner can transfer ownership");
  }
  
  // Validate new owner is in the organization
  const { data: newUserRole } = await supabase
    .from('user_organization_roles')
    .select('role')
    .eq('user_id', newOwnerId)
    .eq('organization_id', orgId)
    .single();
  
  if (!newUserRole) {
    throw new Error("New owner must be a member of the organization");
  }
  
  // Begin transaction
  // 1. Remove old owner role
  await supabase
    .from('user_organization_roles')
    .delete()
    .eq('user_id', currentOwnerId)
    .eq('organization_id', orgId)
    .eq('role', 'account_owner');
  
  // 2. Remove new owner's current role
  await supabase
    .from('user_organization_roles')
    .delete()
    .eq('user_id', newOwnerId)
    .eq('organization_id', orgId);
  
  // 3. Assign new owner role
  await supabase
    .from('user_organization_roles')
    .insert({
      user_id: newOwnerId,
      organization_id: orgId,
      role: 'account_owner'
    });
  
  // 4. Update organization table
  await supabase
    .from('organizations')
    .update({ account_owner_id: newOwnerId })
    .eq('id', orgId);
  
  // 5. Assign previous owner as organization_manager
  await supabase
    .from('user_organization_roles')
    .insert({
      user_id: currentOwnerId,
      organization_id: orgId,
      role: 'organization_manager'
    });
  
  // 6. Log the transfer
  await logOwnershipTransfer(orgId, currentOwnerId, newOwnerId);
};
```

## Database Constraints

### SQL Level Validations

```sql
-- Ensure only one account_owner per organization
CREATE UNIQUE INDEX idx_one_owner_per_org 
ON user_organization_roles(organization_id) 
WHERE role = 'account_owner';

-- Ensure organization slug is unique
ALTER TABLE organizations 
ADD CONSTRAINT unique_org_slug UNIQUE (slug);

-- Ensure account_owner_id references valid user
ALTER TABLE organizations
ADD CONSTRAINT fk_account_owner
FOREIGN KEY (account_owner_id) 
REFERENCES auth.users(id);

-- Prevent deletion of organization with members
CREATE OR REPLACE FUNCTION prevent_org_deletion_with_members()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM user_organization_roles 
    WHERE organization_id = OLD.id
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Cannot delete organization with active members';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_org_deletion
BEFORE DELETE ON organizations
FOR EACH ROW EXECUTE FUNCTION prevent_org_deletion_with_members();
```

## RLS Policies for Account Owner

```sql
-- Only account_owner can delete organization
CREATE POLICY "only_owner_deletes_org" ON organizations
FOR DELETE USING (
  account_owner_id = auth.uid() OR
  is_current_user_super_admin()
);

-- Only account_owner can manage billing
CREATE POLICY "only_owner_manages_billing" ON billing_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM organizations 
    WHERE id = billing_settings.organization_id 
    AND account_owner_id = auth.uid()
  ) OR
  is_current_user_super_admin()
);

-- Only account_owner can transfer ownership
CREATE POLICY "only_owner_transfers" ON ownership_transfers
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM organizations 
    WHERE id = organization_id 
    AND account_owner_id = auth.uid()
  )
);
```

## Frontend Validation

```typescript
// React component validation
const OrganizationForm = () => {
  const [errors, setErrors] = useState({});
  
  const validateForm = (data) => {
    const newErrors = {};
    
    // Name validation
    if (!data.name || data.name.length < 2) {
      newErrors.name = "Organization name is required (min 2 characters)";
    }
    
    // Slug validation
    if (!data.slug) {
      newErrors.slug = "URL slug is required";
    } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
      newErrors.slug = "Slug must be lowercase letters, numbers, and hyphens";
    }
    
    // Industry validation
    if (!data.industry_primary) {
      newErrors.industry = "Please select your primary industry";
    }
    
    // Address validation
    if (!data.headquarters_address?.country) {
      newErrors.country = "Country is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (formData) => {
    if (!validateForm(formData)) {
      return;
    }
    
    try {
      // Check slug availability
      const { data: existing } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', formData.slug)
        .single();
      
      if (existing) {
        setErrors({ slug: "This URL is already taken" });
        return;
      }
      
      // Create organization
      await createOrganization(formData);
    } catch (error) {
      setErrors({ submit: error.message });
    }
  };
};
```

## Special Cases & Edge Cases

### 1. First Organization (No Invitation)
```typescript
// User signs up and creates first org
if (userOrganizations.length === 0) {
  // Automatically proceed to org creation
  // User becomes account_owner
}
```

### 2. Invited to Organization
```typescript
// User joins existing org via invitation
if (invitation.role === 'account_owner') {
  // Special handling: must transfer from existing owner
  await initiateOwnershipTransfer(invitation);
} else {
  // Normal role assignment
  await assignRole(invitation);
}
```

### 3. Organization Deletion
```typescript
const deleteOrganization = async (orgId: string) => {
  // Only account_owner can delete
  const canDelete = await checkIfAccountOwner(userId, orgId);
  
  if (!canDelete) {
    throw new Error("Only account owner can delete organization");
  }
  
  // Cascade delete all related data
  // This is handled by ON DELETE CASCADE in database
  await supabase
    .from('organizations')
    .delete()
    .eq('id', orgId);
};
```

### 4. Orphaned Organization (Owner Deleted)
```sql
-- Prevent account owner deletion if they own organizations
CREATE OR REPLACE FUNCTION prevent_owner_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM organizations 
    WHERE account_owner_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Must transfer organization ownership before account deletion';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;
```

## Error Messages

```typescript
const ERROR_MESSAGES = {
  ORG_EXISTS: "An organization with this name already exists",
  SLUG_TAKEN: "This URL is already in use. Please choose another",
  NOT_AUTHENTICATED: "You must be logged in to create an organization",
  NOT_OWNER: "Only the account owner can perform this action",
  CANNOT_DELETE_WITH_MEMBERS: "Remove all members before deleting organization",
  CANNOT_LEAVE_AS_OWNER: "Transfer ownership before leaving the organization",
  INVALID_SLUG: "URL can only contain lowercase letters, numbers, and hyphens",
  TRANSFER_FAILED: "Failed to transfer ownership. Please try again",
  USER_NOT_IN_ORG: "User must be a member of the organization",
  ALREADY_HAS_OWNER: "Organization already has an account owner"
};
```

## Summary

The validation ensures:
1. ✅ **One owner per org** - Database constraint prevents multiple
2. ✅ **Owner automatically assigned** - Creator becomes owner
3. ✅ **Owner cannot leave** - Must transfer first
4. ✅ **Owner cannot be demoted** - Transfer required
5. ✅ **Unique organization slugs** - For URL routing
6. ✅ **Required fields validated** - Both frontend and backend
7. ✅ **Cascade deletion** - All related data removed
8. ✅ **Audit trail** - All ownership changes logged

This creates a robust system where organization ownership is always clear and properly managed!