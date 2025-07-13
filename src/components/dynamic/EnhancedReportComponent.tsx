"use client";

import { useState } from "react";
import { motion as _motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Download,
  Share2,
  Printer,
  ChevronRight,
  TrendingDown,

  Award,
  Calendar,
  BarChart3,
  Sparkles,
  Eye,
  Send,
  Check,
} from "lucide-react";

interface EnhancedReportComponentProps {
  title?: string;
  subtitle?: string;
  sections?: Array<{
    title: string;
    content: string;
    icon?: any;
    highlight?: boolean;
    metrics?: Array<{ label: string; value: string; trend?: "up" | "down" }>;
  }>;
  metadata?: {
    period?: string;
    generated?: Date;
    author?: string;
    status?: "draft" | "final" | "archived";
  };
  interactive?: boolean;
}

export function EnhancedReportComponent({
  title = "Sustainability Impact Report",
  subtitle = "Comprehensive analysis of your environmental performance",
  sections = [],
  metadata = {
    period: "Q4 2024",
    generated: new Date(),
    author: "blipee AI",
    status: "final",
  },
  interactive = true,
}: EnhancedReportComponentProps) {
  const [expandedSection, setExpandedSection] = useState<number | null>(0);
  const [isSharing, setIsSharing] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "full">("preview");

  const defaultSections = [
    {
      title: "Executive Summary",
      icon: FileText,
      highlight: true,
      content: `This quarter represents a pivotal moment in our sustainability journey. We've achieved a remarkable 15% reduction in total emissions while maintaining operational excellence across all facilities.

Key achievements include completing our solar panel installation project, implementing AI-driven HVAC optimization, and establishing new partnerships with verified carbon offset providers. These initiatives have positioned us ahead of our 2030 net-zero targets.`,
      metrics: [
        { label: "Total Reduction", value: "15%", trend: "down" },
        { label: "Cost Savings", value: "$284K", trend: "up" },
        { label: "Target Progress", value: "68%", trend: "up" },
      ],
    },
    {
      title: "Environmental Impact",
      icon: TrendingDown,
      content: `Our comprehensive approach to environmental stewardship has yielded significant results:

• **Scope 1 & 2 Emissions**: Reduced by 18% through energy efficiency measures and renewable energy adoption
• **Scope 3 Emissions**: 12% reduction achieved via supply chain optimization and employee commute programs
• **Water Conservation**: Saved 1.2 million gallons through smart irrigation and fixture upgrades
• **Waste Diversion**: Achieved 78% diversion rate, exceeding our 75% target
• **Biodiversity**: Planted 500 native trees and created 3 pollinator gardens`,
      metrics: [
        { label: "CO₂ Reduced", value: "2,450 tons", trend: "down" },
        { label: "Energy Saved", value: "45%", trend: "up" },
        { label: "Water Saved", value: "1.2M gal", trend: "down" },
      ],
    },
    {
      title: "Strategic Initiatives",
      icon: CheckCircle,
      content: `Our strategic sustainability initiatives are driving transformative change:

**1. Renewable Energy Transition**
   - Solar capacity increased to 2.5 MW
   - Wind power purchase agreement signed for 5 MW
   - Battery storage system installation begun

**2. Circular Economy Implementation**
   - Zero waste to landfill achieved in 3 facilities
   - Product take-back program launched
   - Packaging redesigned for 100% recyclability

**3. Supply Chain Transformation**
   - 65% of suppliers committed to SBTi targets
   - Sustainable sourcing policy implemented
   - Supplier sustainability scorecard deployed`,
    },
    {
      title: "Performance Metrics",
      icon: BarChart3,
      content: `Detailed performance across all sustainability KPIs:

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| GHG Intensity | -10% | -15% | ✅ Exceeded |
| Renewable Energy | 60% | 65% | ✅ Exceeded |
| Water Intensity | -8% | -12% | ✅ Exceeded |
| Waste Diversion | 75% | 78% | ✅ Exceeded |
| Supplier Engagement | 50% | 65% | ✅ Exceeded |

All primary sustainability targets have been met or exceeded, demonstrating the effectiveness of our integrated approach.`,
    },
    {
      title: "Recognition & Awards",
      icon: Award,
      highlight: true,
      content: `Our sustainability leadership has earned significant recognition:

🏆 **CDP Climate A-List** - Recognized for climate leadership and transparency
🏆 **ENERGY STAR Partner of the Year** - Excellence in energy management
🏆 **Zero Waste Gold Certification** - Achieved at headquarters facility
🏆 **EcoVadis Platinum Medal** - Top 1% sustainability performance
🏆 **LEED Platinum Certification** - New innovation center

These achievements reflect our commitment to setting industry benchmarks in sustainability.`,
    },
    {
      title: "Future Outlook",
      icon: Calendar,
      content: `Looking ahead to 2025, we're positioned to accelerate our sustainability impact:

**Q1 2025 Priorities:**
1. Launch Scope 3 supplier engagement platform
2. Complete EV fleet transition (50% target)
3. Implement regenerative agriculture pilot
4. Deploy AI-powered energy optimization system

**Annual Goals:**
• Achieve 25% absolute emissions reduction
• Reach 80% renewable energy
• Establish nature-positive operations
• Launch sustainable product innovation lab

With continued focus and innovation, we're confident in achieving our ambitious 2030 net-zero commitment ahead of schedule.`,
    },
  ];

  const displaySections = sections.length > 0 ? sections : defaultSections;

  const handleShare = async () => {
    setIsSharing(true);
    // Simulate sharing action
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSharing(false);
  };

  const SectionCard = ({ section, index }: { section: any; index: number }) => {
    const Icon = section.icon || FileText;
    const isExpanded = expandedSection === index;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className={`relative ${section.highlight ? "ring-2 ring-purple-500/30" : ""}`}
      >
        {section.highlight && (
          <div className="absolute -top-3 -right-3 z-10">
            <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
          </div>
        )}

        <motion.div
          whileHover={{ scale: 1.01 }}
          className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden"
        >
          <button
            onClick={() => setExpandedSection(isExpanded ? null : index)}
            className="w-full p-6 text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-xl bg-gradient-to-br ${
                    section.highlight
                      ? "from-purple-500/20 to-pink-500/20"
                      : "from-purple-500/10 to-pink-500/10"
                  }`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {section.title}
                  </h3>
                  {section.metrics && (
                    <div className="flex gap-4 mt-1">
                      {section.metrics.map((metric: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center gap-1 text-xs"
                        >
                          <span className="text-white/40">{metric.label}:</span>
                          <span
                            className={`font-semibold ${
                              metric.trend === "down"
                                ? "text-green-400"
                                : "text-purple-400"
                            }`}
                          >
                            {metric.value}
                          </span>
                          {metric.trend && (
                            <TrendingDown
                              className={`w-3 h-3 ${
                                metric.trend === "down"
                                  ? "text-green-400"
                                  : "text-purple-400"
                              }`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-5 h-5 text-white/40" />
              </motion.div>
            </div>
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-white/[0.05]"
              >
                <div className="p-6">
                  <div
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: section.content
                        .replace(
                          /\*\*(.*?)\*\*/g,
                          '<strong class="text-purple-400">$1</strong>',
                        )
                        .replace(/\n/g, "<br />")
                        .replace(/•/g, '<span class="text-purple-400">•</span>')
                        .replace(/🏆/g, '<span class="text-2xl">🏆</span>')
                        .replace(
                          /✅/g,
                          '<span class="text-green-400">✅</span>',
                        ),
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] rounded-2xl p-8 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
              {title}
            </h2>
            <p className="text-white/60">{subtitle}</p>

            {/* Metadata */}
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2 text-white/40">
                <Calendar className="w-4 h-4" />
                <span>{metadata.period}</span>
              </div>
              <div className="flex items-center gap-2 text-white/40">
                <FileText className="w-4 h-4" />
                <span>
                  Generated {metadata.generated?.toLocaleDateString()}
                </span>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  metadata.status === "final"
                    ? "bg-green-500/20 text-green-400"
                    : metadata.status === "draft"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {metadata.status?.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                setViewMode(viewMode === "preview" ? "full" : "preview")
              }
              className="p-2 hover:bg-white/5 rounded-lg transition-colors group"
            >
              <Eye className="w-5 h-5 text-white/60 group-hover:text-white" />
            </button>
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors group">
              <Printer className="w-5 h-5 text-white/60 group-hover:text-white" />
            </button>
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors group">
              <Download className="w-5 h-5 text-white/60 group-hover:text-white" />
            </button>
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-purple-500/25"
            >
              {isSharing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Send className="w-4 h-4" />
                  </motion.div>
                  <span>Sharing...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report Sections */}
      <div className="space-y-4">
        {displaySections.map((section, index) => (
          <SectionCard key={index} section={section} index={index} />
        ))}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-8 text-center"
      >
        <div className="backdrop-blur-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-white/[0.05] rounded-2xl p-6">
          <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-3" />
          <p className="text-white/60 text-sm">
            This report was generated by blipee AI using real-time data analysis
            and predictive modeling.
            <br />
            For questions or deeper insights, just ask me anything!
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
