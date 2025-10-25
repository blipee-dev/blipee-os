// Debug the gap calculation

// From the modal display:
const currentEmissions = 690.4; // tCO2e (shown in modal)
const targetEmissions = 249.0;  // tCO2e (shown in modal)
const totalReduction = 716.7;   // tCO2e (shown in modal - WRONG!)

console.log('🔍 Analyzing gap calculation...\n');

console.log('Modal Display:');
console.log('  Current Emissions:', currentEmissions, 'tCO2e');
console.log('  Target Emissions:', targetEmissions, 'tCO2e');
console.log('  Total Reduction:', totalReduction, 'tCO2e');

console.log('\n📐 Expected Calculation:');
const expectedGap = currentEmissions - targetEmissions;
console.log('  Gap = Current - Target');
console.log('  Gap =', currentEmissions, '-', targetEmissions);
console.log('  Gap =', expectedGap.toFixed(1), 'tCO2e ✅ CORRECT');

console.log('\n❌ What the API seems to be returning:');
console.log('  Total Reduction:', totalReduction, 'tCO2e');
console.log('  This is', (totalReduction - expectedGap).toFixed(1), 'tCO2e too high');

console.log('\n🤔 Possible causes:');
console.log('  1. API returns value in kg, modal divides by 1000, but value is already in tCO2e');
console.log('     716.7 * 1000 / 1000 = 716.7 ❌');
console.log('  2. Gap calculation uses wrong current emissions value');
console.log('     If gap calculation used 965.7 tCO2e as current:');
console.log('       965.7 - 249.0 =', (965.7 - 249.0).toFixed(1), 'tCO2e');
console.log('  3. Target value is wrong in replanning engine');
console.log('     If target was used as kg instead of tCO2e:');
console.log('       690.4 - 0.249 =', (690.4 - 0.249).toFixed(1), 'tCO2e ❌');
console.log('  4. Current emissions includes both YTD + forecast twice');
console.log('       (223.0 + 467.4) + 467.4 - 249.0 =', ((223.0 + 467.4) + 467.4 - 249.0).toFixed(1), 'tCO2e');
console.log('       OR: 223.0 + (467.4 * 2) - 249.0 =', (223.0 + (467.4 * 2) - 249.0).toFixed(1), 'tCO2e ❌ MAYBE?');

console.log('\n🔬 Let me reverse engineer the gap:');
console.log('  If totalReduction = currentEmissions - target:');
console.log('    716.7 = X - 249.0');
console.log('    X =', (716.7 + 249.0).toFixed(1), 'tCO2e');
console.log('  So the engine thinks current emissions is', (716.7 + 249.0).toFixed(1), 'tCO2e');
console.log('  But the modal shows current emissions as', currentEmissions, 'tCO2e');
console.log('  Difference:', (965.7 - 690.4).toFixed(1), 'tCO2e');
console.log('  That is ~275 tCO2e, which could be adding the forecast incorrectly');
