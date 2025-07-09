/// <reference types="cypress" />

// Custom commands for authentication
Cypress.Commands.add('login', (email?: string, password?: string) => {
  const userEmail = email || Cypress.env('TEST_USER_EMAIL');
  const userPassword = password || Cypress.env('TEST_USER_PASSWORD');

  cy.visit('/signin');
  cy.get('input[name="email"]').type(userEmail);
  cy.get('input[name="password"]').type(userPassword);
  cy.get('button[type="submit"]').click();
  
  // Wait for redirect to dashboard
  cy.url().should('include', '/dashboard');
  cy.get('[data-testid="user-menu"]').should('be.visible');
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/signin');
});

// Custom command for API requests with auth
Cypress.Commands.add('apiRequest', (method: string, url: string, body?: any) => {
  cy.getCookie('supabase-auth-token').then((cookie) => {
    cy.request({
      method,
      url: `${Cypress.env('API_URL')}${url}`,
      body,
      headers: {
        Authorization: `Bearer ${cookie?.value}`,
        'Content-Type': 'application/json',
      },
    });
  });
});

// Custom command for waiting for AI response
Cypress.Commands.add('waitForAIResponse', () => {
  cy.get('[data-testid="loading-indicator"]').should('be.visible');
  cy.get('[data-testid="loading-indicator"]').should('not.exist');
  cy.get('[data-testid="ai-response"]').should('be.visible');
});

// Type definitions for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>;
      logout(): Chainable<void>;
      apiRequest(method: string, url: string, body?: any): Chainable<Response<any>>;
      waitForAIResponse(): Chainable<void>;
    }
  }
}

export {};