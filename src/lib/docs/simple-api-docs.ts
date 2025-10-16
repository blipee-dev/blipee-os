import * as fs from 'fs';
import * as path from 'path';

interface APIEndpoint {
  path: string;
  method: string;
  summary: string;
  description: string;
  parameters: any[];
  requestBody?: any;
  responses: any;
  security: any[];
  tags: string[];
}

/**
 * Simple API Documentation Generator
 * Creates documentation from API route files using regex pattern matching
 */
export class SimpleAPIDocGenerator {
  private srcDir: string;
  private outputDir: string;

  constructor(srcDir: string = 'src/app/api', outputDir: string = 'docs/api') {
    this.srcDir = srcDir;
    this.outputDir = outputDir;
  }

  /**
   * Generate API documentation
   */
  async generate(): Promise<void> {
    
    const routeFiles = await this.findRouteFiles();
    const endpoints: any[] = [];
    
    for (const filePath of routeFiles) {
      try {
        const routeEndpoints = await this.analyzeRouteFile(filePath);
        endpoints.push(...routeEndpoints);
      } catch (error) {
        console.warn(`⚠️  Failed to analyze ${filePath}:`, error);
      }
    }

    // Create output directory
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Generate OpenAPI spec
    const spec = this.generateOpenAPISpec(endpoints);
    const specPath = path.join(this.outputDir, 'openapi.json');
    fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));

    // Generate Markdown documentation
    const markdown = this.generateMarkdown(endpoints);
    const markdownPath = path.join(this.outputDir, 'README.md');
    fs.writeFileSync(markdownPath, markdown);

    // Generate HTML documentation
    const html = this.generateHTML(spec);
    const htmlPath = path.join(this.outputDir, 'index.html');
    fs.writeFileSync(htmlPath, html);

  }

  /**
   * Find all API route files
   */
  private async findRouteFiles(): Promise<string[]> {
    const routeFiles: string[] = [];
    
    const scanDirectory = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          scanDirectory(fullPath);
        } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
          routeFiles.push(fullPath);
        }
      }
    };
    
    scanDirectory(this.srcDir);
    return routeFiles;
  }

  /**
   * Analyze a single route file
   */
  private async analyzeRouteFile(filePath: string): Promise<any[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(this.srcDir, filePath);
    const apiPath = this.extractAPIPath(relativePath);
    
    const endpoints: any[] = [];
    const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    
    for (const method of httpMethods) {
      const regex = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`, 'i');
      if (regex.test(content)) {
        const endpoint: APIEndpoint = {
          path: apiPath,
          method: method.toLowerCase(),
          summary: `${method} ${apiPath}`,
          description: this.extractDescription(content, method),
          parameters: this.extractParameters(apiPath),
          responses: this.getDefaultResponses(),
          security: this.extractSecurity(content),
          tags: this.extractTags(apiPath)
        };

        if (['post', 'put', 'patch'].includes(method.toLowerCase())) {
          endpoint.requestBody = {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object' }
              }
            }
          };
        }

        endpoints.push(endpoint);
      }
    }

    return endpoints;
  }

  /**
   * Extract API path from file path
   */
  private extractAPIPath(relativePath: string): string {
    const segments = relativePath
      .replace('/route.ts', '')
      .replace('/route.js', '')
      .split(path.sep)
      .filter(Boolean);
    
    let apiPath = '/api';
    
    for (const segment of segments) {
      if (segment.startsWith('[') && segment.endsWith(']')) {
        const param = segment.slice(1, -1);
        apiPath += `/{${param}}`;
      } else {
        apiPath += `/${segment}`;
      }
    }
    
    return apiPath;
  }

  /**
   * Extract description from JSDoc comments
   */
  private extractDescription(content: string, method: string): string {
    // Look for JSDoc comment before the export function
    const functionRegex = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`, 'i');
    const functionMatch = content.search(functionRegex);
    
    if (functionMatch !== -1) {
      // Look backwards for JSDoc comment
      const beforeFunction = content.substring(0, functionMatch);
      const jsdocMatch = beforeFunction.match(/\/\*\*([\s\S]*?)\*\//g);
      
      if (jsdocMatch && jsdocMatch.length > 0) {
        const lastJsdoc = jsdocMatch[jsdocMatch.length - 1];
        // Extract first meaningful line from JSDoc
        const lines = lastJsdoc.split('\n');
        for (const line of lines) {
          const cleaned = line.replace(/^\s*\*\s?/, '').trim();
          if (cleaned && !cleaned.startsWith('@') && cleaned !== '/**' && cleaned !== '*/') {
            return cleaned;
          }
        }
      }
    }
    
    return `${method} operation`;
  }

  /**
   * Extract parameters from API path
   */
  private extractParameters(apiPath: string): any[] {
    const parameters: any[] = [];
    const pathParams = apiPath.match(/\{([^}]+)\}/g);
    
    if (pathParams) {
      for (const param of pathParams) {
        const paramName = param.slice(1, -1);
        parameters.push({
          name: paramName,
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: `${paramName} identifier`
        });
      }
    }
    
    return parameters;
  }

  /**
   * Extract security requirements from source code
   */
  private extractSecurity(content: string): any[] {
    const security: any[] = [];
    
    if (content.includes('validateSession') || content.includes('requireAuth')) {
      security.push({ SessionAuth: [] });
    }
    
    if (content.includes('Bearer ') || content.includes('jwt')) {
      security.push({ BearerAuth: [] });
    }
    
    if (content.includes('csrf') || content.includes('CSRF')) {
      security.push({ CSRFToken: [] });
    }
    
    return security.length > 0 ? security : [{}];
  }

  /**
   * Extract tags from API path
   */
  private extractTags(apiPath: string): string[] {
    const segments = apiPath.split('/').filter(Boolean);
    if (segments.length >= 2) {
      return [segments[1]];
    }
    return ['api'];
  }

  /**
   * Get default responses
   */
  private getDefaultResponses(): any {
    return {
      '200': {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: { type: 'object' }
          }
        }
      },
      '400': {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' }
              }
            }
          }
        }
      },
      '401': {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' }
              }
            }
          }
        }
      },
      '500': {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' }
              }
            }
          }
        }
      }
    };
  }

  /**
   * Generate OpenAPI specification
   */
  private generateOpenAPISpec(endpoints: any[]): any {
    const spec = {
      openapi: '3.0.0',
      info: {
        title: 'blipee OS API',
        version: '1.0.0',
        description: 'Autonomous Sustainability Intelligence Platform API - Generated automatically from route files'
      },
      servers: [
        {
          url: process.env.NEXT_PUBLIC_SITE_URL || 'https://app.blipee.com',
          description: 'Production server'
        },
        {
          url: 'http://localhost:3000',
          description: 'Development server'
        }
      ],
      paths: {},
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          },
          SessionAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'blipee-session'
          },
          CSRFToken: {
            type: 'apiKey',
            in: 'header',
            name: 'X-CSRF-Token'
          }
        }
      },
      security: [
        { BearerAuth: [] },
        { SessionAuth: [], CSRFToken: [] }
      ]
    };

    // Group endpoints by path
    for (const endpoint of endpoints) {
      if (!spec.paths[endpoint.path]) {
        spec.paths[endpoint.path] = {};
      }
      
      spec.paths[endpoint.path][endpoint.method] = {
        summary: endpoint.summary,
        description: endpoint.description,
        tags: endpoint.tags,
        parameters: endpoint.parameters,
        requestBody: endpoint.requestBody,
        responses: endpoint.responses,
        security: endpoint.security
      };
    }

    return spec;
  }

  /**
   * Generate Markdown documentation
   */
  private generateMarkdown(endpoints: any[]): string {
    let markdown = `# blipee OS API Documentation\n\n`;
    markdown += `Generated automatically from API route files.\n\n`;
    markdown += `**Base URL:** \`${process.env.NEXT_PUBLIC_SITE_URL || 'https://app.blipee.com'}\`\n\n`;
    
    // Group by tags
    const endpointsByTag = endpoints.reduce((acc, endpoint) => {
      const tag = endpoint.tags[0] || 'api';
      if (!acc[tag]) acc[tag] = [];
      acc[tag].push(endpoint);
      return acc;
    }, {});

    // Authentication section
    markdown += `## Authentication\n\n`;
    markdown += `This API supports multiple authentication methods:\n\n`;
    markdown += `- **Session Authentication**: Uses secure HTTP-only cookies\n`;
    markdown += `- **Bearer Token**: JWT tokens in Authorization header\n`;
    markdown += `- **CSRF Protection**: Required for state-changing operations\n\n`;

    // Endpoints by tag
    Object.entries(endpointsByTag).forEach(([tag, tagEndpoints]: [string, any]) => {
      markdown += `## ${tag.charAt(0).toUpperCase() + tag.slice(1)}\n\n`;
      
      tagEndpoints.forEach((endpoint: any) => {
        markdown += `### ${endpoint.method.toUpperCase()} ${endpoint.path}\n\n`;
        markdown += `${endpoint.description}\n\n`;
        
        // Parameters
        if (endpoint.parameters && endpoint.parameters.length > 0) {
          markdown += `**Parameters:**\n\n`;
          endpoint.parameters.forEach((param: any) => {
            markdown += `- \`${param.name}\` (${param.in}): ${param.description}\n`;
          });
          markdown += '\n';
        }
        
        // Request body
        if (endpoint.requestBody) {
          markdown += `**Request Body:** JSON object\n\n`;
        }
        
        // Responses
        markdown += `**Responses:**\n\n`;
        Object.entries(endpoint.responses).forEach(([status, response]: [string, any]) => {
          markdown += `- \`${status}\`: ${response.description}\n`;
        });
        markdown += '\n---\n\n';
      });
    });

    return markdown;
  }

  /**
   * Generate HTML documentation with Swagger UI
   */
  private generateHTML(spec: any): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>${spec.info.title}</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; font-family: system-ui, -apple-system, sans-serif; }
    .header { background: #1e293b; color: white; padding: 1rem; text-align: center; }
    .header h1 { margin: 0; font-size: 1.5rem; }
    .header p { margin: 0.5rem 0 0 0; opacity: 0.8; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${spec.info.title}</h1>
    <p>${spec.info.description}</p>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        spec: ${JSON.stringify(spec, null, 2)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        tryItOutEnabled: true
      });
    };
  </script>
</body>
</html>`;
  }
}

// Export utility function
export async function generateSimpleAPIDocs(): Promise<void> {
  const generator = new SimpleAPIDocGenerator();
  await generator.generate();
}