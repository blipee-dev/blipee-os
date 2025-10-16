/**
 * Conversational ESG Intelligence
 * 
 * This is the core of blipee-os - ALL ESG features are accessed through natural conversation.
 * No traditional forms or dashboards - everything is conversational with dynamic UI components.
 */

import { createClient } from '@supabase/supabase-js';
import { UIComponent } from '@/types/conversation';

interface ConversationalESGResponse {
  message: string;
  components?: UIComponent[];
  suggestions?: string[];
  actions?: ESGAction[];
  context?: any;
}

interface ESGAction {
  type: 'data_entry' | 'file_upload' | 'target_setting' | 'assessment' | 'report' | 'analysis';
  label: string;
  data?: any;
}

export class ConversationalESG {
  private supabase: ReturnType<typeof createClient>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Process any ESG-related conversation
   */
  async processESGConversation(
    message: string,
    organizationId: string,
    context?: any
  ): Promise<ConversationalESGResponse> {
    const lowerMessage = message.toLowerCase();

    // Materiality Assessment
    if (this.isAboutMateriality(lowerMessage)) {
      return this.handleMaterialityConversation(message, organizationId, context);
    }

    // Emissions Data Entry
    if (this.isAboutEmissions(lowerMessage)) {
      return this.handleEmissionsConversation(message, organizationId, context);
    }

    // Target Setting
    if (this.isAboutTargets(lowerMessage)) {
      return this.handleTargetConversation(message, organizationId, context);
    }

    // Compliance & Reporting
    if (this.isAboutCompliance(lowerMessage)) {
      return this.handleComplianceConversation(message, organizationId, context);
    }

    // Data Import
    if (this.isAboutDataImport(lowerMessage)) {
      return this.handleDataImportConversation(message, organizationId, context);
    }

    // Default ESG help
    return this.getESGHelp(organizationId);
  }

  /**
   * Materiality Assessment Conversation
   */
  private async handleMaterialityConversation(
    message: string,
    organizationId: string,
    context?: any
  ): Promise<ConversationalESGResponse> {
    // Get organization's industry
    const { data: org } = await this.supabase
      .from('organizations')
      .select('industry')
      .eq('id', organizationId)
      .single();

    // Get or generate material topics
    const topics = await this.getMaterialTopics(organizationId, org?.industry);

    return {
      message: `I'll help you create a materiality assessment. I've identified ${topics.length} potential material topics for your ${org?.industry || 'industry'}. 

You can drag topics on the matrix below to position them based on:
- **Business Impact** (horizontal axis): How much does this affect your business operations and value?
- **Stakeholder Concern** (vertical axis): How important is this to your stakeholders?

Topics in the red "Critical" quadrant should be your primary focus for ESG strategy and reporting.`,
      components: [{
        type: 'materiality-matrix',
        props: {
          topics,
          industryContext: org?.industry,
          interactive: true,
          onUpdate: (updatedTopics: any) => {
            // This would be handled by the chat interface
          },
          onSave: async (assessment: any) => {
            // Save to database
            await this.saveMaterialityAssessment(organizationId, assessment);
          }
        }
      }],
      suggestions: [
        "Add climate change as a material topic",
        "Show me best practices for my industry",
        "What topics do my peers consider material?",
        "Help me understand double materiality"
      ]
    };
  }

  /**
   * Emissions Data Entry Conversation
   */
  private async handleEmissionsConversation(
    message: string,
    organizationId: string,
    context?: any
  ): Promise<ConversationalESGResponse> {
    // Check if user wants to upload or enter manually
    if (message.includes('upload') || message.includes('file') || message.includes('bill')) {
      return {
        message: "I can help you extract emissions data from your documents. You can upload utility bills, invoices, travel receipts, or any other documents with emissions data. Just drag and drop or click to upload.",
        components: [{
          type: 'quick-start-upload',
          props: {
            title: 'Upload Emissions Documents',
            acceptedTypes: ['PDF', 'Images', 'Excel'],
            onUpload: async (file: File) => {
              // Process with AI
            }
          }
        }],
        suggestions: [
          "I have an electricity bill to upload",
          "Upload multiple utility bills at once",
          "Import from Excel spreadsheet",
          "Enter data manually instead"
        ]
      };
    }

    // Manual entry flow
    return {
      message: "I'll help you track emissions data. What type of emissions would you like to record?",
      suggestions: [
        "Electricity consumption (Scope 2)",
        "Natural gas usage (Scope 1)", 
        "Vehicle fuel (Scope 1)",
        "Business travel (Scope 3)",
        "Upload a utility bill instead"
      ],
      actions: [{
        type: 'data_entry',
        label: 'Quick Entry',
        data: { emissionType: 'electricity' }
      }]
    };
  }

  /**
   * Target Setting Conversation
   */
  private async handleTargetConversation(
    message: string,
    organizationId: string,
    context?: any
  ): Promise<ConversationalESGResponse> {
    // Check current emissions for context
    const { data: emissions } = await this.supabase
      .from('emissions')
      .select('co2e_tonnes')
      .eq('organization_id', organizationId)
      .gte('period_start', new Date(new Date().getFullYear() - 1, 0, 1).toISOString());

    const totalEmissions = emissions?.reduce((sum, e) => sum + (e.co2e_tonnes || 0), 0) || 0;

    if (message.includes('net zero') || message.includes('net-zero')) {
      return {
        message: `Based on your current annual emissions of ${totalEmissions.toFixed(2)} tonnes CO2e, I recommend setting a net zero target by 2050 with interim targets for 2030.

To align with climate science (1.5°C pathway), you should aim for:
- **2030**: 50% reduction (${(totalEmissions * 0.5).toFixed(2)} tonnes CO2e)
- **2040**: 90% reduction (${(totalEmissions * 0.1).toFixed(2)} tonnes CO2e)  
- **2050**: Net Zero (remaining emissions offset)

Would you like me to create these targets for you?`,
        suggestions: [
          "Yes, create these science-based targets",
          "I want a more ambitious timeline",
          "Tell me about carbon removal options",
          "What are other companies in my industry doing?"
        ],
        actions: [{
          type: 'target_setting',
          label: 'Create Net Zero Target',
          data: {
            targetType: 'net_zero',
            baselineYear: new Date().getFullYear() - 1,
            baselineValue: totalEmissions,
            targets: [
              { year: 2030, reduction: 0.5 },
              { year: 2040, reduction: 0.9 },
              { year: 2050, reduction: 1.0 }
            ]
          }
        }]
      };
    }

    return {
      message: "I can help you set science-based targets. What would you like to achieve?",
      suggestions: [
        "Set a net zero target",
        "100% renewable energy",
        "Reduce Scope 3 emissions by 30%",
        "Align with Paris Agreement"
      ]
    };
  }

  /**
   * Compliance & Reporting Conversation
   */
  private async handleComplianceConversation(
    message: string,
    organizationId: string,
    context?: any
  ): Promise<ConversationalESGResponse> {
    // Check compliance status
    const { data: compliance } = await this.supabase
      .from('compliance_frameworks')
      .select('*')
      .eq('organization_id', organizationId);

    return {
      message: `I can help you with compliance and reporting. Here's your current status:

${compliance?.map(c => `• **${c.framework}**: ${c.completion_percentage}% complete`).join('\n') || 'No compliance frameworks configured yet.'}

What would you like to do?`,
      components: [{
        type: 'dashboard',
        props: {
          title: 'Compliance Overview',
          metrics: compliance?.map(c => ({
            label: c.framework,
            value: `${c.completion_percentage}%`,
            trend: 'up'
          })) || []
        }
      }],
      suggestions: [
        "Generate GRI report",
        "Check TCFD compliance",
        "Prepare CDP response",
        "Show me what data is missing"
      ]
    };
  }

  /**
   * Data Import Conversation
   */
  private async handleDataImportConversation(
    message: string,
    organizationId: string,
    context?: any
  ): Promise<ConversationalESGResponse> {
    if (message.includes('csv') || message.includes('excel') || message.includes('bulk')) {
      return {
        message: "I can help you import data in bulk. You can upload CSV or Excel files with emissions data, energy consumption, water usage, waste generation, or sustainability targets. I'll validate the data and import it automatically.",
        components: [{
          type: 'quick-start-upload',
          props: {
            title: 'Bulk Data Import',
            acceptedTypes: ['CSV', 'Excel'],
            showTemplateDownload: true,
            onUpload: async (file: File) => {
              // Process bulk import
            }
          }
        }],
        suggestions: [
          "Download emissions template",
          "Import last year's data",
          "Upload supplier emissions",
          "Import from our ERP system"
        ]
      };
    }

    return this.getESGHelp(organizationId);
  }

  /**
   * Helper Methods
   */
  private isAboutMateriality(message: string): boolean {
    const keywords = ['material', 'materiality', 'assessment', 'double materiality', 'stakeholder'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private isAboutEmissions(message: string): boolean {
    const keywords = ['emission', 'carbon', 'co2', 'ghg', 'scope', 'footprint', 'track'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private isAboutTargets(message: string): boolean {
    const keywords = ['target', 'goal', 'net zero', 'net-zero', 'reduction', 'sbti', 'science-based'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private isAboutCompliance(message: string): boolean {
    const keywords = ['compliance', 'report', 'gri', 'tcfd', 'sasb', 'cdp', 'disclosure'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private isAboutDataImport(message: string): boolean {
    const keywords = ['import', 'upload', 'csv', 'excel', 'bulk', 'data entry'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private async getMaterialTopics(organizationId: string, industry?: string): Promise<any[]> {
    // Get existing topics or generate industry-specific ones
    const { data: existingTopics } = await this.supabase
      .from('material_topics')
      .select('*')
      .eq('organization_id', organizationId);

    if (existingTopics && existingTopics.length > 0) {
      return existingTopics.map(t => ({
        id: t.id,
        name: t.topic_name,
        category: t.category,
        businessImpact: t.business_impact_score || 3,
        stakeholderConcern: t.stakeholder_concern_score || 3,
        description: t.description
      }));
    }

    // Generate default topics based on industry
    return this.getDefaultMaterialTopics(industry);
  }

  private getDefaultMaterialTopics(industry?: string): any[] {
    // Industry-specific material topics
    const baseTopics = [
      { id: '1', name: 'Climate Change', category: 'environmental', businessImpact: 4, stakeholderConcern: 5 },
      { id: '2', name: 'Energy Management', category: 'environmental', businessImpact: 4, stakeholderConcern: 4 },
      { id: '3', name: 'Water Stewardship', category: 'environmental', businessImpact: 3, stakeholderConcern: 3 },
      { id: '4', name: 'Waste & Circular Economy', category: 'environmental', businessImpact: 3, stakeholderConcern: 3 },
      { id: '5', name: 'Employee Well-being', category: 'social', businessImpact: 4, stakeholderConcern: 4 },
      { id: '6', name: 'Diversity & Inclusion', category: 'social', businessImpact: 3, stakeholderConcern: 4 },
      { id: '7', name: 'Community Impact', category: 'social', businessImpact: 2, stakeholderConcern: 3 },
      { id: '8', name: 'Data Privacy', category: 'governance', businessImpact: 5, stakeholderConcern: 5 },
      { id: '9', name: 'Business Ethics', category: 'governance', businessImpact: 5, stakeholderConcern: 4 },
      { id: '10', name: 'Supply Chain Management', category: 'governance', businessImpact: 4, stakeholderConcern: 3 }
    ];

    // Add industry-specific topics
    if (industry === 'technology') {
      baseTopics.push(
        { id: '11', name: 'Digital Inclusion', category: 'social', businessImpact: 3, stakeholderConcern: 3 },
        { id: '12', name: 'AI Ethics', category: 'governance', businessImpact: 4, stakeholderConcern: 4 }
      );
    }

    return baseTopics;
  }

  private async saveMaterialityAssessment(organizationId: string, assessment: any): Promise<void> {
    // Save assessment
    const { error: assessmentError } = await this.supabase
      .from('materiality_assessments')
      .insert([{
        organization_id: organizationId,
        assessment_data: assessment,
        completed_at: assessment.completedAt,
        created_at: new Date().toISOString()
      }]);

    if (assessmentError) {
      console.error('Error saving assessment:', assessmentError);
      return;
    }

    // Update material topics
    for (const topic of assessment.topics) {
      await this.supabase
        .from('material_topics')
        .upsert({
          organization_id: organizationId,
          topic_name: topic.name,
          category: topic.category,
          business_impact_score: topic.businessImpact,
          stakeholder_concern_score: topic.stakeholderConcern,
          description: topic.description,
          updated_at: new Date().toISOString()
        });
    }
  }

  private async getESGHelp(organizationId: string): Promise<ConversationalESGResponse> {
    return {
      message: `I'm your ESG assistant. I can help you with:

• **📊 Track Emissions** - Upload bills or enter data manually
• **🎯 Set Targets** - Create science-based sustainability goals  
• **📈 Materiality Assessment** - Identify what matters most
• **📋 Compliance** - Track and report on frameworks
• **📁 Bulk Import** - Upload CSV/Excel data

What would you like to work on today?`,
      suggestions: [
        "Track our carbon emissions",
        "Create a materiality assessment",
        "Set a net zero target",
        "Check compliance status",
        "Import historical data"
      ]
    };
  }
}