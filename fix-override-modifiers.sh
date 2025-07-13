#!/bin/bash

# Fix override modifiers in autonomous agents
sed -i 's/protected capabilities: AgentCapability\[\]/protected override capabilities: AgentCapability[]/g' src/lib/ai/autonomous-agents/compliance-guardian.ts
sed -i 's/async getDescription()/override async getDescription()/g' src/lib/ai/autonomous-agents/cost-saving-finder.ts
sed -i 's/async getDescription()/override async getDescription()/g' src/lib/ai/autonomous-agents/predictive-maintenance.ts
sed -i 's/async getDescription()/override async getDescription()/g' src/lib/ai/autonomous-agents/self-improvement-loops.ts
sed -i 's/async getDescription()/override async getDescription()/g' src/lib/ai/autonomous-agents/supply-chain-investigator.ts
sed -i 's/async getDescription()/override async getDescription()/g' src/lib/ai/autonomous-agents/swarm-intelligence.ts

# Fix override modifiers in ML models
sed -i 's/protected modelVersion =/protected override modelVersion =/g' src/lib/ai/ml-models/base/timeseries-model.ts
sed -i 's/buildModel(): Promise<void>/override buildModel(): Promise<void>/g' src/lib/ai/ml-models/benchmarks/production-benchmarks.ts
sed -i 's/train(data: TrainingData): Promise<TrainingResult>/override train(data: TrainingData): Promise<TrainingResult>/g' src/lib/ai/ml-models/benchmarks/production-benchmarks.ts

echo "Fixed override modifiers"