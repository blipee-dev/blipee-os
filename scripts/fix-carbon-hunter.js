const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, '..', 'src', 'lib', 'ai', 'autonomous-agents', 'carbon-hunter.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the remaining action objects that don't have impact and reversible
const actionPatterns = [
  {
    old: `actions.push({
          type: 'quick_win_identified',
          description: \`Quick win opportunity: \${opportunity.title}\`,
          opportunityId: opportunity.id,
          paybackPeriod: opportunity.paybackPeriod,
          timestamp: new Date().toISOString()
        });`,
    new: `actions.push({
          type: 'quick_win_identified',
          description: \`Quick win opportunity: \${opportunity.title}\`,
          impact: {
            opportunityId: opportunity.id,
            paybackPeriod: opportunity.paybackPeriod
          },
          reversible: true
        });`
  },
  {
    old: `actions.push({
        type: 'critical_anomaly_detected',
        description: \`Critical emission anomaly in \${anomaly.source}\`,
        anomalyId: anomaly.id,
        severity: anomaly.severity,
        deviation: anomaly.deviation_percentage,
        location: anomaly.location,
        timestamp: new Date().toISOString()
      });`,
    new: `actions.push({
        type: 'critical_anomaly_detected',
        description: \`Critical emission anomaly in \${anomaly.source}\`,
        impact: {
          anomalyId: anomaly.id,
          severity: anomaly.severity,
          deviation: anomaly.deviation_percentage,
          location: anomaly.location
        },
        reversible: false
      });`
  },
  {
    old: `actions.push({
          type: 'auto_investigation_initiated',
          description: \`Initiated automatic investigation for \${anomaly.source} anomaly\`,
          anomalyId: anomaly.id,
          timestamp: new Date().toISOString()
        });`,
    new: `actions.push({
          type: 'auto_investigation_initiated',
          description: \`Initiated automatic investigation for \${anomaly.source} anomaly\`,
          impact: {
            anomalyId: anomaly.id,
            investigationStarted: true
          },
          reversible: true
        });`
  },
  {
    old: `actions.push({
          type: 'trend_opportunity_identified',
          description: insight.title,
          insightId: insight.id,
          opportunities: insight.related_opportunities,
          confidence: insight.confidence,
          timestamp: new Date().toISOString()
        });`,
    new: `actions.push({
          type: 'trend_opportunity_identified',
          description: insight.title,
          impact: {
            insightId: insight.id,
            opportunities: insight.related_opportunities,
            confidence: insight.confidence
          },
          reversible: true
        });`
  },
  {
    old: `actions.push({
        type: 'optimization_recommended',
        description: optimization.description,
        optimizationId: optimization.id,
        estimatedReduction: optimization.estimated_reduction,
        estimatedCost: optimization.estimated_cost,
        roi: optimization.roi || 0,
        timestamp: new Date().toISOString()
      });`,
    new: `actions.push({
        type: 'optimization_recommended',
        description: optimization.description,
        impact: {
          optimizationId: optimization.id,
          estimatedReduction: optimization.estimated_reduction,
          estimatedCost: optimization.estimated_cost,
          roi: optimization.roi || 0
        },
        reversible: true
      });`
  },
  {
    old: `actions.push({
          type: 'target_risk_identified',
          description: 'Current trajectory will exceed emission targets',
          gap: forecastVsTarget.gap,
          risk_level: forecastVsTarget.risk_level,
          timestamp: new Date().toISOString()
        });`,
    new: `actions.push({
          type: 'target_risk_identified',
          description: 'Current trajectory will exceed emission targets',
          impact: {
            gap: forecastVsTarget.gap,
            risk_level: forecastVsTarget.risk_level
          },
          reversible: false
        });`
  },
  {
    old: `actions.push({
          type: 'improvement_opportunity_identified',
          description: \`Below-average performance in \${metric}\`,
          metric: metric,
          current_value: result.current_value,
          benchmark_value: result.benchmark_value,
          gap: result.gap,
          timestamp: new Date().toISOString()
        });`,
    new: `actions.push({
          type: 'improvement_opportunity_identified',
          description: \`Below-average performance in \${metric}\`,
          impact: {
            metric: metric,
            current_value: result.current_value,
            benchmark_value: result.benchmark_value,
            gap: result.gap
          },
          reversible: false
        });`
  },
  {
    old: `actions.push({
          type: 'best_practice_identified',
          description: \`Top quartile performance in \${metric}\`,
          metric: metric,
          value: result.current_value,
          timestamp: new Date().toISOString()
        });`,
    new: `actions.push({
          type: 'best_practice_identified',
          description: \`Top quartile performance in \${metric}\`,
          impact: {
            metric: metric,
            value: result.current_value
          },
          reversible: false
        });`
  }
];

// Apply all replacements
actionPatterns.forEach(pattern => {
  content = content.replace(pattern.old, pattern.new);
});

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed all action objects in carbon-hunter.ts');