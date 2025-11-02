#!/usr/bin/env node

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./scripts/calculated-water-metrics.json', 'utf8'));

// Filter out zero values
const validData = data.filter(d => d.total_throughput_m3 > 0);

console.log('📊 RESUMO DOS CÁLCULOS - DADOS VÁLIDOS\n');
console.log('Total de registos válidos:', validData.length);
console.log('\n' + '='.repeat(100));

// Group by site and year
const bySite = {};
validData.forEach(d => {
  const key = `${d.site} - ${d.year}`;
  if (!bySite[key]) bySite[key] = [];
  bySite[key].push(d);
});

console.log('\n🏢 LISBOA - FPM41 (COM Sistema Grey Water ♻️)\n');
['2022', '2023', '2024'].forEach(year => {
  const key = `Lisboa - FPM41 - ${year}`;
  const records = bySite[key] || [];
  if (records.length === 0) return;

  const totals = records.reduce((acc, r) => ({
    throughput: acc.throughput + r.total_throughput_m3,
    fresh: acc.fresh + r.fresh_withdrawal_m3,
    grey: acc.grey + r.grey_water_reused_m3,
    consumed: acc.consumed + r.water_consumed_m3,
    discharged: acc.discharged + r.water_discharged_m3
  }), { throughput: 0, fresh: 0, grey: 0, consumed: 0, discharged: 0 });

  console.log(`${year}:`);
  console.log(`  Meses: ${records.length} meses`);
  console.log(`  Total Throughput: ${totals.throughput.toFixed(1)} m³`);
  console.log(`  Fresh Withdrawal: ${totals.fresh.toFixed(1)} m³ 🚰`);
  console.log(`  Grey Water Reused: ${totals.grey.toFixed(1)} m³ ♻️`);
  console.log(`  Water Consumed: ${totals.consumed.toFixed(1)} m³`);
  console.log(`  Water Discharged: ${totals.discharged.toFixed(1)} m³`);
  console.log(`  Reuse Rate: ${((totals.grey / totals.throughput) * 100).toFixed(1)}%`);
  console.log();
});

console.log('\n🏢 PORTO - POP (SEM Sistema Grey Water)\n');
['2022', '2023', '2024'].forEach(year => {
  const key = `Porto - POP - ${year}`;
  const records = bySite[key] || [];
  if (records.length === 0) return;

  const totals = records.reduce((acc, r) => ({
    fresh: acc.fresh + r.fresh_withdrawal_m3,
    consumed: acc.consumed + r.water_consumed_m3,
    discharged: acc.discharged + r.water_discharged_m3
  }), { fresh: 0, consumed: 0, discharged: 0 });

  console.log(`${year}:`);
  console.log(`  Meses: ${records.length} meses`);
  console.log(`  Fresh Withdrawal: ${totals.fresh.toFixed(1)} m³ 🚰`);
  console.log(`  Water Consumed: ${totals.consumed.toFixed(1)} m³`);
  console.log(`  Water Discharged: ${totals.discharged.toFixed(1)} m³`);
  console.log(`  💡 Opportunity: ${(totals.fresh * 0.112).toFixed(1)} m³ could be saved with grey water system`);
  console.log();
});

console.log('\n🏢 FARO (SEM Sistema Grey Water)\n');
['2022', '2023', '2024'].forEach(year => {
  const key = `Faro - ${year}`;
  const records = bySite[key] || [];
  if (records.length === 0) return;

  const totals = records.reduce((acc, r) => ({
    fresh: acc.fresh + r.fresh_withdrawal_m3,
    consumed: acc.consumed + r.water_consumed_m3,
    discharged: acc.discharged + r.water_discharged_m3
  }), { fresh: 0, consumed: 0, discharged: 0 });

  console.log(`${year}:`);
  console.log(`  Meses: ${records.length} meses`);
  console.log(`  Fresh Withdrawal: ${totals.fresh.toFixed(1)} m³ 🚰`);
  console.log(`  Water Consumed: ${totals.consumed.toFixed(1)} m³`);
  console.log(`  Water Discharged: ${totals.discharged.toFixed(1)} m³`);
  console.log(`  💡 Opportunity: ${(totals.fresh * 0.112).toFixed(1)} m³ could be saved with grey water system`);
  console.log();
});

// Show comparison
console.log('\n💧 COMPARAÇÃO - IMPACTO DO SISTEMA GREY WATER\n');
const lisboa2024 = bySite['Lisboa - FPM41 - 2024'] || [];
const porto2024 = bySite['Porto - POP - 2024'] || [];
const faro2024 = bySite['Faro - 2024'] || [];

const lisboaGrey = lisboa2024.reduce((sum, r) => sum + r.grey_water_reused_m3, 0);
const portoTotal = porto2024.reduce((sum, r) => sum + r.fresh_withdrawal_m3, 0);
const faroTotal = faro2024.reduce((sum, r) => sum + r.fresh_withdrawal_m3, 0);

console.log(`Lisboa 2024: ${lisboaGrey.toFixed(1)} m³ poupados com grey water reuse ✅`);
console.log(`Porto 2024: Poderia poupar ${(portoTotal * 0.112).toFixed(1)} m³/ano com sistema instalado`);
console.log(`Faro 2024: Poderia poupar ${(faroTotal * 0.112).toFixed(1)} m³/ano com sistema instalado`);
console.log(`\nTotal potential additional savings: ${((portoTotal + faroTotal) * 0.112).toFixed(1)} m³/ano 💡`);

// Show detailed breakdown for January 2024
console.log('\n\n📋 EXEMPLO DETALHADO - Lisboa Janeiro 2024\n');
const jan2024 = validData.find(d => d.site === 'Lisboa - FPM41' && d.year === '2024' && d.month === 1);

if (jan2024) {
  console.log('Dados Originais (do JavaScript array):');
  console.log(`  HUMAN: ${jan2024.human_m3} m³`);
  console.log(`  SANITARY: ${jan2024.sanitary_m3} m³`);
  console.log(`  TOTAL Building Throughput: ${jan2024.total_throughput_m3} m³`);

  console.log('\nCálculos - Fresh Water Withdrawal:');
  console.log(`  Total: ${jan2024.fresh_withdrawal_m3} m³`);
  console.log(`  ├─ Drinking/Kitchen: ${jan2024.drinking_kitchen_m3} m³ (72.8%)`);
  console.log(`  ├─ Handwashing: ${jan2024.handwashing_m3} m³ (12.6%) → Grey Water Tank 🔄`);
  console.log(`  ├─ Sanitary (fresh): ${jan2024.sanitary_fresh_m3} m³ (12.6%)`);
  console.log(`  └─ Cleaning: ${jan2024.cleaning_m3} m³ (2.0%)`);

  console.log('\nSistema Grey Water:');
  console.log(`  Captured from sinks: ${jan2024.handwashing_m3} m³`);
  console.log(`  Reused in toilets: ${jan2024.grey_water_reused_m3} m³`);
  console.log(`  Reuse rate: ${jan2024.reuse_rate_percent}%`);

  console.log('\nSanitary Water Composition:');
  console.log(`  Total: ${jan2024.sanitary_m3} m³`);
  console.log(`  ├─ Fresh: ${jan2024.sanitary_fresh_m3} m³ (50%)`);
  console.log(`  └─ Grey: ${jan2024.sanitary_grey_m3} m³ (50%) ♻️`);

  console.log('\nWater Balance:');
  console.log(`  Consumed (não retorna): ${jan2024.water_consumed_m3} m³ (1.7%)`);
  console.log(`  Discharged to sewer: ${jan2024.water_discharged_m3} m³ (${jan2024.return_rate_percent}%)`);

  console.log('\nSavings:');
  console.log(`  Fresh water saved this month: ${jan2024.grey_water_reused_m3} m³`);
  console.log(`  Annual projection: ${(jan2024.grey_water_reused_m3 * 12).toFixed(1)} m³/year 🌊`);
}

console.log('\n\n✅ Cálculos completos! Dados prontos para inserir na base de dados.');
console.log('\n💾 Ficheiro completo: scripts/calculated-water-metrics.json');
