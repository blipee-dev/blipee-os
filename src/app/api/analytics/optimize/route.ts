import { NextResponse } from 'next/server';
import { OptimizationEngine } from '@/lib/analytics/optimization/OptimizationEngine';
import { AnalyticsService } from '@/lib/analytics/AnalyticsService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data, config = {} } = body;

    const optimizationEngine = new OptimizationEngine();

    let result;

    switch (type) {
      case 'multi-objective':
        // Multi-objective optimization
        const { variables, objectives, constraints } = data;

        if (!variables || !objectives) {
          return NextResponse.json(
            { success: false, error: 'Variables and objectives required' },
            { status: 400 }
          );
        }

        result = await optimizationEngine.optimize(
          variables,
          objectives.map((obj: any) => ({
            ...obj,
            function: new Function('variables', obj.function || 'return 0')
          })),
          constraints?.map((c: any) => ({
            ...c,
            function: new Function('variables', c.function || 'return 0')
          })),
          config
        );
        break;

      case 'resource-allocation':
        // Resource allocation optimization
        const { resources, demands, objective } = data;

        if (!resources || !demands) {
          return NextResponse.json(
            { success: false, error: 'Resources and demands required' },
            { status: 400 }
          );
        }

        result = optimizationEngine.allocateResources(
          resources,
          demands,
          objective || 'maximize-value'
        );
        break;

      case 'schedule':
        // Schedule optimization
        const { tasks, resourcesAvailable, scheduleObjective } = data;

        if (!tasks || !resourcesAvailable) {
          return NextResponse.json(
            { success: false, error: 'Tasks and resources required' },
            { status: 400 }
          );
        }

        result = optimizationEngine.optimizeSchedule(
          tasks,
          resourcesAvailable,
          scheduleObjective || 'minimize-time'
        );
        break;

      case 'sustainability':
        // Sustainability optimization
        const { organizationId, targets } = data;

        if (!organizationId || !targets) {
          return NextResponse.json(
            { success: false, error: 'Organization ID and targets required' },
            { status: 400 }
          );
        }

        const analyticsService = new AnalyticsService();
        result = await analyticsService.optimizeSustainability(
          organizationId,
          targets
        );
        break;

      case 'pareto':
        // Pareto optimization
        const { solutions, objectiveTypes } = data;

        if (!solutions || !objectiveTypes) {
          return NextResponse.json(
            { success: false, error: 'Solutions and objective types required' },
            { status: 400 }
          );
        }

        result = optimizationEngine.findParetoFront(solutions, objectiveTypes);
        break;

      case 'constraint-satisfaction':
        // CSP solving
        const { cspVariables, cspConstraints } = data;

        if (!cspVariables || !cspConstraints) {
          return NextResponse.json(
            { success: false, error: 'Variables and constraints required' },
            { status: 400 }
          );
        }

        result = optimizationEngine.solveCSP(
          cspVariables,
          cspConstraints.map((c: any) => ({
            ...c,
            check: new Function('values', c.check || 'return true')
          }))
        );
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown optimization type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type,
      result,
      metadata: {
        timestamp: new Date().toISOString(),
        config
      }
    });
  } catch (error) {
    console.error('Optimization error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Optimization failed'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for optimization templates
export async function GET() {
  const templates = {
    'emissions-optimization': {
      name: 'Emissions Reduction Optimization',
      variables: [
        { name: 'renewable_percentage', min: 0, max: 100, initial: 30 },
        { name: 'energy_efficiency', min: 50, max: 100, initial: 70 },
        { name: 'carbon_capture', min: 0, max: 50, initial: 10 },
        { name: 'electrification', min: 0, max: 100, initial: 40 }
      ],
      objectives: [
        {
          name: 'minimize_emissions',
          target: 'minimize',
          weight: 0.5,
          function: 'return (100 - variables.renewable_percentage) * 10 + (100 - variables.energy_efficiency) * 5 + (50 - variables.carbon_capture) * 8'
        },
        {
          name: 'minimize_cost',
          target: 'minimize',
          weight: 0.3,
          function: 'return variables.renewable_percentage * 1000 + variables.energy_efficiency * 500 + variables.carbon_capture * 2000'
        },
        {
          name: 'maximize_reliability',
          target: 'maximize',
          weight: 0.2,
          function: 'return variables.energy_efficiency * 0.5 + (100 - variables.renewable_percentage) * 0.3'
        }
      ],
      constraints: [
        {
          name: 'budget_limit',
          type: 'inequality',
          function: 'return variables.renewable_percentage * 1000 + variables.carbon_capture * 2000',
          value: 100000
        },
        {
          name: 'minimum_renewable',
          type: 'inequality',
          function: 'return -variables.renewable_percentage',
          value: -20
        }
      ]
    },
    'resource-allocation': {
      name: 'Resource Allocation Template',
      resources: [
        { name: 'budget', available: 1000000, cost: 1 },
        { name: 'personnel', available: 100, cost: 500 },
        { name: 'equipment', available: 50, cost: 1000 }
      ],
      demands: [
        { name: 'Project A', requirements: { budget: 200000, personnel: 20, equipment: 10 }, value: 500000 },
        { name: 'Project B', requirements: { budget: 150000, personnel: 15, equipment: 5 }, value: 350000 },
        { name: 'Project C', requirements: { budget: 300000, personnel: 30, equipment: 15 }, value: 600000 }
      ]
    },
    'schedule-optimization': {
      name: 'Project Schedule Optimization',
      tasks: [
        { id: 'task1', name: 'Planning', duration: 5, resourceRequirements: { personnel: 2 }, dependencies: [], priority: 1 },
        { id: 'task2', name: 'Design', duration: 10, resourceRequirements: { personnel: 3 }, dependencies: ['task1'], priority: 2 },
        { id: 'task3', name: 'Implementation', duration: 20, resourceRequirements: { personnel: 5 }, dependencies: ['task2'], priority: 3 },
        { id: 'task4', name: 'Testing', duration: 8, resourceRequirements: { personnel: 2 }, dependencies: ['task3'], priority: 4 },
        { id: 'task5', name: 'Deployment', duration: 3, resourceRequirements: { personnel: 4 }, dependencies: ['task4'], priority: 5 }
      ],
      resources: { personnel: 10, equipment: 5 }
    }
  };

  return NextResponse.json({
    success: true,
    templates,
    availableTypes: [
      'multi-objective',
      'resource-allocation',
      'schedule',
      'sustainability',
      'pareto',
      'constraint-satisfaction'
    ],
    algorithms: [
      'genetic-algorithm',
      'linear-programming',
      'critical-path-method',
      'constraint-satisfaction'
    ]
  });
}