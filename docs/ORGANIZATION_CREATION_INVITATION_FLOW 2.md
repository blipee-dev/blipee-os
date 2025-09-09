# Organization Creation Invitation Flow

## Overview
When a super admin sends an organization creation invitation, the recipient will become the account owner of a NEW organization. The flow involves two forms: user signup and organization setup.

## Complete Flow

### Step 1: Super Admin Sends Invitation
```typescript
// Super admin creates invitation
const invitation = {
  email: "ceo@newcompany.com",
  organization_name: "New Company Inc", // Optional suggestion
  custom_message: "Welcome! Please create your organization account.",
  expires_in_days: 7
};

// Email sent with link: /signup?org_creation_token=abc123
```

### Step 2: User Receives Email
```html
<!-- Email Template -->
<h2>You're invited to create your organization on blipee OS</h2>

<p>Hello,</p>

<p>You've been invited by the blipee OS administrator to create a new organization. You'll become the account owner with full control over your organization's sustainability data.</p>

<p><strong>Suggested Organization Name:</strong> New Company Inc</p>

<p><strong>Message from administrator:</strong><br>
Welcome! Please create your organization account.</p>

<p>To get started, you'll need to:</p>
<ol>
  <li>Create your user account</li>
  <li>Set up your organization details</li>
</ol>

<div style="margin: 20px 0;">
  <a href="https://app.blipee.com/signup?org_creation_token=abc123" 
     style="background: #1A73E8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
    Create Your Account & Organization
  </a>
</div>

<p><strong>This invitation expires on:</strong> January 16, 2025</p>

<small>If you already have a blipee OS account, <a href="https://app.blipee.com/auth/signin?org_creation_token=abc123">sign in here</a> to create your organization.</small>
```

### Step 3: User Clicks Link → Two-Step Process

#### **Form 1: User Account Creation**
```typescript
// /signup?org_creation_token=abc123
const UserSignupForm = () => {
  const { org_creation_token } = useSearchParams();
  
  return (
    <div className="max-w-md mx-auto">
      <h1>Create Your Account</h1>
      <p>Step 1 of 2: Personal Information</p>
      
      <form onSubmit={handleUserSignup}>
        {/* User Personal Info */}
        <input 
          name="firstName" 
          placeholder="First Name" 
          required 
        />
        <input 
          name="lastName" 
          placeholder="Last Name" 
          required 
        />
        <input 
          name="email" 
          placeholder="Email Address" 
          required 
          defaultValue={invitation?.email} // Pre-filled from invitation
          disabled 
        />
        <input 
          name="password" 
          type="password" 
          placeholder="Create Password" 
          required 
        />
        <input 
          name="phone" 
          placeholder="Phone Number" 
          required 
        />
        <select name="jobTitle" required>
          <option>CEO</option>
          <option>Sustainability Manager</option>
          <option>Operations Manager</option>
          <option>Other</option>
        </select>
        
        <button type="submit">
          Create Account & Continue
        </button>
      </form>
      
      <p className="text-sm text-gray-600 mt-4">
        Next: You'll set up your organization details
      </p>
    </div>
  );
};

const handleUserSignup = async (formData) => {
  // Create Supabase auth user
  const { user } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        job_title: formData.jobTitle,
        invitation_type: 'org_creation',
        invitation_token: org_creation_token
      }
    }
  });
  
  // Redirect to organization setup
  router.push(`/onboarding/organization?token=${org_creation_token}`);
};
```

#### **Form 2: Organization Setup**
```typescript
// /onboarding/organization?token=abc123
const OrganizationSetupForm = () => {
  const { token } = useSearchParams();
  const [invitation, setInvitation] = useState(null);
  
  useEffect(() => {
    // Validate invitation and get details
    validateInvitation(token).then(setInvitation);
  }, [token]);
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1>Set Up Your Organization</h1>
      <p>Step 2 of 2: Organization Details</p>
      
      <form onSubmit={handleOrganizationCreation}>
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            name="name" 
            placeholder="Organization Name" 
            required 
            defaultValue={invitation?.organization_name} // Pre-filled suggestion
          />
          <input 
            name="legal_name" 
            placeholder="Legal Name (if different)" 
          />
          <input 
            name="slug" 
            placeholder="URL Slug (e.g., new-company)" 
            required 
            // Auto-generate from name
          />
          <select name="industry_primary" required>
            <option value="">Select Primary Industry</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Technology">Technology</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Retail">Retail</option>
            <option value="Financial Services">Financial Services</option>
            {/* ... more industries */}
          </select>
        </div>
        
        {/* Company Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select name="company_size" required>
            <option value="">Company Size</option>
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201-1000">201-1000 employees</option>
            <option value="1000+">1000+ employees</option>
          </select>
          <input 
            name="website" 
            placeholder="Website URL" 
            type="url" 
          />
        </div>
        
        {/* Headquarters Address */}
        <fieldset className="border rounded-lg p-4">
          <legend>Headquarters Address</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              name="address_street" 
              placeholder="Street Address" 
              required 
            />
            <input 
              name="address_city" 
              placeholder="City" 
              required 
            />
            <input 
              name="address_postal_code" 
              placeholder="Postal Code" 
            />
            <select name="address_country" required>
              <option value="">Select Country</option>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              <option value="DE">Germany</option>
              {/* ... more countries */}
            </select>
          </div>
        </fieldset>
        
        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            name="primary_contact_email" 
            placeholder="Primary Contact Email" 
            type="email" 
            defaultValue={currentUser?.email} // Current user's email
          />
          <input 
            name="primary_contact_phone" 
            placeholder="Primary Contact Phone" 
          />
        </div>
        
        {/* Sustainability Goals */}
        <fieldset className="border rounded-lg p-4">
          <legend>Sustainability Goals (Optional)</legend>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" name="compliance_frameworks" value="GRI" />
              <span className="ml-2">GRI Standards Reporting</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" name="compliance_frameworks" value="CDP" />
              <span className="ml-2">CDP Climate Disclosure</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" name="compliance_frameworks" value="TCFD" />
              <span className="ml-2">TCFD Recommendations</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" name="compliance_frameworks" value="SBTi" />
              <span className="ml-2">Science-Based Targets</span>
            </label>
          </div>
          
          <div className="mt-4">
            <label>Target Net Zero Year (Optional)</label>
            <select name="net_zero_target_year">
              <option value="">Select Year</option>
              <option value="2030">2030</option>
              <option value="2040">2040</option>
              <option value="2050">2050</option>
            </select>
          </div>
        </fieldset>
        
        {/* Terms & Conditions */}
        <label className="flex items-start space-x-2">
          <input type="checkbox" required className="mt-1" />
          <span className="text-sm">
            I agree to the <a href="/terms" target="_blank">Terms of Service</a> and 
            <a href="/privacy" target="_blank"> Privacy Policy</a>
          </span>
        </label>
        
        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg">
          Create Organization
        </button>
      </form>
    </div>
  );
};
```

### Step 4: Organization Creation Process
```typescript
const handleOrganizationCreation = async (formData) => {
  try {
    // Call API to create organization from invitation
    const response = await fetch('/api/organizations/create-from-invitation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: token,
        name: formData.name,
        legal_name: formData.legal_name,
        slug: formData.slug,
        industry_primary: formData.industry_primary,
        company_size: formData.company_size,
        website: formData.website,
        headquarters_address: {
          street: formData.address_street,
          city: formData.address_city,
          postal_code: formData.address_postal_code,
          country: formData.address_country
        },
        primary_contact_email: formData.primary_contact_email,
        primary_contact_phone: formData.primary_contact_phone,
        compliance_frameworks: Array.from(formData.compliance_frameworks || []),
        net_zero_target_year: formData.net_zero_target_year
      })
    });
    
    if (response.ok) {
      // Success! User is now account_owner
      router.push('/onboarding/welcome');
    }
  } catch (error) {
    setError(error.message);
  }
};
```

### Step 5: Welcome & Next Steps
```typescript
// /onboarding/welcome
const WelcomePage = () => {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="mb-8">
        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">
          Welcome to blipee OS!
        </h1>
        <p className="text-gray-600">
          Your organization has been successfully created. You're now the account owner.
        </p>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h2 className="font-semibold mb-3">What's Next?</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>✅ Organization created</span>
            <span className="text-green-600">Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span>📍 Add your first site</span>
            <span className="text-blue-600">Next</span>
          </div>
          <div className="flex items-center justify-between">
            <span>👥 Invite team members</span>
            <span className="text-gray-400">Later</span>
          </div>
          <div className="flex items-center justify-between">
            <span>🔌 Connect devices</span>
            <span className="text-gray-400">Later</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <button 
          onClick={() => router.push('/onboarding/site')}
          className="w-full bg-blue-600 text-white py-3 rounded-lg"
        >
          Add Your First Site
        </button>
        <button 
          onClick={() => router.push('/dashboard')}
          className="w-full border border-gray-300 py-3 rounded-lg"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};
```

## API Implementation

### Validate Invitation
```typescript
// GET /api/invitations/validate?token=abc123
export async function validateOrganizationInvitation(token: string) {
  const { data, error } = await supabase
    .rpc('validate_organization_invitation', { p_token: token });
    
  if (error || !data[0]?.valid) {
    throw new Error(data[0]?.error_message || 'Invalid invitation');
  }
  
  return {
    valid: true,
    email: data[0].email,
    organization_name: data[0].organization_name,
    expires_at: data[0].expires_at
  };
}
```

### Create Organization from Invitation
```typescript
// POST /api/organizations/create-from-invitation
export async function createOrganizationFromInvitation(
  token: string,
  orgData: OrganizationData
) {
  // Validate invitation
  const invitation = await validateOrganizationInvitation(token);
  
  // Verify current user email matches invitation
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email !== invitation.email) {
    throw new Error('Email mismatch');
  }
  
  // Create organization
  const { data: org } = await supabase
    .from('organizations')
    .insert({
      ...orgData,
      account_owner_id: user.id,
      creation_method: 'invitation'
    })
    .select()
    .single();
  
  // Assign account_owner role
  await supabase
    .from('user_organization_roles')
    .insert({
      user_id: user.id,
      organization_id: org.id,
      role: 'account_owner'
    });
  
  // Consume invitation
  await supabase.rpc('consume_organization_invitation', {
    p_token: token,
    p_user_id: user.id,
    p_organization_id: org.id
  });
  
  return org;
}
```

## Security Validations

### Email Verification
- Invitation email must match user signup email
- Cannot use invitation with different email address
- Email is pre-filled and disabled in signup form

### Token Security
- Single-use tokens (marked as used after org creation)
- 7-day expiration by default
- Secure UUID tokens (not guessable)
- Database validation at every step

### User Authentication
- Must complete user signup first
- Email verification required
- Strong password requirements
- User profile completion before org setup

## Summary

**Yes, exactly!** The flow is:

1. **Super admin** → Sends invitation with suggested org name
2. **User** → Fills out personal information (signup form)
3. **User** → Fills out organization information (setup form)  
4. **System** → Creates organization + makes user account_owner

The user controls their personal details AND the organization details, but their role (account_owner) is predetermined by the invitation type!