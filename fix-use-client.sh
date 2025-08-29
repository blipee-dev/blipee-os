#!/bin/bash

echo "Fixing 'use client' directive placement..."

# Fix OrganizationSwitcher
cat > /tmp/org_switcher.tmp << 'EOF'
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, ChevronDown, Users, Check, CreditCard } from "lucide-react";
EOF
tail -n +5 src/components/OrganizationSwitcher.tsx >> /tmp/org_switcher.tmp
mv /tmp/org_switcher.tmp src/components/OrganizationSwitcher.tsx

# Fix MessageSuggestions
cat > /tmp/msg_suggest.tmp << 'EOF'
"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
EOF
tail -n +5 src/components/blipee-os/MessageSuggestions.tsx >> /tmp/msg_suggest.tmp
mv /tmp/msg_suggest.tmp src/components/blipee-os/MessageSuggestions.tsx

# Fix SuggestedQueries
cat > /tmp/sugg_queries.tmp << 'EOF'
"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
EOF
tail -n +5 src/components/blipee-os/SuggestedQueries.tsx >> /tmp/sugg_queries.tmp
mv /tmp/sugg_queries.tmp src/components/blipee-os/SuggestedQueries.tsx

# Fix EnhancedChartComponent
cat > /tmp/chart_comp.tmp << 'EOF'
"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { TrendingUp, TrendingDown } from "lucide-react";
EOF
tail -n +5 src/components/dynamic/EnhancedChartComponent.tsx >> /tmp/chart_comp.tmp
mv /tmp/chart_comp.tmp src/components/dynamic/EnhancedChartComponent.tsx

# Fix ReportComponent
cat > /tmp/report_comp.tmp << 'EOF'
"use client";

import { TrendingUp, TrendingDown, Minus, Download } from "lucide-react";
EOF
tail -n +4 src/components/dynamic/ReportComponent.tsx >> /tmp/report_comp.tmp
mv /tmp/report_comp.tmp src/components/dynamic/ReportComponent.tsx

# Fix ConversationalOnboarding
cat > /tmp/conv_onboard.tmp << 'EOF'
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Sparkles, CheckCircle, ChevronRight } from "lucide-react";
EOF
tail -n +6 src/components/onboarding/ConversationalOnboarding.tsx >> /tmp/conv_onboard.tmp
mv /tmp/conv_onboard.tmp src/components/onboarding/ConversationalOnboarding.tsx

echo "'use client' directives fixed!"