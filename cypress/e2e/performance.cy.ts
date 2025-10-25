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

  });

  describe('API Response Times', () => {
    it('should respond to sustainability intelligence queries quickly', () => {
      const startTime = Date.now();

      cy.request({
        method: 'POST',
        url: '/api/sustainability/intelligence',
        body: {
          dashboardType: 'overview'
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        const responseTime = Date.now() - startTime;
        expect(responseTime).to.be.lessThan(2000); // 2 seconds max
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
