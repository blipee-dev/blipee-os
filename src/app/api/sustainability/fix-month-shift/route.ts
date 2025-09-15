import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if super admin
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!superAdmin) {
      return NextResponse.json({ error: 'Only super admins can run this migration' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get('dryRun') !== 'false'; // Default to dry run

    // Get all metrics data that needs to be fixed
    // This includes all entries where the month in period_start doesn't match the intended month
    const { data: affectedData, error: fetchError } = await supabase
      .from('metrics_data')
      .select('*')
      .order('period_start', { ascending: true });

    if (fetchError) {
      console.error('Error fetching metrics data:', fetchError);
      throw fetchError;
    }

    const updates = [];
    const issues = [];

    affectedData?.forEach(entry => {
      const periodStart = new Date(entry.period_start);
      const periodEnd = new Date(entry.period_end);
      
      const startMonth = periodStart.getMonth(); // 0-11
      const startDay = periodStart.getDate();
      const endMonth = periodEnd.getMonth();
      
      // Check if this entry needs fixing
      // The pattern is: start date is at the end of a month, end date is in the next month
      // This should be shifted to be fully within the end date's month
      
      if (startDay > 28 && endMonth === (startMonth + 1) % 12) {
        // This entry spans two months and needs to be fixed
        const targetMonth = endMonth; // The month it should belong to
        const targetYear = periodEnd.getFullYear();
        
        // Calculate new dates - full month
        const newPeriodStart = new Date(targetYear, targetMonth, 1);
        const newPeriodEnd = new Date(targetYear, targetMonth + 1, 0); // Last day of month
        
        updates.push({
          id: entry.id,
          original: {
            period_start: entry.period_start,
            period_end: entry.period_end
          },
          updated: {
            period_start: newPeriodStart.toISOString(),
            period_end: newPeriodEnd.toISOString()
          },
          metric: entry.metric_id,
          site: entry.site_id
        });
      } else if (startMonth === endMonth && startDay === 1) {
        // This entry is already correct (starts on 1st, ends in same month)
        // No action needed
      } else {
        // Flag any other patterns as potential issues
        issues.push({
          id: entry.id,
          period_start: entry.period_start,
          period_end: entry.period_end,
          reason: 'Unexpected date pattern'
        });
      }
    });

    if (!dryRun && updates.length > 0) {
      // Execute the updates
      const updatePromises = updates.map(update =>
        supabase
          .from('metrics_data')
          .update({
            period_start: update.updated.period_start,
            period_end: update.updated.period_end
          })
          .eq('id', update.id)
      );

      const results = await Promise.all(updatePromises);
      const errors = results.filter(r => r.error).map(r => r.error);

      if (errors.length > 0) {
        console.error('Errors during update:', errors);
        return NextResponse.json({
          success: false,
          message: 'Some updates failed',
          errors,
          summary: {
            totalToUpdate: updates.length,
            successfulUpdates: updates.length - errors.length,
            failedUpdates: errors.length
          }
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully updated ${updates.length} entries`,
        summary: {
          totalUpdated: updates.length,
          issues: issues.length
        },
        issues
      });
    }

    // Dry run - return what would be updated
    return NextResponse.json({
      dryRun: true,
      message: `Found ${updates.length} entries that need updating`,
      summary: {
        totalToUpdate: updates.length,
        issuesFound: issues.length,
        totalRecords: affectedData?.length || 0
      },
      sampleUpdates: updates.slice(0, 10), // Show first 10 as examples
      issues: issues.slice(0, 10) // Show first 10 issues
    });

  } catch (error: any) {
    console.error('Month shift migration error:', error);
    return NextResponse.json(
      { error: 'Failed to process month shift migration', details: error.message },
      { status: 500 }
    );
  }
}