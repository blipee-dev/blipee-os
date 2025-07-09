describe('Conversation Interface', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/dashboard');
  });

  describe('Basic Conversation', () => {
    it('should send and receive messages', () => {
      // Type a message
      cy.get('[data-testid="chat-input"]').type('What is our current energy usage?');
      cy.get('[data-testid="send-button"]').click();
      
      // Wait for AI response
      cy.waitForAIResponse();
      
      // Verify user message appears
      cy.contains('What is our current energy usage?').should('be.visible');
      
      // Verify AI response appears
      cy.get('[data-testid="ai-response"]').should('contain', 'energy');
    });

    it('should maintain conversation history', () => {
      // Send first message
      cy.get('[data-testid="chat-input"]').type('Hello');
      cy.get('[data-testid="send-button"]').click();
      cy.waitForAIResponse();
      
      // Send second message
      cy.get('[data-testid="chat-input"]').type('Show me temperature data');
      cy.get('[data-testid="send-button"]').click();
      cy.waitForAIResponse();
      
      // Both messages should be visible
      cy.contains('Hello').should('be.visible');
      cy.contains('Show me temperature data').should('be.visible');
    });

    it('should handle keyboard shortcuts', () => {
      cy.get('[data-testid="chat-input"]').type('Test message{enter}');
      cy.waitForAIResponse();
      
      cy.contains('Test message').should('be.visible');
    });
  });

  describe('File Upload', () => {
    it('should upload and analyze documents', () => {
      // Upload a file
      cy.fixture('sample-invoice.pdf').then(fileContent => {
        cy.get('input[type="file"]').attachFile({
          fileContent: fileContent.toString(),
          fileName: 'sample-invoice.pdf',
          mimeType: 'application/pdf'
        });
      });
      
      // File should appear in chat
      cy.contains('sample-invoice.pdf').should('be.visible');
      cy.contains('Analyzing document').should('be.visible');
      
      // Wait for analysis
      cy.waitForAIResponse();
      cy.contains('emissions').should('be.visible');
    });

    it('should handle multiple file uploads', () => {
      const files = ['invoice1.pdf', 'invoice2.pdf'];
      
      files.forEach(fileName => {
        cy.fixture(fileName).then(fileContent => {
          cy.get('input[type="file"]').attachFile({
            fileContent: fileContent.toString(),
            fileName,
            mimeType: 'application/pdf'
          });
        });
      });
      
      // Both files should be processed
      files.forEach(fileName => {
        cy.contains(fileName).should('be.visible');
      });
    });
  });

  describe('Voice Input', () => {
    it('should toggle voice recording', () => {
      // Click voice button
      cy.get('[data-testid="voice-button"]').click();
      
      // Recording indicator should appear
      cy.get('[data-testid="recording-indicator"]').should('be.visible');
      
      // Click again to stop
      cy.get('[data-testid="voice-button"]').click();
      cy.get('[data-testid="recording-indicator"]').should('not.exist');
    });
  });

  describe('Dynamic UI Components', () => {
    it('should render charts from AI response', () => {
      cy.get('[data-testid="chat-input"]').type('Show me energy usage trends');
      cy.get('[data-testid="send-button"]').click();
      
      cy.waitForAIResponse();
      
      // Chart should be rendered
      cy.get('[data-testid="chart-component"]').should('be.visible');
      cy.get('canvas').should('exist'); // Recharts renders to canvas
    });

    it('should render tables from AI response', () => {
      cy.get('[data-testid="chat-input"]').type('Show me emissions breakdown');
      cy.get('[data-testid="send-button"]').click();
      
      cy.waitForAIResponse();
      
      // Table should be rendered
      cy.get('[data-testid="table-component"]').should('be.visible');
      cy.get('table').should('exist');
    });

    it('should render action buttons', () => {
      cy.get('[data-testid="chat-input"]').type('Turn off the lights in conference room');
      cy.get('[data-testid="send-button"]').click();
      
      cy.waitForAIResponse();
      
      // Action confirmation should appear
      cy.get('[data-testid="action-button"]').should('be.visible');
      cy.contains('Confirm').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should show error message on API failure', () => {
      // Mock API error
      cy.intercept('POST', '/api/ai/chat', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('aiChatError');
      
      cy.get('[data-testid="chat-input"]').type('Test message');
      cy.get('[data-testid="send-button"]').click();
      
      cy.wait('@aiChatError');
      cy.contains('Something went wrong').should('be.visible');
    });

    it('should handle network timeout', () => {
      // Mock slow response
      cy.intercept('POST', '/api/ai/chat', {
        delay: 15000,
        statusCode: 200,
        body: { response: 'Delayed response' }
      }).as('slowResponse');
      
      cy.get('[data-testid="chat-input"]').type('Test message');
      cy.get('[data-testid="send-button"]').click();
      
      // Should show timeout message
      cy.contains('Request timed out', { timeout: 12000 }).should('be.visible');
    });
  });

  describe('Conversation Context', () => {
    it('should maintain building context', () => {
      // Select a building
      cy.get('[data-testid="building-selector"]').click();
      cy.contains('HQ Building').click();
      
      // Send message
      cy.get('[data-testid="chat-input"]').type('What is the temperature?');
      cy.get('[data-testid="send-button"]').click();
      
      cy.waitForAIResponse();
      
      // Response should be specific to selected building
      cy.get('[data-testid="ai-response"]').should('contain', 'HQ Building');
    });

    it('should show relevant suggestions', () => {
      // Type partial query
      cy.get('[data-testid="chat-input"]').type('Show me');
      
      // Suggestions should appear
      cy.get('[data-testid="suggestions"]').should('be.visible');
      cy.contains('Show me energy usage').should('be.visible');
      cy.contains('Show me emissions data').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', () => {
      cy.checkA11y('[data-testid="conversation-interface"]');
    });

    it('should be keyboard navigable', () => {
      // Focus on input using tab
      cy.get('[data-testid="chat-input"]').focus();
      cy.focused().should('have.attr', 'data-testid', 'chat-input');
      
      // Tab to send button
      cy.focused().type('{tab}');
      cy.focused().should('have.attr', 'data-testid', 'send-button');
      
      // Tab to voice button
      cy.focused().type('{tab}');
      cy.focused().should('have.attr', 'data-testid', 'voice-button');
    });
  });

  describe('Performance', () => {
    it('should handle rapid message sending', () => {
      const messages = ['Message 1', 'Message 2', 'Message 3'];
      
      messages.forEach(msg => {
        cy.get('[data-testid="chat-input"]').type(msg);
        cy.get('[data-testid="send-button"]').click();
      });
      
      // All messages should be queued and processed
      messages.forEach(msg => {
        cy.contains(msg).should('be.visible');
      });
    });

    it('should lazy load conversation history', () => {
      // Scroll to top to trigger history load
      cy.get('[data-testid="conversation-container"]').scrollTo('top');
      
      // Loading indicator should appear
      cy.get('[data-testid="history-loading"]').should('be.visible');
      
      // Older messages should load
      cy.contains('Previous conversations loaded').should('be.visible');
    });
  });
});