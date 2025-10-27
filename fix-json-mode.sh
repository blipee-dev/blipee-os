#!/bin/bash

# Fix all aiStub.complete calls that use jsonMode: true without "json" in prompt

files=(
  "src/lib/ai/autonomous-agents/agents/RegulatoryForesight.ts"
  "src/lib/ai/autonomous-agents/agents/PredictiveMaintenance.ts"
  "src/lib/ai/autonomous-agents/agents/CostSavingFinder.ts"
  "src/lib/ai/autonomous-agents/agents/ComplianceGuardian.ts"
  "src/lib/ai/autonomous-agents/agents/CarbonHunter.ts"
  "src/lib/ai/autonomous-agents/agents/SupplyChainInvestigator.ts"
  "src/lib/ai/autonomous-agents/agents/EsgChiefOfStaff.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    # Use sed to add "Return your analysis as JSON." before jsonMode: true
    # But only if the line before doesn't already contain "JSON" or "json"
    perl -i -pe '
      if (/jsonMode: true/ && $prev !~ /json/i && $prev !~ /\breturn your analysis as json\b/i) {
        # Get the previous line and add JSON instruction
        $prev =~ s/(["'\''])\s*,?\s*$/. Return your analysis as JSON.$1,/;
        $_ = $prev . $_;
        $prev = "";
        next;
      }
      if (/^\s*await aiStub\.complete\(/ || /^\s*const \w+ = await aiStub\.complete\(/) {
        $in_aiStub = 1;
        $ai_lines = $_;
        $prev = "";
        next;
      }
      if ($in_aiStub) {
        $ai_lines .= $_;
        if (/^\s*\);?\s*$/) {
          # End of aiStub call
          if ($ai_lines =~ /jsonMode:\s*true/ && $ai_lines !~ /json/i) {
            # Need to add JSON instruction
            $ai_lines =~ s/(["`'\''])\s*,?\s*\n(\s*)TaskType/. Return your analysis as JSON.$1,\n$2TaskType/;
          }
          $_ = $ai_lines;
          $in_aiStub = 0;
        } else {
          $_ = "";
        }
      }
      $prev = $_;
    ' "$file"
  fi
done

echo "Done!"
