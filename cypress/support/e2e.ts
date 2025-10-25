// ***********************************************************
// This file is processed and loaded automatically before your test files.
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Code coverage
import '@cypress/code-coverage/support';

// Accessibility testing
import 'cypress-axe';

// File upload support
import 'cypress-file-upload';

// Custom error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // for specific known errors
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  // Let other errors fail the test
  return true;
});

// Before each test
beforeEach(() => {
  // Inject axe-core for accessibility testing
  cy.injectAxe();
  
  // Set up interceptors for common API calls
  cy.intercept('GET', '/api/monitoring/health', { 
    statusCode: 200, 
    body: { status: 'healthy' } 
  }).as('healthCheck');
});

// After each test
afterEach(() => {
  // Clear local storage
  cy.clearLocalStorage();
  
  // Clear cookies
  cy.clearCookies();
});
