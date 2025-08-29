#!/bin/bash

echo "Fixing missing icon imports..."

# Fix signin page
sed -i '' 's/import { } from "lucide-react";/import { AlertCircle, Mail, Lock, EyeOff, Eye, Loader2, Building2 } from "lucide-react";/' src/app/signin/page.tsx

# Fix OrganizationSwitcher
sed -i '' '1s/^/import { Building2, ChevronDown, Users, Check, CreditCard } from "lucide-react";\n/' src/components/OrganizationSwitcher.tsx

# Fix MessageSuggestions
sed -i '' '1s/^/import { Sparkles, ArrowRight } from "lucide-react";\n/' src/components/blipee-os/MessageSuggestions.tsx

# Fix SuggestedQueries
sed -i '' '1s/^/import { Sparkles, ArrowRight } from "lucide-react";\n/' src/components/blipee-os/SuggestedQueries.tsx

# Fix EnhancedChartComponent
sed -i '' '1s/^/import { TrendingUp, TrendingDown } from "lucide-react";\n/' src/components/dynamic/EnhancedChartComponent.tsx

# Fix ReportComponent
sed -i '' '1s/^/import { TrendingUp, TrendingDown, Minus, Download } from "lucide-react";\n/' src/components/dynamic/ReportComponent.tsx

# Fix ConversationalOnboarding
sed -i '' '1s/^/import { Clock, Sparkles, CheckCircle, ChevronRight } from "lucide-react";\n/' src/components/onboarding/ConversationalOnboarding.tsx

echo "Icon imports fixed!"