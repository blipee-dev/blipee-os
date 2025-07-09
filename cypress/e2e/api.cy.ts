describe('API Endpoints', () => {
  let authToken: string;

  before(() => {
    // Get auth token
    cy.request('POST', `${Cypress.env('API_URL')}/auth/signin`, {
      email: Cypress.env('TEST_USER_EMAIL'),
      password: Cypress.env('TEST_USER_PASSWORD'),
    }).then((response) => {
      authToken = response.body.token;
    });
  });

  describe('Health & Monitoring', () => {
    it('should return health status', () => {
      cy.request('GET', `${Cypress.env('API_URL')}/monitoring/health`)
        .then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.have.property('status', 'healthy');
          expect(response.body.services).to.have.property('database', 'healthy');
          expect(response.body.services).to.have.property('redis', 'healthy');
        });
    });

    it('should return performance metrics', () => {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('API_URL')}/monitoring/metrics`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('responseTime');
        expect(response.body).to.have.property('cacheHitRate');
        expect(response.body).to.have.property('errorRate');
      });
    });
  });

  describe('Organizations API', () => {
    it('should list organizations', () => {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('API_URL')}/v1/organizations`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('data');
        expect(response.body.data).to.be.an('array');
      });
    });

    it('should get organization details', () => {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('API_URL')}/v1/organizations/org_123`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('id', 'org_123');
        expect(response.body).to.have.property('name');
      });
    });

    it('should handle unauthorized access', () => {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('API_URL')}/v1/organizations`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.have.property('error');
      });
    });
  });

  describe('AI Chat API', () => {
    it('should process chat messages', () => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('API_URL')}/ai/chat`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: {
          message: 'What is our energy usage?',
          conversationId: 'test-conv-123',
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('response');
        expect(response.body).to.have.property('conversationId');
        expect(response.body).to.have.property('cached');
      });
    });

    it('should validate message content', () => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('API_URL')}/ai/chat`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: {
          message: '', // Empty message
          conversationId: 'test-conv-123',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.error).to.include('Message is required');
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', () => {
      const requests = Array(15).fill(null).map(() => 
        cy.request({
          method: 'GET',
          url: `${Cypress.env('API_URL')}/v1/organizations`,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          failOnStatusCode: false,
        })
      );

      cy.wrap(Promise.all(requests)).then((result) => {
        const responses = result as Cypress.Response<any>[];
        const rateLimited = responses.some(r => r.status === 429);
        expect(rateLimited).to.be.true;
        
        const limitedResponse = responses.find(r => r.status === 429);
        expect(limitedResponse?.headers).to.have.property('x-ratelimit-limit');
        expect(limitedResponse?.headers).to.have.property('x-ratelimit-remaining');
        expect(limitedResponse?.headers).to.have.property('x-ratelimit-reset');
      });
    });
  });

  describe('Webhook API', () => {
    let webhookId: string;

    it('should create webhook', () => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('API_URL')}/webhooks`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: {
          url: 'https://example.com/webhook',
          events: ['emission.created', 'report.generated'],
          secret: 'test-secret',
        },
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.property('id');
        expect(response.body).to.have.property('url');
        webhookId = response.body.id;
      });
    });

    it('should list webhooks', () => {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('API_URL')}/webhooks`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.data).to.be.an('array');
        expect(response.body.data.some((w: any) => w.id === webhookId)).to.be.true;
      });
    });

    it('should test webhook', () => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('API_URL')}/webhooks/${webhookId}/test`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('success');
      });
    });

    it('should delete webhook', () => {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.env('API_URL')}/webhooks/${webhookId}`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(204);
      });
    });
  });

  describe('GraphQL API', () => {
    it('should execute queries', () => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('API_URL')}/graphql`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: {
          query: `
            query {
              organizations {
                id
                name
                buildings {
                  id
                  name
                }
              }
            }
          `,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('data');
        expect(response.body.data).to.have.property('organizations');
      });
    });

    it('should execute mutations', () => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('API_URL')}/graphql`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: {
          query: `
            mutation CreateBuilding($input: CreateBuildingInput!) {
              createBuilding(input: $input) {
                id
                name
                type
              }
            }
          `,
          variables: {
            input: {
              name: 'Test Building',
              type: 'office',
              address: '123 Test St',
              size: 10000,
            },
          },
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.data.createBuilding).to.have.property('id');
        expect(response.body.data.createBuilding.name).to.eq('Test Building');
      });
    });

    it('should handle GraphQL errors', () => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('API_URL')}/graphql`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: {
          query: `
            query {
              invalidField
            }
          `,
        },
      }).then((response) => {
        expect(response.status).to.eq(200); // GraphQL returns 200 even for errors
        expect(response.body).to.have.property('errors');
        expect(response.body.errors).to.be.an('array');
      });
    });
  });

  describe('File Upload API', () => {
    it('should upload files', () => {
      cy.fixture('sample-document.pdf', 'base64').then((fileContent) => {
        const blob = Cypress.Blob.base64StringToBlob(fileContent, 'application/pdf');
        
        const formData = new FormData();
        formData.append('file', blob, 'sample-document.pdf');
        formData.append('type', 'invoice');

        cy.request({
          method: 'POST',
          url: `${Cypress.env('API_URL')}/files/upload`,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          body: formData,
        }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.have.property('fileId');
          expect(response.body).to.have.property('analysis');
        });
      });
    });
  });

  describe('API Versioning', () => {
    it('should support v1 endpoints', () => {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('API_URL')}/v1/organizations`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    });

    it('should support v2 endpoints', () => {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('API_URL')}/v2/organizations`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        // v2 might have different response format
        expect(response.body).to.have.property('items'); // instead of 'data'
      });
    });
  });
});