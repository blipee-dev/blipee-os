/**
 * Comprehensive Prompt Library
 *
 * Organized collection of example prompts to help users discover
 * the full capabilities of the sustainability AI agent.
 */

export interface PromptExample {
  prompt: string;
  description?: string;
}

export interface PromptCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  prompts: PromptExample[];
}

export const PROMPT_LIBRARY: PromptCategory[] = [
  {
    id: 'emissions',
    name: 'Emissions & Carbon Footprint',
    icon: '📊',
    description: 'Track, analyze, and understand your carbon emissions',
    prompts: [
      { prompt: 'What are my total emissions this year?', description: 'Get a complete overview of your carbon footprint' },
      { prompt: 'Show me emissions breakdown by scope', description: 'View Scope 1, 2, and 3 emissions separately' },
      { prompt: 'Which facilities have the highest emissions?', description: 'Identify your largest emission sources' },
      { prompt: 'Compare emissions between Q1 and Q2', description: 'Track quarterly changes' },
      { prompt: 'What are my emissions per employee?', description: 'Calculate emissions intensity' },
      { prompt: 'Show me emissions by category', description: 'Break down by transport, energy, waste, etc.' },
      { prompt: 'What percentage of my emissions are from travel?', description: 'Analyze business travel impact' },
      { prompt: 'How do my emissions compare to last year?', description: 'Year-over-year comparison' },
      { prompt: 'What are my top 5 emission sources?', description: 'Prioritize reduction efforts' },
      { prompt: 'Calculate my carbon footprint per dollar of revenue', description: 'Financial intensity metrics' },
    ]
  },
  {
    id: 'sbti',
    name: 'Science Based Targets (SBTi)',
    icon: '🎯',
    description: 'Track progress toward 1.5°C aligned climate targets',
    prompts: [
      { prompt: 'How are we doing vs science based targets?', description: 'Full SBTi progress dashboard with forecasts' },
      { prompt: 'Are we on track to meet our 2030 targets?', description: 'Check 42% reduction milestone' },
      { prompt: 'What\'s our progress towards net-zero by 2050?', description: 'Long-term trajectory analysis' },
      { prompt: 'How much do we need to reduce emissions to meet SBTi targets?', description: 'Calculate the gap' },
      { prompt: 'What\'s our current reduction vs baseline?', description: 'Check progress percentage' },
      { prompt: 'Show me the gap between our projection and SBTi pathway', description: 'Identify shortfall' },
      { prompt: 'Will we achieve net-zero within SBTi guidelines?', description: 'Net-zero feasibility check' },
      { prompt: 'What\'s the maximum offset allowed under SBTi for net-zero?', description: 'Understand offset limits (max 10%)' },
      { prompt: 'Compare our trajectory to the 1.5°C pathway', description: 'Visual comparison' },
      { prompt: 'What actions do we need to take to stay on track?', description: 'Get reduction recommendations' },
    ]
  },
  {
    id: 'forecasting',
    name: 'Forecasting & Trends',
    icon: '📈',
    description: 'Predict future emissions and identify patterns',
    prompts: [
      { prompt: 'Forecast my emissions for next year', description: 'ML-powered annual forecast' },
      { prompt: 'What\'s the trend in my carbon footprint?', description: 'Identify if increasing or decreasing' },
      { prompt: 'Predict our carbon footprint for 2030', description: 'Long-term projection' },
      { prompt: 'When will we reach our reduction target at current rate?', description: 'Timeline estimation' },
      { prompt: 'What\'s our emissions trajectory if we continue as usual?', description: 'Business-as-usual scenario' },
      { prompt: 'Forecast Q4 emissions based on historical patterns', description: 'Seasonal forecasting' },
      { prompt: 'What\'s the confidence interval for next year\'s emissions?', description: 'Forecast uncertainty' },
      { prompt: 'How accurate were our previous forecasts?', description: 'Validate predictions' },
      { prompt: 'Show me monthly emissions trends', description: 'Identify seasonal patterns' },
      { prompt: 'What\'s our emission growth rate?', description: 'Calculate year-over-year growth' },
    ]
  },
  {
    id: 'energy',
    name: 'Energy & Renewables',
    icon: '🔋',
    description: 'Monitor energy consumption and renewable adoption',
    prompts: [
      { prompt: 'How much renewable energy are we using?', description: 'Total renewable energy consumption' },
      { prompt: 'What\'s our renewable energy percentage?', description: 'Share of renewables in energy mix' },
      { prompt: 'Compare fossil fuel vs renewable energy usage', description: 'Energy source breakdown' },
      { prompt: 'What\'s our progress towards 100% renewable energy?', description: 'Track RE100 commitment' },
      { prompt: 'How much energy did we consume this month?', description: 'Monthly energy tracking' },
      { prompt: 'Show me energy consumption by facility', description: 'Site-level analysis' },
      { prompt: 'What\'s our energy intensity per square foot?', description: 'Building efficiency metrics' },
      { prompt: 'How much would solar panels reduce our emissions?', description: 'Renewable energy impact' },
      { prompt: 'What\'s our electricity vs gas consumption split?', description: 'Energy type breakdown' },
      { prompt: 'Calculate ROI for switching to renewable energy', description: 'Financial analysis' },
    ]
  },
  {
    id: 'supply-chain',
    name: 'Supply Chain & Scope 3',
    icon: '🏭',
    description: 'Understand and reduce value chain emissions',
    prompts: [
      { prompt: 'What are my supply chain emissions?', description: 'Total Scope 3 emissions' },
      { prompt: 'Show me Scope 3 emissions breakdown', description: 'All 15 categories' },
      { prompt: 'Which suppliers have the highest carbon footprint?', description: 'Supplier emissions ranking' },
      { prompt: 'What percentage of emissions are from purchased goods?', description: 'Category 1 analysis' },
      { prompt: 'How much do business travel emissions contribute?', description: 'Category 6 tracking' },
      { prompt: 'What are our downstream emissions?', description: 'Categories 9-15 analysis' },
      { prompt: 'Compare upstream vs downstream Scope 3 emissions', description: 'Value chain split' },
      { prompt: 'Which Scope 3 categories should we prioritize?', description: 'Materiality assessment' },
      { prompt: 'What\'s our logistics and transportation footprint?', description: 'Category 4 & 9 emissions' },
      { prompt: 'How do employee commuting emissions compare to business travel?', description: 'Category 6 vs 7' },
    ]
  },
  {
    id: 'reporting',
    name: 'Reporting & Compliance',
    icon: '📋',
    description: 'Generate reports and track regulatory compliance',
    prompts: [
      { prompt: 'Generate a sustainability report', description: 'Comprehensive ESG report' },
      { prompt: 'Show me our CDP disclosure data', description: 'Climate disclosure metrics' },
      { prompt: 'What are our GHG Protocol emissions by category?', description: 'Standard categorization' },
      { prompt: 'Prepare data for our annual sustainability report', description: 'Year-end reporting' },
      { prompt: 'What metrics do we need for CSRD compliance?', description: 'EU regulatory requirements' },
      { prompt: 'Generate a carbon footprint summary for investors', description: 'Investor reporting' },
      { prompt: 'What\'s our TCFD climate risk disclosure status?', description: 'Financial disclosure' },
      { prompt: 'Show me our Scope 1+2+3 inventory', description: 'Complete GHG inventory' },
      { prompt: 'What are our key performance indicators?', description: 'Sustainability KPIs' },
      { prompt: 'Generate an executive summary of our climate progress', description: 'Leadership briefing' },
    ]
  },
  {
    id: 'analysis',
    name: 'Analysis & Insights',
    icon: '🔍',
    description: 'Deep dive into data and uncover insights',
    prompts: [
      { prompt: 'What are my biggest opportunities for emission reduction?', description: 'Prioritization analysis' },
      { prompt: 'Analyze the impact of our recent sustainability initiatives', description: 'Initiative effectiveness' },
      { prompt: 'What\'s driving the increase in emissions this quarter?', description: 'Root cause analysis' },
      { prompt: 'Compare our performance to industry benchmarks', description: 'Competitive analysis' },
      { prompt: 'What\'s the correlation between revenue and emissions?', description: 'Decoupling analysis' },
      { prompt: 'Identify anomalies in our emissions data', description: 'Data quality check' },
      { prompt: 'What seasonal patterns exist in our energy use?', description: 'Seasonal analysis' },
      { prompt: 'How effective was our remote work policy in reducing emissions?', description: 'Policy impact' },
      { prompt: 'What\'s the carbon intensity of each product line?', description: 'Product-level footprint' },
      { prompt: 'Calculate avoided emissions from our sustainability projects', description: 'Impact measurement' },
    ]
  },
  {
    id: 'reduction',
    name: 'Reduction Strategies',
    icon: '🌱',
    description: 'Plan and implement emission reduction initiatives',
    prompts: [
      { prompt: 'What actions can we take to reduce emissions by 20%?', description: 'Reduction roadmap' },
      { prompt: 'How much would electrifying our fleet reduce emissions?', description: 'Fleet transition impact' },
      { prompt: 'What\'s the ROI of LED lighting upgrades?', description: 'Energy efficiency ROI' },
      { prompt: 'Calculate savings from reducing business travel', description: 'Travel reduction impact' },
      { prompt: 'What\'s the cost per ton of CO2 reduced for each initiative?', description: 'Marginal abatement cost' },
      { prompt: 'Prioritize reduction projects by impact and cost', description: 'Abatement curve' },
      { prompt: 'How much can we reduce by optimizing HVAC systems?', description: 'Building optimization' },
      { prompt: 'What\'s the payback period for solar panel installation?', description: 'Renewable investment' },
      { prompt: 'Model the impact of supplier engagement programs', description: 'Scope 3 reduction' },
      { prompt: 'What quick wins can we achieve this quarter?', description: 'Low-hanging fruit' },
    ]
  },
  {
    id: 'offsetting',
    name: 'Offsets & Carbon Credits',
    icon: '🌍',
    description: 'Understand carbon offsetting and credits',
    prompts: [
      { prompt: 'How many carbon credits do we need to be carbon neutral?', description: 'Offset requirement' },
      { prompt: 'What\'s the cost to offset our remaining emissions?', description: 'Financial planning' },
      { prompt: 'What types of carbon credits should we purchase?', description: 'Quality guidance' },
      { prompt: 'Explain the difference between offsets and reductions', description: 'Education' },
      { prompt: 'What percentage of our footprint can we offset under SBTi?', description: 'Offset limits (max 10%)' },
      { prompt: 'What are high-quality carbon removal projects?', description: 'Project selection' },
      { prompt: 'How do nature-based vs technology-based offsets compare?', description: 'Offset types' },
      { prompt: 'What\'s our net emissions after planned offsets?', description: 'Net calculation' },
      { prompt: 'Is carbon neutral the same as net-zero?', description: 'Terminology clarification' },
      { prompt: 'What verification standards should our offsets meet?', description: 'Quality standards' },
    ]
  },
  {
    id: 'education',
    name: 'Education & Best Practices',
    icon: '📚',
    description: 'Learn about climate action and sustainability',
    prompts: [
      { prompt: 'Explain the GHG Protocol to me', description: 'Learn accounting standards' },
      { prompt: 'What are Science Based Targets?', description: 'Understand SBTi framework' },
      { prompt: 'What\'s the difference between Scope 1, 2, and 3?', description: 'Basic definitions' },
      { prompt: 'How do I calculate carbon footprint from electricity?', description: 'Calculation methodology' },
      { prompt: 'What are the 15 Scope 3 categories?', description: 'Category overview' },
      { prompt: 'Explain carbon neutrality vs net-zero', description: 'Key distinctions' },
      { prompt: 'What is a 1.5°C pathway?', description: 'Climate science basics' },
      { prompt: 'What are market-based vs location-based emissions?', description: 'Scope 2 accounting' },
      { prompt: 'How does carbon pricing work?', description: 'Carbon markets education' },
      { prompt: 'What are best practices for Scope 3 inventory?', description: 'Methodology guidance' },
    ]
  },
  {
    id: 'visualization',
    name: 'Charts & Visualizations',
    icon: '📊',
    description: 'Create visual representations of your data',
    prompts: [
      { prompt: 'Show me a chart of emissions over time', description: 'Time series visualization' },
      { prompt: 'Create a pie chart of emissions by scope', description: 'Scope breakdown' },
      { prompt: 'Visualize our progress toward targets', description: 'Target tracking chart' },
      { prompt: 'Show me a waterfall chart of emission changes', description: 'Change attribution' },
      { prompt: 'Create a heatmap of emissions by month and facility', description: 'Multi-dimensional view' },
      { prompt: 'Chart our renewable energy adoption over time', description: 'RE% trend' },
      { prompt: 'Show me a Sankey diagram of our carbon flows', description: 'Flow visualization' },
      { prompt: 'Visualize our abatement curve', description: 'Reduction opportunities' },
      { prompt: 'Create a dashboard of key sustainability metrics', description: 'KPI dashboard' },
      { prompt: 'Show me year-over-year comparison charts', description: 'Comparative analysis' },
    ]
  },
  {
    id: 'scenarios',
    name: 'Scenario Planning',
    icon: '🔮',
    description: 'Model different futures and what-if scenarios',
    prompts: [
      { prompt: 'What if we switch to 100% renewable energy?', description: 'Renewable scenario' },
      { prompt: 'Model impact of 50% reduction in business travel', description: 'Travel reduction scenario' },
      { prompt: 'What if we electrify our entire fleet by 2030?', description: 'Fleet electrification' },
      { prompt: 'Compare aggressive vs moderate reduction scenarios', description: 'Scenario comparison' },
      { prompt: 'What if we achieve 10% efficiency improvement annually?', description: 'Efficiency scenario' },
      { prompt: 'Model the impact of carbon pricing at $50/ton', description: 'Financial scenario' },
      { prompt: 'What if our supplier emissions increase by 20%?', description: 'Risk scenario' },
      { prompt: 'Show me best case, worst case, and likely case scenarios', description: 'Three-scenario analysis' },
      { prompt: 'What happens if we delay action until 2030?', description: 'Delay impact' },
      { prompt: 'Model achieving net-zero by 2040 vs 2050', description: 'Timeline scenarios' },
    ]
  }
];

/**
 * Get total number of prompts across all categories
 */
export function getTotalPromptCount(): number {
  return PROMPT_LIBRARY.reduce((total, category) => total + category.prompts.length, 0);
}

/**
 * Search prompts by keyword
 */
export function searchPrompts(query: string): Array<{ category: PromptCategory; prompt: PromptExample }> {
  const lowerQuery = query.toLowerCase();
  const results: Array<{ category: PromptCategory; prompt: PromptExample }> = [];

  PROMPT_LIBRARY.forEach(category => {
    category.prompts.forEach(prompt => {
      if (
        prompt.prompt.toLowerCase().includes(lowerQuery) ||
        prompt.description?.toLowerCase().includes(lowerQuery) ||
        category.name.toLowerCase().includes(lowerQuery)
      ) {
        results.push({ category, prompt });
      }
    });
  });

  return results;
}
