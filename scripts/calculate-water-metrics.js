#!/usr/bin/env node

/**
 * Calculate Corrected Water Metrics for PLMJ
 * Based on actual water flow and grey water system
 */

// Dados históricos mensais de consumo de água - LISBOA
const historicalMonthlyWaterConsumption = [
  // 2022 Data
  { month: 1,  '2022_HUMAN': 18.4, '2022_SANITARY': 5.3,  },
  { month: 2,  '2022_HUMAN': 10.4, '2022_SANITARY': 3.0, },
  { month: 3,  '2022_HUMAN': 18.1, '2022_SANITARY': 5.3, },
  { month: 4,  '2022_HUMAN': 24.0, '2022_SANITARY': 7.0, },
  { month: 5,  '2022_HUMAN': 29.5, '2022_SANITARY': 8.6, },
  { month: 6,  '2022_HUMAN': 26.6, '2022_SANITARY': 7.7,  },
  { month: 7,  '2022_HUMAN': 30.7, '2022_SANITARY': 8.9, '2022_IRRIGATION': 0, '2022_CLEANING': 0, '2022_PROCESS': 0, '2022_OTHER': 0 },
  { month: 8,  '2022_HUMAN': 19.6, '2022_SANITARY': 5.7, '2022_IRRIGATION': 0, '2022_CLEANING': 0, '2022_PROCESS': 0, '2022_OTHER': 0 },
  { month: 9,  '2022_HUMAN': 31.6, '2022_SANITARY': 9.2, '2022_IRRIGATION': 0, '2022_CLEANING': 0, '2022_PROCESS': 0, '2022_OTHER': 0 },
  { month: 10, '2022_HUMAN': 29.3, '2022_SANITARY': 8.5, '2022_IRRIGATION': 0, '2022_CLEANING': 0, '2022_PROCESS': 0, '2022_OTHER': 0 },
  { month: 11, '2022_HUMAN': 31.4, '2022_SANITARY': 9.1, '2022_IRRIGATION': 0, '2022_CLEANING': 0, '2022_PROCESS': 0, '2022_OTHER': 0 },
  { month: 12, '2022_HUMAN': 23.8, '2022_SANITARY': 6.9, '2022_IRRIGATION': 0, '2022_CLEANING': 0, '2022_PROCESS': 0, '2022_OTHER': 0 },

  // 2023 Data
  { month: 1,  '2023_HUMAN': 32.1, '2023_SANITARY': 9.3, '2023_IRRIGATION': 0, '2023_CLEANING': 0, '2023_PROCESS': 0, '2023_OTHER': 0 },
  { month: 2,  '2023_HUMAN': 28.2, '2023_SANITARY': 8.2, '2023_IRRIGATION': 0, '2023_CLEANING': 0, '2023_PROCESS': 0, '2023_OTHER': 0 },
  { month: 3,  '2023_HUMAN': 30.5, '2023_SANITARY': 8.9, '2023_IRRIGATION': 0, '2023_CLEANING': 0, '2023_PROCESS': 0, '2023_OTHER': 0 },
  { month: 4,  '2023_HUMAN': 21.4, '2023_SANITARY': 6.2, '2023_IRRIGATION': 0, '2023_CLEANING': 0, '2023_PROCESS': 0, '2023_OTHER': 0 },
  { month: 5,  '2023_HUMAN': 27.1, '2023_SANITARY': 7.9, '2023_IRRIGATION': 0, '2023_CLEANING': 0, '2023_PROCESS': 0, '2023_OTHER': 0 },
  { month: 6,  '2023_HUMAN': 23.8, '2023_SANITARY': 6.9, '2023_IRRIGATION': 0, '2023_CLEANING': 0, '2023_PROCESS': 0, '2023_OTHER': 0 },
  { month: 7,  '2023_HUMAN': 28.5, '2023_SANITARY': 8.3, '2023_IRRIGATION': 0, '2023_CLEANING': 0, '2023_PROCESS': 0, '2023_OTHER': 0 },
  { month: 8,  '2023_HUMAN': 18.4, '2023_SANITARY': 5.3, '2023_IRRIGATION': 0, '2023_CLEANING': 0, '2023_PROCESS': 0, '2023_OTHER': 0 },
  { month: 9,  '2023_HUMAN': 29.4, '2023_SANITARY': 8.5, '2023_IRRIGATION': 0, '2023_CLEANING': 0, '2023_PROCESS': 0, '2023_OTHER': 0 },
  { month: 10, '2023_HUMAN': 7.8,  '2023_SANITARY': 2.3, '2023_IRRIGATION': 0, '2023_CLEANING': 0, '2023_PROCESS': 0, '2023_OTHER': 0 },
  { month: 11, '2023_HUMAN': 34.4, '2023_SANITARY': 10.0,'2023_IRRIGATION': 0, '2023_CLEANING': 0, '2023_PROCESS': 0, '2023_OTHER': 0 },
  { month: 12, '2023_HUMAN': 25.0, '2023_SANITARY': 7.3, '2023_IRRIGATION': 0, '2023_CLEANING': 0, '2023_PROCESS': 0, '2023_OTHER': 0 },

  // 2024 Data
  { month: 1,  "2024_HUMAN": 28.8, "2024_SANITARY": 8.3, "2024_IRRIGATION": 0, "2024_CLEANING": 0, "2024_PROCESS": 0, "2024_OTHER": 0 },
  { month: 2,  "2024_HUMAN": 24.4, "2024_SANITARY": 6.7, "2024_IRRIGATION": 0, "2024_CLEANING": 0, "2024_PROCESS": 0, "2024_OTHER": 0 },
  { month: 3,  "2024_HUMAN": 28.6, "2024_SANITARY": 8.3, "2024_IRRIGATION": 0, "2024_CLEANING": 0, "2024_PROCESS": 0, "2024_OTHER": 0 },
  { month: 4,  "2024_HUMAN": 24.5, "2024_SANITARY": 7.1, "2024_IRRIGATION": 0, "2024_CLEANING": 0, "2024_PROCESS": 0, "2024_OTHER": 0 },
  { month: 5,  "2024_HUMAN": 28.4, "2024_SANITARY": 8.2, "2024_IRRIGATION": 0, "2024_CLEANING": 0, "2024_PROCESS": 0, "2024_OTHER": 0 },
  { month: 6,  "2024_HUMAN": 25.1, "2024_SANITARY": 7.3, "2024_IRRIGATION": 0, "2024_CLEANING": 0, "2024_PROCESS": 0, "2024_OTHER": 0 },
  { month: 7,  "2024_HUMAN": 29.1, "2024_SANITARY": 8.6, "2024_IRRIGATION": 0, "2024_CLEANING": 0, "2024_PROCESS": 0, "2024_OTHER": 0 },
  { month: 8,  "2024_HUMAN": 18.8, "2024_SANITARY": 5.5, "2024_IRRIGATION": 0, "2024_CLEANING": 0, "2024_PROCESS": 0, "2024_OTHER": 0 },
  { month: 9,  "2024_HUMAN": 30.0, "2024_SANITARY": 8.8, "2024_IRRIGATION": 0, "2024_CLEANING": 0, "2024_PROCESS": 0, "2024_OTHER": 0 },
  { month: 10, "2024_HUMAN": 18.9, "2024_SANITARY": 5.4, "2024_IRRIGATION": 0, "2024_CLEANING": 0, "2024_PROCESS": 0, "2024_OTHER": 0 },
  { month: 11, "2024_HUMAN": 32.5, "2024_SANITARY": 9.5, "2024_IRRIGATION": 0, "2024_CLEANING": 0, "2024_PROCESS": 0, "2024_OTHER": 0 },
  { month: 12, "2024_HUMAN": 24.4, "2024_SANITARY": 7.1, "2024_IRRIGATION": 0, "2024_CLEANING": 0, "2024_PROCESS": 0, "2024_OTHER": 0 },
];

// Dados históricos mensais de consumo de água - PORTO
const historicalMonthlyWaterConsumptionPorto = [
  // 2022
  { month: 1,  "2022_HUMAN": 4.9, "2022_SANITARY": 2.1, "2022_IRRIGATION": 0, "2022_CLEANING": 0, "2022_PROCESS": 0, "2022_OTHER": 0 },
  { month: 2,  "2022_HUMAN": 5.6, "2022_SANITARY": 2.4, "2022_IRRIGATION": 0, "2022_CLEANING": 0, "2022_PROCESS": 0, "2022_OTHER": 0 },
  { month: 3,  "2022_HUMAN": 7.0, "2022_SANITARY": 3.0, "2022_IRRIGATION": 0, "2022_CLEANING": 0, "2022_PROCESS": 0, "2022_OTHER": 0 },
  { month: 4,  "2022_HUMAN": 8.4, "2022_SANITARY": 3.6, "2022_IRRIGATION": 0, "2022_CLEANING": 0, "2022_PROCESS": 0, "2022_OTHER": 0 },
  { month: 5,  "2022_HUMAN": 5.6, "2022_SANITARY": 2.4, "2022_IRRIGATION": 0, "2022_CLEANING": 0, "2022_PROCESS": 0, "2022_OTHER": 0 },
  { month: 6,  "2022_HUMAN": 9.1, "2022_SANITARY": 3.9, "2022_IRRIGATION": 0, "2022_CLEANING": 0, "2022_PROCESS": 0, "2022_OTHER": 0 },
  { month: 7,  "2022_HUMAN": 8.4, "2022_SANITARY": 3.6, "2022_IRRIGATION": 0, "2022_CLEANING": 0, "2022_PROCESS": 0, "2022_OTHER": 0 },
  { month: 8,  "2022_HUMAN": 6.3, "2022_SANITARY": 2.7, "2022_IRRIGATION": 0, "2022_CLEANING": 0, "2022_PROCESS": 0, "2022_OTHER": 0 },
  { month: 9,  "2022_HUMAN": 7.0, "2022_SANITARY": 3.0, "2022_IRRIGATION": 0, "2022_CLEANING": 0, "2022_PROCESS": 0, "2022_OTHER": 0 },
  { month: 10, "2022_HUMAN": 7.0, "2022_SANITARY": 3.0, "2022_IRRIGATION": 0, "2022_CLEANING": 0, "2022_PROCESS": 0, "2022_OTHER": 0 },
  { month: 11, "2022_HUMAN": 8.4, "2022_SANITARY": 3.6, "2022_IRRIGATION": 0, "2022_CLEANING": 0, "2022_PROCESS": 0, "2022_OTHER": 0 },
  { month: 12, "2022_HUMAN": 3.5, "2022_SANITARY": 1.5, "2022_IRRIGATION": 0, "2022_CLEANING": 0, "2022_PROCESS": 0, "2022_OTHER": 0 },

  // 2023
  { month: 1,  "2023_HUMAN": 5.6, "2023_SANITARY": 2.4, "2023_IRRIGATION": 0, "2023_CLEANING": 0, "2023_PROCESS": 0, "2023_OTHER": 0 },
  { month: 2,  "2023_HUMAN": 7.0, "2023_SANITARY": 3.0, "2023_IRRIGATION": 0, "2023_CLEANING": 0, "2023_PROCESS": 0, "2023_OTHER": 0 },
  { month: 3,  "2023_HUMAN": 8.4, "2023_SANITARY": 3.6, "2023_IRRIGATION": 0, "2023_CLEANING": 0, "2023_PROCESS": 0, "2023_OTHER": 0 },
  { month: 4,  "2023_HUMAN": 10.5, "2023_SANITARY": 4.5, "2023_IRRIGATION": 0, "2023_CLEANING": 0, "2023_PROCESS": 0, "2023_OTHER": 0 },
  { month: 5,  "2023_HUMAN": 6.3, "2023_SANITARY": 2.7, "2023_IRRIGATION": 0, "2023_CLEANING": 0, "2023_PROCESS": 0, "2023_OTHER": 0 },
  { month: 6,  "2023_HUMAN": 10.5, "2023_SANITARY": 4.5, "2023_IRRIGATION": 0, "2023_CLEANING": 0, "2023_PROCESS": 0, "2023_OTHER": 0 },
  { month: 7,  "2023_HUMAN": 9.8, "2023_SANITARY": 4.2, "2023_IRRIGATION": 0, "2023_CLEANING": 0, "2023_PROCESS": 0, "2023_OTHER": 0 },
  { month: 8,  "2023_HUMAN": 7.7, "2023_SANITARY": 3.3, "2023_IRRIGATION": 0, "2023_CLEANING": 0, "2023_PROCESS": 0, "2023_OTHER": 0 },
  { month: 9,  "2023_HUMAN": 7.7, "2023_SANITARY": 3.3, "2023_IRRIGATION": 0, "2023_CLEANING": 0, "2023_PROCESS": 0, "2023_OTHER": 0 },
  { month: 10, "2023_HUMAN": 8.4, "2023_SANITARY": 3.6, "2023_IRRIGATION": 0, "2023_CLEANING": 0, "2023_PROCESS": 0, "2023_OTHER": 0 },
  { month: 11, "2023_HUMAN": 9.8, "2023_SANITARY": 4.2, "2023_IRRIGATION": 0, "2023_CLEANING": 0, "2023_PROCESS": 0, "2023_OTHER": 0 },
  { month: 12, "2023_HUMAN": 4.2, "2023_SANITARY": 1.8, "2023_IRRIGATION": 0, "2023_CLEANING": 0, "2023_PROCESS": 0, "2023_OTHER": 0 },

  // 2024
  { month: 1,  "2024_HUMAN": 5.6, "2024_SANITARY": 2.4, "2024_IRRIGATION": 0, "2024_CLEANING": 0, "2024_PROCESS": 0, "2024_OTHER": 0 },
  { month: 2,  "2024_HUMAN": 7.0, "2024_SANITARY": 3.0, "2024_IRRIGATION": 0, "2024_CLEANING": 0, "2024_PROCESS": 0, "2024_OTHER": 0 },
  { month: 3,  "2024_HUMAN": 8.4, "2024_SANITARY": 3.6, "2024_IRRIGATION": 0, "2024_CLEANING": 0, "2024_PROCESS": 0, "2024_OTHER": 0 },
  { month: 4,  "2024_HUMAN": 10.5, "2024_SANITARY": 4.5, "2024_IRRIGATION": 0, "2024_CLEANING": 0, "2024_PROCESS": 0, "2024_OTHER": 0 },
  { month: 5,  "2024_HUMAN": 6.3, "2024_SANITARY": 2.7, "2024_IRRIGATION": 0, "2024_CLEANING": 0, "2024_PROCESS": 0, "2024_OTHER": 0 },
  { month: 6,  "2024_HUMAN": 10.5, "2024_SANITARY": 4.5, "2024_IRRIGATION": 0, "2024_CLEANING": 0, "2024_PROCESS": 0, "2024_OTHER": 0 },
  { month: 7,  "2024_HUMAN": 9.8, "2024_SANITARY": 4.2, "2024_IRRIGATION": 0, "2024_CLEANING": 0, "2024_PROCESS": 0, "2024_OTHER": 0 },
  { month: 8,  "2024_HUMAN": 7.7, "2024_SANITARY": 3.3, "2024_IRRIGATION": 0, "2024_CLEANING": 0, "2024_PROCESS": 0, "2024_OTHER": 0 },
  { month: 9,  "2024_HUMAN": 8.4, "2024_SANITARY": 3.6, "2024_IRRIGATION": 0, "2024_CLEANING": 0, "2024_PROCESS": 0, "2024_OTHER": 0 },
  { month: 10, "2024_HUMAN": 7.1, "2024_SANITARY": 3.0, "2024_IRRIGATION": 0, "2024_CLEANING": 0, "2024_PROCESS": 0, "2024_OTHER": 0 },
  { month: 11, "2024_HUMAN": 7.9, "2024_SANITARY": 3.4, "2024_IRRIGATION": 0, "2024_CLEANING": 0, "2024_PROCESS": 0, "2024_OTHER": 0 },
  { month: 12, "2024_HUMAN": 6.8, "2024_SANITARY": 2.9, "2024_IRRIGATION": 0, "2024_CLEANING": 0, "2024_PROCESS": 0, "2024_OTHER": 0 }
];

// Dados históricos mensais de consumo de água - FARO
const historicalMonthlyWaterConsumptionFaro = [
  // 2022 Data
  { month: 1,  '2022_HUMAN': 4, '2022_SANITARY': 1, '2022_IRRIGATION': 0, '2022_CLEANING': 0, '2022_PROCESS': 0, '2022_OTHER': 0 },
  { month: 2,  '2022_HUMAN': 4, '2022_SANITARY': 1, '2022_IRRIGATION': 0, '2022_CLEANING': 0, '2022_PROCESS': 0, '2022_OTHER': 0 },
  { month: 3,  '2022_HUMAN': 5, '2022_SANITARY': 2, '2022_IRRIGATION': 0, '2022_CLEANING': 0, '2022_PROCESS': 0, '2022_OTHER': 0 },
  { month: 4,  '2022_HUMAN': 6, '2022_SANITARY': 2, '2022_IRRIGATION': 0, '2022_CLEANING': 0, '2022_PROCESS': 0, '2022_OTHER': 0 },
  { month: 5,  '2022_HUMAN': 4, '2022_SANITARY': 1, '2022_IRRIGATION': 0, '2022_CLEANING': 0, '2022_PROCESS': 0, '2022_OTHER': 0 },
  { month: 6,  '2022_HUMAN': 7, '2022_SANITARY': 1, '2022_IRRIGATION': 0, '2022_CLEANING': 0, '2022_PROCESS': 0, '2022_OTHER': 0 },
  { month: 7,  '2022_HUMAN': 6, '2022_SANITARY': 2, '2022_IRRIGATION': 0, '2022_CLEANING': 0, '2022_PROCESS': 0, '2022_OTHER': 0 },
  { month: 8,  '2022_HUMAN': 5, '2022_SANITARY': 1, '2022_IRRIGATION': 0, '2022_CLEANING': 0, '2022_PROCESS': 0, '2022_OTHER': 0 },
  { month: 9,  '2022_HUMAN': 5, '2022_SANITARY': 2, '2022_IRRIGATION': 0, '2022_CLEANING': 0, '2022_PROCESS': 0, '2022_OTHER': 0 },
  { month: 10, '2022_HUMAN': 5, '2022_SANITARY': 2, '2022_IRRIGATION': 0, '2022_CLEANING': 0, '2022_PROCESS': 0, '2022_OTHER': 0 },
  { month: 11, '2022_HUMAN': 6, '2022_SANITARY': 2, '2022_IRRIGATION': 0, '2022_CLEANING': 0, '2022_PROCESS': 0, '2022_OTHER': 0 },
  { month: 12, '2022_HUMAN': 3, '2022_SANITARY': 0, '2022_IRRIGATION': 0, '2022_CLEANING': 0, '2022_PROCESS': 0, '2022_OTHER': 0 },

  // 2023 Data
  { month: 1, '2023_HUMAN': 4, '2023_SANITARY': 1, '2023_IRRIGATION': 0, '2023_CLEANING': 0, '2023_PROCESS': 0, '2023_OTHER': 0 },
  { month: 2, '2023_HUMAN': 5, '2023_SANITARY': 1, '2023_IRRIGATION': 0, '2023_CLEANING': 0, '2023_PROCESS': 0, '2023_OTHER': 0 },
  { month: 3, '2023_HUMAN': 6, '2023_SANITARY': 2, '2023_IRRIGATION': 0, '2023_CLEANING': 0, '2023_PROCESS': 0, '2023_OTHER': 0 },
  { month: 4, '2023_HUMAN': 7, '2023_SANITARY': 2, '2023_IRRIGATION': 0, '2023_CLEANING': 0, '2023_PROCESS': 0, '2023_OTHER': 0 },
  { month: 5, '2023_HUMAN': 5, '2023_SANITARY': 1, '2023_IRRIGATION': 0, '2023_CLEANING': 0, '2023_PROCESS': 0, '2023_OTHER': 0 },
  { month: 6, '2023_HUMAN': 8, '2023_SANITARY': 2, '2023_IRRIGATION': 0, '2023_CLEANING': 0, '2023_PROCESS': 0, '2023_OTHER': 0 },
  { month: 7, '2023_HUMAN': 7, '2023_SANITARY': 2, '2023_IRRIGATION': 0, '2023_CLEANING': 0, '2023_PROCESS': 0, '2023_OTHER': 0 },
  { month: 8, '2023_HUMAN': 5, '2023_SANITARY': 2, '2023_IRRIGATION': 0, '2023_CLEANING': 0, '2023_PROCESS': 0, '2023_OTHER': 0 },
  { month: 9, '2023_HUMAN': 6, '2023_SANITARY': 2, '2023_IRRIGATION': 0, '2023_CLEANING': 0, '2023_PROCESS': 0, '2023_OTHER': 0 },
  { month: 10, '2023_HUMAN': 6, '2023_SANITARY': 2, '2023_IRRIGATION': 0, '2023_CLEANING': 0, '2023_PROCESS': 0, '2023_OTHER': 0 },
  { month: 11, '2023_HUMAN': 7, '2023_SANITARY': 2, '2023_IRRIGATION': 0, '2023_CLEANING': 0, '2023_PROCESS': 0, '2023_OTHER': 0 },
  { month: 12, '2023_HUMAN': 3, '2023_SANITARY': 1, '2023_IRRIGATION': 0, '2023_CLEANING': 0, '2023_PROCESS': 0, '2023_OTHER': 0 },

  // 2024 Data
  { month: 1, '2024_HUMAN': 4, '2024_SANITARY': 2, '2024_IRRIGATION': 0, '2024_CLEANING': 0, '2024_PROCESS': 0, '2024_OTHER': 0 },
  { month: 2, '2024_HUMAN': 5, '2024_SANITARY': 1, '2024_IRRIGATION': 0, '2024_CLEANING': 0, '2024_PROCESS': 0, '2024_OTHER': 0 },
  { month: 3, '2024_HUMAN': 6, '2024_SANITARY': 2, '2024_IRRIGATION': 0, '2024_CLEANING': 0, '2024_PROCESS': 0, '2024_OTHER': 0 },
  { month: 4, '2024_HUMAN': 8, '2024_SANITARY': 2, '2024_IRRIGATION': 0, '2024_CLEANING': 0, '2024_PROCESS': 0, '2024_OTHER': 0 },
  { month: 5, '2024_HUMAN': 5, '2024_SANITARY': 1, '2024_IRRIGATION': 0, '2024_CLEANING': 0, '2024_PROCESS': 0, '2024_OTHER': 0 },
  { month: 6, '2024_HUMAN': 8, '2024_SANITARY': 2, '2024_IRRIGATION': 0, '2024_CLEANING': 0, '2024_PROCESS': 0, "2024_OTHER": 0 },
  { month: 7, '2024_HUMAN': 8, '2024_SANITARY': 2, '2024_IRRIGATION': 0, '2024_CLEANING': 0, '2024_PROCESS': 0, '2024_OTHER': 0 },
  { month: 8, '2024_HUMAN': 6, '2024_SANITARY': 1, '2024_IRRIGATION': 0, '2024_CLEANING': 0, '2024_PROCESS': 0, '2024_OTHER': 0 },
  { month: 9, '2024_HUMAN': 6, '2024_SANITARY': 2, '2024_IRRIGATION': 0, '2024_CLEANING': 0, '2024_PROCESS': 0, '2024_OTHER': 0 },
  { month: 10, '2024_HUMAN': 6, '2024_SANITARY': 2, '2024_IRRIGATION': 0, '2024_CLEANING': 0, '2024_PROCESS': 0, '2024_OTHER': 0 },
  { month: 11, '2024_HUMAN': 8, '2024_SANITARY': 2, '2024_IRRIGATION': 0, '2024_CLEANING': 0, '2024_PROCESS': 0, '2024_OTHER': 0 },
  { month: 12, '2024_HUMAN': 3, '2024_SANITARY': 1, '2024_IRRIGATION': 0, '2024_CLEANING': 0, '2024_PROCESS': 0, '2024_OTHER': 0 },
];

/**
 * Calculate water metrics for Lisboa (WITH grey water system)
 */
function calculateLisboaMetrics(humanM3, sanitaryM3, irrigationM3 = 0) {
  // Total building throughput
  const totalThroughput = humanM3 + sanitaryM3 + irrigationM3;

  // Grey water reused = 50% of sanitary water
  const greyWaterReused = sanitaryM3 / 2;

  // Fresh water withdrawal
  const freshWithdrawal = totalThroughput - greyWaterReused;

  // Breakdown of fresh water uses (based on Lisboa ratios)
  const drinkingKitchen = freshWithdrawal * 0.728;  // 72.8%
  const handwashing = freshWithdrawal * 0.126;      // 12.6% → Goes to grey water tank
  const sanitaryFresh = freshWithdrawal * 0.126;    // 12.6% → Mixed with grey water
  const cleaning = freshWithdrawal * 0.020;         // 2.0%

  // Consumption (water that doesn't return)
  const drinkingConsumed = freshWithdrawal * 0.015;     // 1.5% actually drunk
  const cleaningEvaporated = freshWithdrawal * 0.002;   // 0.2% evaporates
  const irrigationConsumed = irrigationM3;               // 100% if exists
  const totalConsumed = drinkingConsumed + cleaningEvaporated + irrigationConsumed;

  // Water discharged to sewer
  const totalDischarged = freshWithdrawal - totalConsumed;

  return {
    // Original data
    human_m3: humanM3,
    sanitary_m3: sanitaryM3,
    irrigation_m3: irrigationM3,

    // Calculated totals
    total_throughput_m3: parseFloat(totalThroughput.toFixed(2)),
    fresh_withdrawal_m3: parseFloat(freshWithdrawal.toFixed(2)),
    grey_water_reused_m3: parseFloat(greyWaterReused.toFixed(2)),
    water_consumed_m3: parseFloat(totalConsumed.toFixed(2)),
    water_discharged_m3: parseFloat(totalDischarged.toFixed(2)),

    // Fresh water breakdown
    drinking_kitchen_m3: parseFloat(drinkingKitchen.toFixed(2)),
    handwashing_m3: parseFloat(handwashing.toFixed(2)),
    sanitary_fresh_m3: parseFloat(sanitaryFresh.toFixed(2)),
    sanitary_grey_m3: parseFloat(greyWaterReused.toFixed(2)),
    cleaning_m3: parseFloat(cleaning.toFixed(2)),

    // Performance metrics
    reuse_rate_percent: parseFloat(((greyWaterReused / totalThroughput) * 100).toFixed(1)),
    return_rate_percent: parseFloat(((totalDischarged / freshWithdrawal) * 100).toFixed(1)),

    // System info
    has_grey_water_system: true,
    grey_water_source: "handwashing_sinks",
    grey_water_destination: "sanitary"
  };
}

/**
 * Calculate water metrics for Porto/Faro (NO grey water system)
 */
function calculateStandardMetrics(humanM3, sanitaryM3, irrigationM3 = 0) {
  // Total = fresh withdrawal (no reuse)
  const totalFresh = humanM3 + sanitaryM3 + irrigationM3;

  // Breakdown using standard office ratios
  const drinkingKitchen = totalFresh * 0.728;
  const handwashing = totalFresh * 0.126;
  const sanitary = totalFresh * 0.126;
  const cleaning = totalFresh * 0.020;

  // Consumption
  const drinkingConsumed = totalFresh * 0.015;
  const cleaningEvaporated = totalFresh * 0.002;
  const irrigationConsumed = irrigationM3;
  const totalConsumed = drinkingConsumed + cleaningEvaporated + irrigationConsumed;

  // Discharge
  const totalDischarged = totalFresh - totalConsumed;

  return {
    // Original data
    human_m3: humanM3,
    sanitary_m3: sanitaryM3,
    irrigation_m3: irrigationM3,

    // Calculated totals
    total_throughput_m3: parseFloat(totalFresh.toFixed(2)),
    fresh_withdrawal_m3: parseFloat(totalFresh.toFixed(2)),
    grey_water_reused_m3: 0,
    water_consumed_m3: parseFloat(totalConsumed.toFixed(2)),
    water_discharged_m3: parseFloat(totalDischarged.toFixed(2)),

    // Fresh water breakdown
    drinking_kitchen_m3: parseFloat(drinkingKitchen.toFixed(2)),
    handwashing_m3: parseFloat(handwashing.toFixed(2)),
    sanitary_fresh_m3: parseFloat(sanitary.toFixed(2)),
    sanitary_grey_m3: 0,
    cleaning_m3: parseFloat(cleaning.toFixed(2)),

    // Performance metrics
    reuse_rate_percent: 0,
    return_rate_percent: parseFloat(((totalDischarged / totalFresh) * 100).toFixed(1)),

    // System info
    has_grey_water_system: false
  };
}

/**
 * Process all data for a site
 */
function processSiteData(data, siteName, hasGreyWater, yearKey) {
  const results = [];

  data.forEach(row => {
    const human = row[`${yearKey}_HUMAN`] || 0;
    const sanitary = row[`${yearKey}_SANITARY`] || 0;
    const irrigation = row[`${yearKey}_IRRIGATION`] || row[`${yearKey}_IRRIGACAO`] || 0;

    const metrics = hasGreyWater
      ? calculateLisboaMetrics(human, sanitary, irrigation)
      : calculateStandardMetrics(human, sanitary, irrigation);

    results.push({
      site: siteName,
      year: yearKey,
      month: row.month,
      ...metrics
    });
  });

  return results;
}

// Process all sites and years
console.log('🔄 Calculating Water Metrics for PLMJ Sites\n');
console.log('='.repeat(120));

const allResults = [];

// Lisboa - WITH grey water system
['2022', '2023', '2024'].forEach(year => {
  const results = processSiteData(historicalMonthlyWaterConsumption, 'Lisboa - FPM41', true, year);
  allResults.push(...results);
});

// Porto - NO grey water system
['2022', '2023', '2024'].forEach(year => {
  const results = processSiteData(historicalMonthlyWaterConsumptionPorto, 'Porto - POP', false, year);
  allResults.push(...results);
});

// Faro - NO grey water system
['2022', '2023', '2024'].forEach(year => {
  const results = processSiteData(historicalMonthlyWaterConsumptionFaro, 'Faro', false, year);
  allResults.push(...results);
});

// Print summary table
console.log('\n📊 CALCULATED WATER METRICS - SUMMARY\n');
console.log('Site'.padEnd(18) + 'Year  Month  Total  Fresh  Grey  Consumed  Discharged  Reuse%  Return%');
console.log('-'.repeat(120));

allResults.forEach(r => {
  console.log(
    r.site.padEnd(18) +
    r.year.padEnd(6) +
    String(r.month).padStart(2) + '    ' +
    String(r.total_throughput_m3).padStart(6) + ' ' +
    String(r.fresh_withdrawal_m3).padStart(6) + ' ' +
    String(r.grey_water_reused_m3).padStart(5) + ' ' +
    String(r.water_consumed_m3).padStart(8) + ' ' +
    String(r.water_discharged_m3).padStart(11) + ' ' +
    String(r.reuse_rate_percent + '%').padStart(7) + ' ' +
    String(r.return_rate_percent + '%').padStart(7)
  );
});

// Print detailed breakdown for Lisboa Jan 2024
console.log('\n\n📋 DETAILED BREAKDOWN - Lisboa January 2024\n');
const lisboaJan2024 = allResults.find(r => r.site === 'Lisboa - FPM41' && r.year === '2024' && r.month === 1);

console.log(`Original Input Data:
  - HUMAN water: ${lisboaJan2024.human_m3} m³
  - SANITARY water: ${lisboaJan2024.sanitary_m3} m³
  - Total building throughput: ${lisboaJan2024.total_throughput_m3} m³

Fresh Water Withdrawal: ${lisboaJan2024.fresh_withdrawal_m3} m³
  ├─ Drinking/Kitchen: ${lisboaJan2024.drinking_kitchen_m3} m³ (72.8%)
  ├─ Handwashing: ${lisboaJan2024.handwashing_m3} m³ (12.6%) → Grey Water Tank 🔄
  ├─ Sanitary (fresh): ${lisboaJan2024.sanitary_fresh_m3} m³ (12.6%)
  └─ Cleaning: ${lisboaJan2024.cleaning_m3} m³ (2.0%)

Grey Water System: ♻️
  ├─ Captured from sinks: ${lisboaJan2024.handwashing_m3} m³
  ├─ Reused in toilets: ${lisboaJan2024.grey_water_reused_m3} m³
  └─ Reuse rate: ${lisboaJan2024.reuse_rate_percent}%

Sanitary Water Composition: ${lisboaJan2024.sanitary_m3} m³
  ├─ Fresh water: ${lisboaJan2024.sanitary_fresh_m3} m³ (50%)
  └─ Grey water: ${lisboaJan2024.sanitary_grey_m3} m³ (50%) 🔄

Water Balance:
  ├─ Consumed (not returned): ${lisboaJan2024.water_consumed_m3} m³ (1.7%)
  ├─ Discharged to sewer: ${lisboaJan2024.water_discharged_m3} m³ (${lisboaJan2024.return_rate_percent}%)
  └─ Return rate: ${lisboaJan2024.return_rate_percent}%

Water Savings: 🌊
  ├─ Fresh water saved per month: ${lisboaJan2024.grey_water_reused_m3} m³
  └─ Annual savings: ${(lisboaJan2024.grey_water_reused_m3 * 12).toFixed(1)} m³/year
`);

// Export to JSON for database import
const fs = require('fs');
const outputPath = '/Users/pedro/Documents/blipee/blipee-os/blipee-os/scripts/calculated-water-metrics.json';
fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
console.log(`\n✅ Full results exported to: ${outputPath}`);

// Calculate annual totals
console.log('\n📈 ANNUAL TOTALS\n');
const annualSummary = {};

allResults.forEach(r => {
  const key = `${r.site} - ${r.year}`;
  if (!annualSummary[key]) {
    annualSummary[key] = {
      site: r.site,
      year: r.year,
      total_throughput: 0,
      fresh_withdrawal: 0,
      grey_reused: 0,
      consumed: 0,
      discharged: 0,
      has_grey_water: r.has_grey_water_system
    };
  }
  annualSummary[key].total_throughput += r.total_throughput_m3;
  annualSummary[key].fresh_withdrawal += r.fresh_withdrawal_m3;
  annualSummary[key].grey_reused += r.grey_water_reused_m3;
  annualSummary[key].consumed += r.water_consumed_m3;
  annualSummary[key].discharged += r.water_discharged_m3;
});

console.log('Site'.padEnd(18) + 'Year  Throughput  Fresh    Grey    Consumed  Discharged  Savings');
console.log('-'.repeat(100));

Object.values(annualSummary).forEach(s => {
  console.log(
    s.site.padEnd(18) +
    s.year.padEnd(6) +
    String(s.total_throughput.toFixed(1)).padStart(10) + ' ' +
    String(s.fresh_withdrawal.toFixed(1)).padStart(8) + ' ' +
    String(s.grey_reused.toFixed(1)).padStart(7) + ' ' +
    String(s.consumed.toFixed(1)).padStart(9) + ' ' +
    String(s.discharged.toFixed(1)).padStart(11) + ' ' +
    (s.has_grey_water ? `💧 ${s.grey_reused.toFixed(1)} m³` : 'No system')
  );
});

console.log('\n✅ Calculation complete!');
console.log('\n💡 Next steps:');
console.log('   1. Review the calculated metrics above');
console.log('   2. Check calculated-water-metrics.json for full data');
console.log('   3. Confirm values before updating database');
