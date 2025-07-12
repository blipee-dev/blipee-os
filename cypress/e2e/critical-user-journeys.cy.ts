/**
 * Critical User Journey E2E Tests
 * Tests the most important user flows in the application
 */

describe('Critical User Journeys', () => {
  beforeEach(() => {
    // Reset database state before each test
    cy.task('clearDatabase');
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('User Onboarding Journey', () => {
    it('should complete full onboarding flow', () => {
      // 1. Visit landing page
      cy.visit('/');
      
      // Verify landing page loads
      cy.contains('Transform Sustainability with AI').should('be.visible');
      
      // 2. Click sign up
      cy.get('[data-cy=signup-button]').click();
      
      // 3. Fill registration form
      cy.get('[data-cy=email-input]').type('newuser@example.com');
      cy.get('[data-cy=password-input]').type('SecurePassword123!');
      cy.get('[data-cy=confirm-password-input]').type('SecurePassword123!');
      cy.get('[data-cy=terms-checkbox]').check();
      
      // 4. Submit registration
      cy.get('[data-cy=submit-signup]').click();
      
      // 5. Verify email step
      cy.contains('Please verify your email').should('be.visible');
      
      // Simulate email verification (in real test, would check email)
      cy.visit('/auth/verify?token=test-verification-token');
      
      // 6. Organization setup
      cy.contains('Set up your organization').should('be.visible');
      cy.get('[data-cy=org-name-input]').type('Test Corporation');
      cy.get('[data-cy=industry-select]').select('Manufacturing');
      cy.get('[data-cy=size-select]').select('1000-5000');
      cy.get('[data-cy=continue-button]').click();
      
      // 7. Initial data import
      cy.contains('Import your data').should('be.visible');
      
      // Upload a test file
      cy.fixture('sample-emissions-report.pdf').then(fileContent => {
        cy.get('[data-cy=file-upload]').attachFile({
          fileContent: fileContent.toString(),
          fileName: 'sample-emissions-report.pdf',
          mimeType: 'application/pdf'
        });
      });
      
      // Wait for processing
      cy.contains('Processing document...', { timeout: 30000 }).should('be.visible');
      cy.contains('Document processed successfully').should('be.visible');
      
      // 8. Complete onboarding
      cy.get('[data-cy=complete-onboarding]').click();
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.contains('Welcome to blipee OS').should('be.visible');
      
      // Verify onboarding completion
      cy.get('[data-cy=onboarding-progress]').should('contain', '100%');
    });
  });

  describe('AI Conversation Journey', () => {
    beforeEach(() => {
      // Login as existing user
      cy.login('test@example.com', 'TestPassword123!');
    });

    it('should have meaningful AI conversation with document analysis', () => {
      // 1. Navigate to AI chat
      cy.visit('/chat');
      
      // 2. Send initial message
      cy.get('[data-cy=chat-input]').type('What is our current carbon footprint?');
      cy.get('[data-cy=send-button]').click();
      
      // 3. Wait for AI response
      cy.get('[data-cy=ai-message]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-cy=ai-message]').should('contain', 'carbon');
      
      // 4. Verify dynamic UI component (chart) is rendered
      cy.get('[data-cy=dynamic-chart]').should('be.visible');
      
      // 5. Upload document for analysis
      cy.get('[data-cy=attach-file-button]').click();
      cy.fixture('utility-bill.pdf').then(fileContent => {
        cy.get('[data-cy=file-input]').attachFile({
          fileContent: fileContent.toString(),
          fileName: 'utility-bill.pdf',
          mimeType: 'application/pdf'
        });
      });
      
      // 6. Ask about the document
      cy.get('[data-cy=chat-input]').type('Analyze the utility bill I just uploaded');
      cy.get('[data-cy=send-button]').click();
      
      // 7. Verify document analysis
      cy.get('[data-cy=ai-message]').last().should('contain', 'utility bill');
      cy.get('[data-cy=extracted-data]').should('be.visible');
      cy.get('[data-cy=extracted-data]').should('contain', 'kWh');
      
      // 8. Test follow-up question
      cy.get('[data-cy=chat-input]').type('How can we reduce these costs?');
      cy.get('[data-cy=send-button]').click();
      
      // 9. Verify actionable recommendations
      cy.get('[data-cy=ai-message]').last().should('contain', 'recommend');
      cy.get('[data-cy=action-items]').should('be.visible');
      
      // 10. Save conversation
      cy.get('[data-cy=save-conversation]').click();
      cy.contains('Conversation saved').should('be.visible');
    });

    it('should handle AI provider failover gracefully', () => {
      // Simulate primary provider failure
      cy.intercept('POST', '/api/ai/chat', (req) => {
        if (req.body.provider === 'deepseek') {
          req.reply({
            statusCode: 503,
            body: { error: 'Service unavailable' }
          });
        } else {
          req.continue();
        }
      });

      cy.visit('/chat');
      cy.get('[data-cy=chat-input]').type('Test failover handling');
      cy.get('[data-cy=send-button]').click();

      // Should still get response (from fallback provider)
      cy.get('[data-cy=ai-message]', { timeout: 15000 }).should('be.visible');
      
      // Verify failover notification
      cy.get('[data-cy=provider-indicator]').should('contain', 'OpenAI');
    });
  });

  describe('Multi-tenant Organization Management', () => {
    beforeEach(() => {
      cy.login('admin@example.com', 'AdminPassword123!');
    });

    it('should manage team members and permissions', () => {
      // 1. Navigate to team settings
      cy.visit('/settings/team');
      
      // 2. Invite new team member
      cy.get('[data-cy=invite-member-button]').click();
      cy.get('[data-cy=email-input]').type('newmember@example.com');
      cy.get('[data-cy=role-select]').select('analyst');
      cy.get('[data-cy=send-invite-button]').click();
      
      // 3. Verify invitation sent
      cy.contains('Invitation sent').should('be.visible');
      cy.get('[data-cy=pending-invites]').should('contain', 'newmember@example.com');
      
      // 4. Update existing member permissions
      cy.get('[data-cy=team-member-row]').first().within(() => {
        cy.get('[data-cy=edit-permissions]').click();
      });
      
      cy.get('[data-cy=permission-sustainability-manager]').check();
      cy.get('[data-cy=save-permissions]').click();
      
      // 5. Verify permission update
      cy.contains('Permissions updated').should('be.visible');
      
      // 6. Test role-based access
      cy.logout();
      cy.login('analyst@example.com', 'AnalystPassword123!');
      
      // Analyst should not see admin features
      cy.visit('/settings/team');
      cy.get('[data-cy=invite-member-button]').should('not.exist');
      
      // But should see analytics
      cy.visit('/analytics');
      cy.get('[data-cy=analytics-dashboard]').should('be.visible');
    });

    it('should enforce organization data isolation', () => {
      // Login as Org A admin
      cy.login('admin-org-a@example.com', 'Password123!');
      
      // Create some data
      cy.visit('/data/emissions');
      cy.get('[data-cy=add-emission]').click();
      cy.get('[data-cy=emission-value]').type('1000');
      cy.get('[data-cy=emission-source]').select('electricity');
      cy.get('[data-cy=save-emission]').click();
      
      // Logout and login as Org B admin
      cy.logout();
      cy.login('admin-org-b@example.com', 'Password123!');
      
      // Should not see Org A's data
      cy.visit('/data/emissions');
      cy.get('[data-cy=emissions-list]').should('not.contain', '1000');
      
      // Verify API level isolation
      cy.request({
        url: '/api/organizations/org-a-id/emissions',
        failOnStatusCode: false,
        headers: {
          Authorization: `Bearer ${cy.getCookie('session-token')}`,
        },
      }).then((response) => {
        expect(response.status).to.equal(403);
      });
    });
  });

  describe('Sustainability Reporting Journey', () => {
    beforeEach(() => {
      cy.login('sustainability@example.com', 'Password123!');
    });

    it('should generate comprehensive sustainability report', () => {
      // 1. Navigate to reports
      cy.visit('/reports');
      
      // 2. Create new report
      cy.get('[data-cy=create-report]').click();
      cy.get('[data-cy=report-type]').select('Annual Sustainability Report');
      cy.get('[data-cy=reporting-period]').select('2024');
      cy.get('[data-cy=continue]').click();
      
      // 3. Select data sources
      cy.get('[data-cy=include-emissions]').check();
      cy.get('[data-cy=include-energy]').check();
      cy.get('[data-cy=include-waste]').check();
      cy.get('[data-cy=include-water]').check();
      cy.get('[data-cy=continue]').click();
      
      // 4. AI-assisted insights
      cy.get('[data-cy=generate-insights]').click();
      cy.contains('Analyzing your data...', { timeout: 30000 }).should('be.visible');
      
      // 5. Review generated content
      cy.get('[data-cy=report-preview]').should('be.visible');
      cy.get('[data-cy=executive-summary]').should('contain', 'emissions');
      cy.get('[data-cy=key-metrics]').should('be.visible');
      cy.get('[data-cy=charts-section]').should('be.visible');
      
      // 6. Edit report content
      cy.get('[data-cy=edit-section]').first().click();
      cy.get('[data-cy=section-editor]').type(' Additional context for stakeholders.');
      cy.get('[data-cy=save-edit]').click();
      
      // 7. Export report
      cy.get('[data-cy=export-report]').click();
      cy.get('[data-cy=export-format]').select('PDF');
      cy.get('[data-cy=include-appendix]').check();
      cy.get('[data-cy=download-report]').click();
      
      // Verify download started
      cy.readFile('cypress/downloads/Sustainability_Report_2024.pdf').should('exist');
    });
  });

  describe('Critical Error Scenarios', () => {
    it('should handle payment processing errors gracefully', () => {
      cy.login('billing@example.com', 'Password123!');
      cy.visit('/billing/upgrade');
      
      // Intercept payment API to simulate failure
      cy.intercept('POST', '/api/payments/process', {
        statusCode: 402,
        body: { error: 'Payment failed', code: 'card_declined' }
      });
      
      // Fill payment form
      cy.get('[data-cy=card-number]').type('4242424242424242');
      cy.get('[data-cy=card-expiry]').type('12/25');
      cy.get('[data-cy=card-cvc]').type('123');
      cy.get('[data-cy=submit-payment]').click();
      
      // Should show user-friendly error
      cy.contains('Payment could not be processed').should('be.visible');
      cy.contains('Please try a different payment method').should('be.visible');
      
      // Should not show technical details
      cy.contains('statusCode').should('not.exist');
      cy.contains('stack trace').should('not.exist');
    });

    it('should maintain data integrity during concurrent edits', () => {
      // Open same document in two windows
      cy.login('user1@example.com', 'Password123!');
      cy.visit('/documents/doc-123/edit');
      
      // Simulate concurrent edit from another user
      cy.window().then((win) => {
        // Store original content
        cy.get('[data-cy=document-content]').invoke('text').as('originalContent');
        
        // Simulate WebSocket message for concurrent edit
        win.postMessage({
          type: 'document.update',
          documentId: 'doc-123',
          userId: 'user-2',
          changes: { content: 'Concurrent edit from user 2' }
        }, '*');
      });
      
      // Should show conflict resolution UI
      cy.contains('Document has been modified by another user').should('be.visible');
      cy.get('[data-cy=merge-changes]').should('be.visible');
      cy.get('[data-cy=overwrite-changes]').should('be.visible');
      
      // Choose merge
      cy.get('[data-cy=merge-changes]').click();
      
      // Verify both changes are preserved
      cy.get('[data-cy=document-content]').should('contain', 'Concurrent edit from user 2');
      cy.get('@originalContent').then((original) => {
        cy.get('[data-cy=document-content]').should('contain', original);
      });
    });
  });

  describe('Performance Under Load', () => {
    it('should remain responsive with large data sets', () => {
      cy.login('test@example.com', 'Password123!');
      
      // Navigate to data-heavy page
      cy.visit('/analytics/emissions?year=all');
      
      // Measure initial load time
      cy.window().then((win) => {
        win.performance.mark('page-start');
      });
      
      // Wait for data to load
      cy.get('[data-cy=emissions-chart]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-cy=data-table]').should('be.visible');
      
      cy.window().then((win) => {
        win.performance.mark('page-end');
        win.performance.measure('page-load', 'page-start', 'page-end');
        
        const measure = win.performance.getEntriesByName('page-load')[0];
        expect(measure.duration).to.be.lessThan(3000); // Page loads in under 3 seconds
      });
      
      // Test interactions remain responsive
      cy.get('[data-cy=filter-dropdown]').click();
      cy.get('[data-cy=filter-option]').should('be.visible').first().click();
      
      // Chart should update quickly
      cy.get('[data-cy=chart-loading]').should('not.exist');
      cy.get('[data-cy=emissions-chart]').should('be.visible');
    });
  });

  describe('Accessibility Compliance', () => {
    it('should be fully keyboard navigable', () => {
      cy.visit('/');
      
      // Tab through main navigation
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-cy', 'home-link');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-cy', 'features-link');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-cy', 'pricing-link');
      
      // Activate link with Enter
      cy.focused().type('{enter}');
      cy.url().should('include', '/pricing');
      
      // Navigate form with keyboard
      cy.get('[data-cy=contact-form]').first().focus();
      cy.focused().type('test@example.com');
      cy.focused().tab().type('Test message');
      cy.focused().tab().type('{enter}'); // Submit form
      
      cy.contains('Message sent').should('be.visible');
    });

    it('should work with screen readers', () => {
      cy.visit('/');
      
      // Check ARIA labels
      cy.get('[data-cy=main-navigation]').should('have.attr', 'aria-label', 'Main navigation');
      cy.get('[data-cy=chat-input]').should('have.attr', 'aria-label', 'Type your message');
      
      // Check heading hierarchy
      cy.get('h1').should('have.length', 1);
      cy.get('h2').each(($h2, index) => {
        if (index > 0) {
          cy.get('h1').should('exist');
        }
      });
      
      // Check focus indicators
      cy.get('button').first().focus();
      cy.focused().should('have.css', 'outline-style').and('not.eq', 'none');
    });
  });
});

// Helper commands
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/auth/signin');
    cy.get('[data-cy=email-input]').type(email);
    cy.get('[data-cy=password-input]').type(password);
    cy.get('[data-cy=submit-button]').click();
    cy.url().should('not.include', '/auth/signin');
  });
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-cy=user-menu]').click();
  cy.get('[data-cy=logout-button]').click();
  cy.url().should('include', '/auth/signin');
});

// Tab navigation helper
Cypress.Commands.add('tab', { prevSubject: 'optional' }, (subject) => {
  if (subject) {
    cy.wrap(subject).trigger('keydown', { keyCode: 9, which: 9 });
  } else {
    cy.get('body').trigger('keydown', { keyCode: 9, which: 9 });
  }
});