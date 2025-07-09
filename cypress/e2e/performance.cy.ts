describe('Performance Tests', () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Page Load Performance', () => {
    it('should load dashboard within acceptable time', () => {
      const startTime = Date.now();
      
      cy.visit('/dashboard');
      cy.get('[data-testid="dashboard-loaded"]').should('be.visible');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).to.be.lessThan(3000); // 3 seconds max
    });

    it('should load conversation interface quickly', () => {
      cy.visit('/dashboard');
      
      const startTime = Date.now();
      cy.get('[data-testid="conversation-interface"]').should('be.visible');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).to.be.lessThan(1000); // 1 second max
    });
  });

  describe('API Response Times', () => {
    it('should respond to chat messages quickly', () => {
      cy.visit('/dashboard');
      
      // Measure API response time
      cy.intercept('POST', '/api/ai/chat', (req) => {
        req.reply((res) => {
          res.send({
            response: 'Test response',
            conversationId: 'test-123',
          });
        });
      }).as('chatRequest');
      
      const startTime = Date.now();
      
      cy.get('[data-testid="chat-input"]').type('Test message');
      cy.get('[data-testid="send-button"]').click();
      
      cy.wait('@chatRequest').then(() => {
        const responseTime = Date.now() - startTime;
        expect(responseTime).to.be.lessThan(500); // 500ms max
      });
    });

    it('should handle concurrent requests efficiently', () => {
      const requests = [];
      
      // Send multiple requests simultaneously
      for (let i = 0; i < 5; i++) {
        requests.push(
          cy.request({
            method: 'GET',
            url: `${Cypress.env('API_URL')}/monitoring/health`,
          })
        );
      }
      
      const startTime = Date.now();
      
      cy.wrap(Promise.all(requests)).then((result) => {
        const responses = result as Cypress.Response<any>[];
        const totalTime = Date.now() - startTime;
        
        // All requests should complete within reasonable time
        expect(totalTime).to.be.lessThan(2000); // 2 seconds for all
        
        // All should be successful
        responses.forEach(response => {
          expect(response.status).to.eq(200);
        });
      });
    });
  });

  describe('Memory Usage', () => {
    it('should not have memory leaks during conversation', () => {
      cy.visit('/dashboard');
      
      // Get initial memory usage
      cy.window().then((win) => {
        if ('performance' in win && 'memory' in (win.performance as any)) {
          const initialMemory = (win.performance as any).memory.usedJSHeapSize;
          
          // Send multiple messages
          for (let i = 0; i < 10; i++) {
            cy.get('[data-testid="chat-input"]').type(`Message ${i}`);
            cy.get('[data-testid="send-button"]').click();
            cy.wait(100);
          }
          
          // Check memory after operations
          cy.window().then((win2) => {
            const finalMemory = (win2.performance as any).memory.usedJSHeapSize;
            const memoryIncrease = finalMemory - initialMemory;
            
            // Memory increase should be reasonable (less than 50MB)
            expect(memoryIncrease).to.be.lessThan(50 * 1024 * 1024);
          });
        }
      });
    });
  });

  describe('Bundle Size', () => {
    it('should have optimized JavaScript bundles', () => {
      cy.request('/').then((response) => {
        // Check for proper compression
        expect(response.headers['content-encoding']).to.include('gzip');
        
        // Parse HTML to find script tags
        const scripts = response.body.match(/<script[^>]*src="([^"]+)"/g) || [];
        
        scripts.forEach((scriptTag: string) => {
          const srcMatch = scriptTag.match(/src="([^"]+)"/);
          if (srcMatch) {
            const scriptUrl = srcMatch[1];
            
            // Check individual bundle sizes
            cy.request({
              url: scriptUrl,
              encoding: 'binary',
            }).then((scriptResponse) => {
              const sizeInKB = scriptResponse.body.length / 1024;
              
              // Individual chunks should be under 300KB
              expect(sizeInKB).to.be.lessThan(300);
            });
          }
        });
      });
    });
  });

  describe('Cache Performance', () => {
    it('should cache static assets', () => {
      // First visit
      cy.visit('/dashboard');
      
      // Check that static assets are cached
      cy.intercept('GET', '/_next/static/**', (req) => {
        req.reply((res) => {
          expect(res.headers['cache-control']).to.include('max-age');
        });
      });
      
      // Second visit should use cache
      cy.visit('/dashboard');
    });

    it('should demonstrate AI response caching', () => {
      cy.visit('/dashboard');
      
      const message = 'What is our energy usage?';
      
      // First request - not cached
      cy.get('[data-testid="chat-input"]').type(message);
      cy.get('[data-testid="send-button"]').click();
      
      cy.wait('@aiChat').then((interception) => {
        expect(interception.response?.body.cached).to.be.false;
      });
      
      // Clear messages
      cy.reload();
      
      // Same request - should be cached
      cy.get('[data-testid="chat-input"]').type(message);
      cy.get('[data-testid="send-button"]').click();
      
      cy.wait('@aiChat').then((interception) => {
        expect(interception.response?.body.cached).to.be.true;
      });
    });
  });

  describe('Lazy Loading', () => {
    it('should lazy load heavy components', () => {
      cy.visit('/dashboard');
      
      // Chart components should not be loaded initially
      cy.get('script[src*="recharts"]').should('not.exist');
      
      // Trigger chart rendering
      cy.get('[data-testid="chat-input"]').type('Show me energy trends');
      cy.get('[data-testid="send-button"]').click();
      
      cy.waitForAIResponse();
      
      // Now chart library should be loaded
      cy.get('script[src*="recharts"]').should('exist');
    });
  });

  describe('Database Query Performance', () => {
    it('should use connection pooling effectively', () => {
      const queries = [];
      
      // Make multiple database queries
      for (let i = 0; i < 10; i++) {
        queries.push(
          cy.apiRequest('GET', '/v1/organizations')
        );
      }
      
      cy.wrap(Promise.all(queries)).then((result) => {
        const responses = result as Cypress.Response<any>[];
        // Check response times are consistent
        const times = responses.map(r => r.duration || 0);
        const avgTime = times.reduce((a, b) => a + b) / times.length;
        
        // No query should take more than 2x average (indicates pooling works)
        times.forEach(time => {
          expect(time).to.be.lessThan(avgTime * 2);
        });
      });
    });
  });

  describe('Real User Monitoring', () => {
    it('should track performance metrics', () => {
      cy.visit('/dashboard');
      
      // Check for performance tracking
      cy.window().then((win) => {
        // Web Vitals should be tracked
        expect(win).to.have.property('webVitals');
        
        // Performance entries should exist
        const entries = win.performance.getEntriesByType('navigation');
        expect(entries).to.have.length.greaterThan(0);
        
        const navEntry = entries[0] as PerformanceNavigationTiming;
        
        // Check key metrics
        expect(navEntry.domContentLoadedEventEnd).to.be.greaterThan(0);
        expect(navEntry.loadEventEnd).to.be.greaterThan(0);
        
        // Calculate metrics
        const ttfb = navEntry.responseStart - navEntry.requestStart;
        const domLoad = navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart;
        const pageLoad = navEntry.loadEventEnd - navEntry.loadEventStart;
        
        // Assert reasonable values
        expect(ttfb).to.be.lessThan(200); // Time to first byte < 200ms
        expect(domLoad).to.be.lessThan(500); // DOM load < 500ms
        expect(pageLoad).to.be.lessThan(1000); // Page load < 1s
      });
    });
  });
});