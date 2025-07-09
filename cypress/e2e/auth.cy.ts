describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Sign Up', () => {
    it('should allow new user registration', () => {
      cy.visit('/signup');
      
      // Fill in registration form
      cy.get('input[name="email"]').type('newuser@example.com');
      cy.get('input[name="password"]').type('SecurePassword123!');
      cy.get('input[name="confirmPassword"]').type('SecurePassword123!');
      cy.get('input[name="firstName"]').type('John');
      cy.get('input[name="lastName"]').type('Doe');
      cy.get('input[name="organizationName"]').type('Test Organization');
      
      // Submit form
      cy.get('button[type="submit"]').click();
      
      // Should redirect to onboarding
      cy.url().should('include', '/onboarding');
      cy.contains('Welcome to blipee OS').should('be.visible');
    });

    it('should validate password requirements', () => {
      cy.visit('/signup');
      
      // Try weak password
      cy.get('input[name="password"]').type('weak');
      cy.get('input[name="password"]').blur();
      
      cy.contains('Password must be at least 8 characters').should('be.visible');
    });

    it('should prevent duplicate email registration', () => {
      cy.visit('/signup');
      
      // Try existing email
      cy.get('input[name="email"]').type(Cypress.env('TEST_USER_EMAIL'));
      cy.get('input[name="password"]').type('SecurePassword123!');
      cy.get('input[name="confirmPassword"]').type('SecurePassword123!');
      cy.get('input[name="firstName"]').type('Test');
      cy.get('input[name="lastName"]').type('User');
      cy.get('input[name="organizationName"]').type('Test Org');
      
      cy.get('button[type="submit"]').click();
      
      cy.contains('Email already registered').should('be.visible');
    });
  });

  describe('Sign In', () => {
    it('should login with valid credentials', () => {
      cy.login();
      
      // Verify successful login
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-menu"]').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      cy.visit('/signin');
      
      cy.get('input[name="email"]').type('wrong@example.com');
      cy.get('input[name="password"]').type('WrongPassword');
      cy.get('button[type="submit"]').click();
      
      cy.contains('Invalid email or password').should('be.visible');
    });

    it('should handle forgot password flow', () => {
      cy.visit('/signin');
      
      cy.contains('Forgot password?').click();
      cy.url().should('include', '/forgot-password');
      
      cy.get('input[name="email"]').type('user@example.com');
      cy.get('button[type="submit"]').click();
      
      cy.contains('Password reset email sent').should('be.visible');
    });
  });

  describe('OAuth Login', () => {
    it('should show OAuth options', () => {
      cy.visit('/signin');
      
      cy.get('[data-testid="google-oauth"]').should('be.visible');
      cy.get('[data-testid="microsoft-oauth"]').should('be.visible');
      cy.get('[data-testid="github-oauth"]').should('be.visible');
    });
  });

  describe('MFA Flow', () => {
    it('should prompt for MFA when enabled', () => {
      // Login first
      cy.visit('/signin');
      cy.get('input[name="email"]').type('mfa-user@example.com');
      cy.get('input[name="password"]').type('SecurePassword123!');
      cy.get('button[type="submit"]').click();
      
      // Should show MFA prompt
      cy.url().should('include', '/auth/mfa');
      cy.contains('Enter verification code').should('be.visible');
      
      // Enter MFA code
      cy.get('input[name="code"]').type('123456');
      cy.get('button[type="submit"]').click();
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should maintain session across page reloads', () => {
      cy.reload();
      cy.get('[data-testid="user-menu"]').should('be.visible');
    });

    it('should logout successfully', () => {
      cy.logout();
      cy.url().should('include', '/signin');
    });

    it('should redirect to login on session expiry', () => {
      // Clear auth cookie to simulate expiry
      cy.clearCookie('supabase-auth-token');
      cy.visit('/dashboard');
      
      cy.url().should('include', '/signin');
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations on signin page', () => {
      cy.visit('/signin');
      cy.checkA11y();
    });

    it('should have no accessibility violations on signup page', () => {
      cy.visit('/signup');
      cy.checkA11y();
    });
  });
});