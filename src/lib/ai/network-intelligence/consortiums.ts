import { createClient } from '@supabase/supabase-js';

interface ConsortiumMember {
  organizationId: string;
  role: 'leader' | 'member' | 'observer';
  joinedAt: Date;
  contributionLevel: number;
}

interface CollaborativeInitiative {
  id: string;
  name: string;
  description: string;
  goals: string[];
  timeline: {
    start: Date;
    end: Date;
    milestones: { date: Date; description: string }[];
  };
  participants: string[];
  progress: number;
}

export class IndustryConsortium {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  /**
   * Create or join industry consortium
   */
  async createConsortium(
    name: string,
    industry: string,
    mission: string,
    foundingMembers: string[]
  ): Promise<string> {
    try {
      const { data: consortium, error } = await this.supabase
        .from('industry_consortiums')
        .insert({
          name,
          industry,
          mission,
          founding_members: foundingMembers,
          created_at: new Date(),
          active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Add founding members
      const members = foundingMembers.map(memberId => ({
        consortium_id: consortium.id,
        organization_id: memberId,
        role: memberId === foundingMembers[0] ? 'leader' : 'member',
        joined_at: new Date()
      }));

      await this.supabase
        .from('consortium_members')
        .insert(members);

      return consortium.id;

    } catch (error) {
      console.error('Error creating consortium:', error);
      throw error;
    }
  }

  /**
   * Coordinate collective action
   */
  async launchInitiative(
    consortiumId: string,
    initiative: Omit<CollaborativeInitiative, 'id' | 'progress'>
  ): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('collaborative_initiatives')
        .insert({
          consortium_id: consortiumId,
          name: initiative.name,
          description: initiative.description,
          goals: initiative.goals,
          timeline: initiative.timeline,
          participants: initiative.participants,
          progress: 0,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      return data.id;

    } catch (error) {
      console.error('Error launching initiative:', error);
      throw error;
    }
  }

  /**
   * Share best practices within consortium
   */
  async shareBestPractice(
    consortiumId: string,
    organizationId: string,
    practice: {
      title: string;
      description: string;
      category: string;
      results: any;
      implementation: string;
    }
  ): Promise<void> {
    try {
      await this.supabase
        .from('consortium_best_practices')
        .insert({
          consortium_id: consortiumId,
          contributor_id: organizationId,
          title: practice.title,
          description: practice.description,
          category: practice.category,
          results: practice.results,
          implementation_guide: practice.implementation,
          shared_at: new Date()
        });

      // Award reputation points
      await this.updateMemberReputation(consortiumId, organizationId, 10);

    } catch (error) {
      console.error('Error sharing best practice:', error);
      throw error;
    }
  }

  /**
   * Coordinate industry-wide goals
   */
  async setCollectiveTarget(
    consortiumId: string,
    target: {
      metric: string;
      baseline: number;
      target: number;
      deadline: Date;
    }
  ): Promise<void> {
    try {
      await this.supabase
        .from('consortium_targets')
        .insert({
          consortium_id: consortiumId,
          metric: target.metric,
          baseline_value: target.baseline,
          target_value: target.target,
          deadline: target.deadline,
          created_at: new Date()
        });

    } catch (error) {
      console.error('Error setting collective target:', error);
      throw error;
    }
  }

  /**
   * Track collective progress
   */
  async getCollectiveProgress(consortiumId: string): Promise<{
    targets: any[];
    aggregateMetrics: Record<string, number>;
    participation: number;
  }> {
    try {
      // Get targets
      const { data: targets } = await this.supabase
        .from('consortium_targets')
        .select('*')
        .eq('consortium_id', consortiumId);

      // Get member metrics
      const { data: members } = await this.supabase
        .from('consortium_members')
        .select('organization_id')
        .eq('consortium_id', consortiumId);

      const memberIds = members?.map(m => m.organization_id) || [];

      // Aggregate metrics
      const aggregateMetrics: Record<string, number> = {};
      
      for (const target of targets || []) {
        const { data: metrics } = await this.supabase
          .from('organizations')
          .select(`metrics->${target.metric}`)
          .in('id', memberIds);

        const values = metrics?.map(m => m.metrics?.[target.metric] || 0) || [];
        aggregateMetrics[target.metric] = values.reduce((sum, v) => sum + v, 0) / values.length;
      }

      return {
        targets: targets || [],
        aggregateMetrics,
        participation: memberIds.length
      };

    } catch (error) {
      console.error('Error getting collective progress:', error);
      throw error;
    }
  }

  private async updateMemberReputation(
    consortiumId: string,
    organizationId: string,
    points: number
  ): Promise<void> {
    await this.supabase.rpc('update_consortium_reputation', {
      p_consortium_id: consortiumId,
      p_organization_id: organizationId,
      p_points: points
    });
  }
}