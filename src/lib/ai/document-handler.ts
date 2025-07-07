import { processDocument } from "@/lib/documents/universal-processor";

/**
 * Handle document uploads in the chat interface
 * This is called when users drag & drop files into the conversation
 */
export async function handleDocumentInChat(
  file: File,
  organizationId: string,
  userId: string,
  aiProvider: "openai" | "anthropic" | "deepseek" = "openai",
): Promise<string> {
  try {
    // Process the document with AI
    const result = await processDocument(
      file,
      organizationId,
      userId,
      "auto", // Let AI detect the type
      aiProvider,
    );

    // Generate a conversational response
    const response = generateChatResponse(result);

    return response;
  } catch (error: any) {
    return `I encountered an error processing your document: ${error.message}. Please try again or contact support if the issue persists.`;
  }
}

/**
 * Generate a friendly chat response based on what was extracted
 */
function generateChatResponse(result: any): string {
  const { documentType, data, stored } = result;

  const responses: Record<string, () => string> = {
    sustainability_report: () => {
      let response = `I've successfully analyzed your sustainability report! Here's a comprehensive breakdown:\n\n`;

      // ENVIRONMENTAL
      if (data.scope1 || data.scope2 || data.scope3) {
        response += `🌍 **ENVIRONMENTAL PERFORMANCE**\n\n`;
        response += `📊 **Emissions:**\n`;
        if (data.scope1)
          response += `• Scope 1: ${data.scope1.toLocaleString()} tonnes CO₂e\n`;
        if (data.scope2)
          response += `• Scope 2: ${data.scope2.toLocaleString()} tonnes CO₂e\n`;
        if (data.scope3)
          response += `• Scope 3: ${data.scope3.toLocaleString()} tonnes CO₂e\n`;
        const total =
          (data.scope1 || 0) + (data.scope2 || 0) + (data.scope3 || 0);
        if (total > 0)
          response += `• **Total: ${total.toLocaleString()} tonnes CO₂e**\n`;
        response += `\n`;
      }

      if (data.energy || data.renewablePercentage) {
        response += `⚡ **Energy:**\n`;
        if (data.energy)
          response += `• Total consumption: ${data.energy.toLocaleString()} MWh\n`;
        if (data.renewablePercentage)
          response += `• Renewable energy: ${data.renewablePercentage}%\n`;
        response += `\n`;
      }

      if (data.water) {
        response += `💧 **Water:**\n`;
        response += `• Consumption: ${data.water.toLocaleString()} m³\n`;
        if (data.waterRecycled)
          response += `• Recycled: ${data.waterRecycled}%\n`;
        response += `\n`;
      }

      if (data.waste || data.wasteRecycled) {
        response += `♻️ **Waste:**\n`;
        if (data.waste)
          response += `• Total generated: ${data.waste.toLocaleString()} tonnes\n`;
        if (data.wasteRecycled)
          response += `• Diverted from landfill: ${data.wasteRecycled}%\n`;
        response += `\n`;
      }

      // SOCIAL
      if (
        data.employees ||
        data.diversity ||
        data.safety ||
        data.training ||
        data.community
      ) {
        response += `\n👥 **SOCIAL PERFORMANCE**\n\n`;

        if (data.employees) {
          response += `**Workforce:**\n`;
          response += `• Total employees: ${data.employees.toLocaleString()}\n`;
          if (data.diversity?.gender)
            response += `• Gender diversity: ${data.diversity.gender}% women\n`;
          if (data.turnoverRate)
            response += `• Turnover rate: ${data.turnoverRate}%\n`;
          response += `\n`;
        }

        if (data.safety?.ltifr || data.safety?.trifr) {
          response += `🦺 **Health & Safety:**\n`;
          if (data.safety.ltifr) response += `• LTIFR: ${data.safety.ltifr}\n`;
          if (data.safety.trifr) response += `• TRIFR: ${data.safety.trifr}\n`;
          if (data.safety.fatalities !== undefined)
            response += `• Fatalities: ${data.safety.fatalities}\n`;
          response += `\n`;
        }

        if (data.training) {
          response += `📚 **Training & Development:**\n`;
          response += `• Average hours per employee: ${data.training}\n`;
          response += `\n`;
        }

        if (data.community?.investment) {
          response += `🤝 **Community:**\n`;
          response += `• Community investment: $${data.community.investment.toLocaleString()}\n`;
          if (data.community.volunteerHours)
            response += `• Volunteer hours: ${data.community.volunteerHours.toLocaleString()}\n`;
          response += `\n`;
        }
      }

      // GOVERNANCE
      if (data.board || data.ethics || data.compliance) {
        response += `\n⚖️ **GOVERNANCE**\n\n`;

        if (data.board) {
          response += `**Board Composition:**\n`;
          if (data.board.independence)
            response += `• Independent directors: ${data.board.independence}%\n`;
          if (data.board.diversity)
            response += `• Board diversity: ${data.board.diversity}%\n`;
          response += `\n`;
        }

        if (data.ethics) {
          response += `**Ethics & Compliance:**\n`;
          if (data.ethics.codeViolations !== undefined)
            response += `• Code violations: ${data.ethics.codeViolations}\n`;
          if (data.ethics.trainingCompletion)
            response += `• Ethics training completion: ${data.ethics.trainingCompletion}%\n`;
          response += `\n`;
        }
      }

      // TARGETS
      if (data.targets || data.netZeroTarget || data.sbti) {
        response += `\n🎯 **TARGETS & COMMITMENTS**\n`;
        if (data.netZeroTarget)
          response += `• Net Zero target: ${data.netZeroTarget}\n`;
        if (data.sbti) response += `• Science-based targets: ✓ Approved\n`;
        if (data.targets?.length > 0) {
          data.targets.forEach((target: any) => {
            response += `• ${target.name}: ${target.value} by ${target.year}\n`;
          });
        }
        response += `\n`;
      }

      // CERTIFICATIONS
      if (data.certifications?.length > 0) {
        response += `\n🏆 **CERTIFICATIONS**\n`;
        data.certifications.forEach((cert: string) => {
          response += `• ${cert}\n`;
        });
        response += `\n`;
      }

      response += `\n✅ I've stored ${stored.emissions || 0} emission records and ${stored.esg_metrics || 0} ESG metrics in your database.\n\n`;
      response += `Would you like me to:\n`;
      response += `1. Deep dive into any specific area (E, S, or G)\n`;
      response += `2. Compare this with industry benchmarks\n`;
      response += `3. Generate a CSRD/GRI/TCFD aligned report\n`;
      response += `4. Identify gaps and improvement opportunities`;

      return response;
    },

    utility_bill: () => `
I've processed your ${data.utilityType} bill from ${data.provider || "your utility provider"}:

📅 **Period:** ${data.billPeriod?.start} to ${data.billPeriod?.end}
📊 **Usage:** ${data.usage} ${data.unit}
💰 **Cost:** $${data.cost}
🌍 **Emissions:** ${(data.usage * 0.433).toFixed(2)} kg CO₂e

This data has been added to your emissions tracking. 
${data.usage > 1000 ? "I notice this is higher than typical - would you like me to suggest energy reduction strategies?" : "Your usage looks good!"}`,

    invoice: () => `
I've analyzed your invoice from ${data.vendor}:

📅 **Date:** ${data.invoiceDate}
💰 **Total:** $${data.total}

${
  data.emissionRelevantItems?.length > 0
    ? `
I found ${data.emissionRelevantItems.length} items that impact your carbon footprint:
${data.emissionRelevantItems.map((item: any) => `• ${item.description}: $${item.amount}`).join("\n")}

Estimated emissions: ${data.estimatedEmissions} kg CO₂e
`
    : "No emission-relevant items detected in this invoice."
}`,

    travel: () => `
I've recorded your ${data.travelMode} travel:

✈️ **Route:** ${data.origin} → ${data.destination}
📏 **Distance:** ${data.distance} km
🌍 **Emissions:** ${data.calculatedEmissions} kg CO₂e

${data.travelMode === "flight" ? "Consider purchasing carbon offsets for this trip. Would you like me to calculate the offset needed?" : ""}
${data.travelMode === "car" ? "For future trips, consider carpooling or electric vehicles to reduce emissions." : ""}`,

    auto: () => `
I've analyzed your document and extracted the following sustainability data:

${JSON.stringify(data, null, 2)}

I've stored ${stored.emissions || 0} emission records and ${stored.esg_metrics || 0} metrics in your database.

What would you like to know about this data?`,
  };

  const responseGenerator = responses[documentType] || responses.auto;
  return responseGenerator();
}

/**
 * Handle multiple documents at once
 */
export async function handleBatchDocuments(
  files: File[],
  organizationId: string,
  userId: string,
): Promise<string> {
  const results = await Promise.all(
    files.map((file) =>
      processDocument(file, organizationId, userId, "auto", "openai"),
    ),
  );

  const totals = results.reduce(
    (acc, result) => ({
      documents: acc.documents + 1,
      emissions: acc.emissions + (result.stored?.emissions || 0),
      metrics: acc.metrics + (result.stored?.esg_metrics || 0),
    }),
    { documents: 0, emissions: 0, metrics: 0 },
  );

  return `
I've successfully processed ${totals.documents} documents:

📄 **Documents analyzed:** ${totals.documents}
📊 **Emission records created:** ${totals.emissions}
📈 **ESG metrics stored:** ${totals.metrics}

Your sustainability data is now up to date. What would you like to analyze first?`;
}
