import * as fs from 'fs';
import * as path from 'path';

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, any>;
  components: {
    schemas: Record<string, any>;
    securitySchemes: Record<string, any>;
  };
  security: Array<Record<string, string[]>>;
}

export interface APIEndpoint {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  parameters?: any[];
  requestBody?: any;
  responses: Record<string, any>;
  tags?: string[];
  security?: Array<Record<string, string[]>>;
}

export interface RouteAnalysis {
  filePath: string;
  endpoints: APIEndpoint[];
  schemas: Record<string, any>;
}

/**
 * Automatic API Documentation Generator
 * Scans API route files and generates OpenAPI/Swagger documentation
 */
export class APIDocGenerator {
  private srcDir: string;
  private outputDir: string;
  private spec: OpenAPISpec;

  constructor(srcDir: string = 'src/app/api', outputDir: string = 'docs/api') {
    this.srcDir = srcDir;
    this.outputDir = outputDir;
    this.spec = {
      openapi: '3.0.0',
      info: {
        title: 'blipee OS API',
        version: '1.0.0',
        description: 'Autonomous Sustainability Intelligence Platform API'
      },
      servers: [
        {
          url: process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000',
          description: 'Production server'
        },
        {
          url: 'http://localhost:3000',
          description: 'Development server'
        }
      ],
      paths: {},
      components: {
        schemas: {},
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
  }

  /**
   * Generate complete API documentation
   */
  async generate(): Promise<void> {
    console.log('🔍 Scanning API routes...');
    
    const routeFiles = await this.findRouteFiles();
    const analyses: RouteAnalysis[] = [];
    
    for (const filePath of routeFiles) {
      try {
        const analysis = await this.analyzeRouteFile(filePath);
        analyses.push(analysis);
        console.log(`✅ Analyzed ${filePath}`);
      } catch (error) {
        console.warn(`⚠️  Failed to analyze ${filePath}:`, error);
      }
    }

    // Build OpenAPI spec from analyses
    this.buildOpenAPISpec(analyses);

    // Generate documentation files
    await this.generateDocumentation();

    console.log('📚 API documentation generated successfully!');
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
  private async analyzeRouteFile(filePath: string): Promise<RouteAnalysis> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(this.srcDir, filePath);
    const apiPath = this.extractAPIPath(relativePath);
    
    const endpoints: APIEndpoint[] = [];
    const schemas: Record<string, any> = {};
    
    // Simple regex-based analysis instead of AST parsing
    const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    
    for (const method of httpMethods) {
      const regex = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`, 'i');
      if (regex.test(content)) {
        const endpoint = this.analyzeEndpointFunction(
          method,
          apiPath,
          content
        );
        endpoints.push(endpoint);
      }
    }

    return { filePath, endpoints, schemas };
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
        // Dynamic route parameter
        const param = segment.slice(1, -1);
        apiPath += `/{${param}}`;
      } else {
        apiPath += `/${segment}`;
      }
    }
    
    return apiPath;
  }

  /**
   * Extract HTTP method from function name
   */
  private extractHTTPMethod(functionName: string): string | null {
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    const upperName = functionName.toUpperCase();
    
    return methods.find(method => upperName === method) || null;
  }

  /**
   * Analyze endpoint function for documentation details
   */
  private analyzeEndpointFunction(
    method: string,
    apiPath: string,
    sourceCode: string
  ): APIEndpoint {
    const endpoint: APIEndpoint = {
      path: apiPath,
      method: method.toLowerCase(),
      responses: {
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
      }
    };

    // Extract JSDoc comments for documentation
    const comments = this.extractJSDocComments(sourceCode);
    if (comments) {
      endpoint.summary = comments.summary;
      endpoint.description = comments.description;
      endpoint.tags = comments.tags;
    }

    // Analyze parameters from path and function signature
    endpoint.parameters = this.extractParameters(apiPath);

    // Analyze request body for POST/PUT/PATCH
    if (['post', 'put', 'patch'].includes(method.toLowerCase())) {
      endpoint.requestBody = this.extractRequestBody(sourceCode);
    }

    // Determine security requirements
    endpoint.security = this.extractSecurityRequirements(sourceCode);

    return endpoint;
  }

  /**
   * Extract JSDoc comments from source code
   */
  private extractJSDocComments(sourceCode: string, func: t.FunctionDeclaration): any {
    const lines = sourceCode.split('\n');
    const funcStart = func.loc?.start.line || 1;
    
    // Look backwards for JSDoc comment
    for (let i = funcStart - 2; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith('/**')) {
        // Found JSDoc start, extract full comment
        const commentLines = [];
        for (let j = i; j < funcStart - 1; j++) {
          commentLines.push(lines[j]);
        }
        return this.parseJSDoc(commentLines.join('\n'));
      }
      if (line && !line.startsWith('*') && !line.startsWith('//')) {
        break; // Found non-comment line
      }
    }
    
    return null;
  }

  /**
   * Parse JSDoc comment block
   */
  private parseJSDoc(comment: string): any {
    const lines = comment.split('\n').map(line => 
      line.replace(/^\s*\*?\s?/, '').trim()
    ).filter(line => line && !line.startsWith('/**') && !line.startsWith('*/'));
    
    const result: any = {};
    let currentSection = 'description';
    let description = '';
    
    for (const line of lines) {
      if (line.startsWith('@')) {
        const [tag, ...rest] = line.split(' ');
        const tagName = tag.substring(1);
        const tagValue = rest.join(' ');
        
        if (tagName === 'summary') {
          result.summary = tagValue;
        } else if (tagName === 'tag') {
          result.tags = result.tags || [];
          result.tags.push(tagValue);
        }
      } else {
        description += line + ' ';
      }
    }
    
    if (description.trim()) {
      result.description = description.trim();
      if (!result.summary) {
        result.summary = description.split('.')[0].trim();
      }
    }
    
    return result;
  }

  /**
   * Extract parameters from API path and function signature
   */
  private extractParameters(apiPath: string, func: t.FunctionDeclaration): any[] {
    const parameters: any[] = [];
    
    // Extract path parameters
    const pathParams = apiPath.match(/\{([^}]+)\}/g);
    if (pathParams) {
      for (const param of pathParams) {
        const paramName = param.slice(1, -1);
        parameters.push({
          name: paramName,
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: `${paramName} parameter`
        });
      }
    }
    
    return parameters;
  }

  /**
   * Extract request body schema from function
   */
  private extractRequestBody(func: t.FunctionDeclaration, sourceCode: string): any {
    return {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            description: 'Request payload'
          }
        }
      }
    };
  }

  /**
   * Extract security requirements from source code
   */
  private extractSecurityRequirements(sourceCode: string): Array<Record<string, string[]>> {
    const security: Array<Record<string, string[]>> = [];
    
    // Check for authentication patterns
    if (sourceCode.includes('validateSession') || sourceCode.includes('requireAuth')) {
      security.push({ SessionAuth: [] });
    }
    
    if (sourceCode.includes('Bearer ') || sourceCode.includes('jwt')) {
      security.push({ BearerAuth: [] });
    }
    
    if (sourceCode.includes('csrf') || sourceCode.includes('CSRF')) {
      security.push({ CSRFToken: [] });
    }
    
    return security.length > 0 ? security : [{}]; // Empty object = no security
  }

  /**
   * Build complete OpenAPI specification
   */
  private buildOpenAPISpec(analyses: RouteAnalysis[]): void {
    for (const analysis of analyses) {
      for (const endpoint of analysis.endpoints) {
        const pathKey = endpoint.path;
        
        if (!this.spec.paths[pathKey]) {
          this.spec.paths[pathKey] = {};
        }
        
        this.spec.paths[pathKey][endpoint.method] = {
          summary: endpoint.summary || `${endpoint.method.toUpperCase()} ${pathKey}`,
          description: endpoint.description,
          tags: endpoint.tags || this.extractTagsFromPath(pathKey),
          parameters: endpoint.parameters,
          requestBody: endpoint.requestBody,
          responses: endpoint.responses,
          security: endpoint.security
        };
      }
      
      // Add schemas
      Object.assign(this.spec.components.schemas, analysis.schemas);
    }
  }

  /**
   * Extract tags from API path
   */
  private extractTagsFromPath(apiPath: string): string[] {
    const segments = apiPath.split('/').filter(Boolean);
    if (segments.length >= 2) {
      return [segments[1]]; // Use first path segment as tag
    }
    return ['api'];
  }

  /**
   * Generate documentation files
   */
  private async generateDocumentation(): Promise<void> {
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Generate OpenAPI JSON
    const openApiPath = path.join(this.outputDir, 'openapi.json');
    fs.writeFileSync(openApiPath, JSON.stringify(this.spec, null, 2));

    // Generate Markdown documentation
    const markdownPath = path.join(this.outputDir, 'API_DOCUMENTATION.md');
    const markdown = this.generateMarkdownDoc();
    fs.writeFileSync(markdownPath, markdown);

    // Generate HTML documentation using Swagger UI template
    const htmlPath = path.join(this.outputDir, 'index.html');
    const html = this.generateSwaggerHTML();
    fs.writeFileSync(htmlPath, html);

    console.log(`📄 OpenAPI spec: ${openApiPath}`);
    console.log(`📝 Markdown docs: ${markdownPath}`);
    console.log(`🌐 HTML docs: ${htmlPath}`);
  }

  /**
   * Generate Markdown documentation
   */
  private generateMarkdownDoc(): string {
    let markdown = `# ${this.spec.info.title}\n\n`;
    markdown += `${this.spec.info.description}\n\n`;
    markdown += `**Version:** ${this.spec.info.version}\n\n`;
    
    // Table of contents
    markdown += `## Table of Contents\n\n`;
    const tags = new Set<string>();
    Object.values(this.spec.paths).forEach((pathObj: any) => {
      Object.values(pathObj).forEach((endpoint: any) => {
        if (endpoint.tags) {
          endpoint.tags.forEach((tag: string) => tags.add(tag));
        }
      });
    });
    
    tags.forEach(tag => {
      markdown += `- [${tag.charAt(0).toUpperCase() + tag.slice(1)}](#${tag})\n`;
    });
    markdown += '\n';

    // Authentication section
    markdown += `## Authentication\n\n`;
    markdown += `This API uses multiple authentication methods:\n\n`;
    Object.entries(this.spec.components.securitySchemes).forEach(([name, scheme]: [string, any]) => {
      markdown += `- **${name}**: ${scheme.description || scheme.type}\n`;
    });
    markdown += '\n';

    // Endpoints by tag
    tags.forEach(tag => {
      markdown += `## ${tag.charAt(0).toUpperCase() + tag.slice(1)}\n\n`;
      
      Object.entries(this.spec.paths).forEach(([path, methods]: [string, any]) => {
        Object.entries(methods).forEach(([method, endpoint]: [string, any]) => {
          if (endpoint.tags && endpoint.tags.includes(tag)) {
            markdown += `### ${method.toUpperCase()} ${path}\n\n`;
            if (endpoint.summary) {
              markdown += `${endpoint.summary}\n\n`;
            }
            if (endpoint.description) {
              markdown += `${endpoint.description}\n\n`;
            }
            
            // Parameters
            if (endpoint.parameters && endpoint.parameters.length > 0) {
              markdown += `**Parameters:**\n\n`;
              endpoint.parameters.forEach((param: any) => {
                markdown += `- \`${param.name}\` (${param.in}): ${param.description || 'No description'}\n`;
              });
              markdown += '\n';
            }
            
            // Request body
            if (endpoint.requestBody) {
              markdown += `**Request Body:**\n\n`;
              markdown += `Content-Type: \`application/json\`\n\n`;
            }
            
            // Responses
            markdown += `**Responses:**\n\n`;
            Object.entries(endpoint.responses).forEach(([status, response]: [string, any]) => {
              markdown += `- \`${status}\`: ${response.description}\n`;
            });
            markdown += '\n---\n\n';
          }
        });
      });
    });

    return markdown;
  }

  /**
   * Generate Swagger UI HTML
   */
  private generateSwaggerHTML(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>${this.spec.info.title}</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: './openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;
  }
}

// Export utility function for npm script usage
export async function generateAPIDocs(): Promise<void> {
  const generator = new APIDocGenerator();
  await generator.generate();
}