// Test translations
const en = require('./src/messages/en.json');
const es = require('./src/messages/es.json');
const pt = require('./src/messages/pt.json');

function getNestedValue(obj, path) {
  try {
    return path.split('.').reduce((current, key) => current?.[key], obj) || path;
  } catch {
    return path;
  }
}

// Test useTranslations behavior
function testTranslations(messages, section) {
  const t = (key, params) => {
    const fullPath = `${section}.${key}`;
    let value = getNestedValue(messages, fullPath);
    if (value === fullPath) {
      console.log(`❌ Translation missing for key: ${fullPath}`);
    } else {
      console.log(`✅ ${fullPath}: "${value}"`);
    }
    return value;
  };
  return t;
}

console.log('\n=== Testing English Translations ===');
const tEn = testTranslations(en, 'settings.devices');
tEn('title');
tEn('subtitle');
tEn('searchPlaceholder');
tEn('noDevicesFound');
tEn('createFirstDevice');

console.log('\n=== Testing Modal Translations ===');
const tModal = testTranslations(en, 'settings.devices.modal');
tModal('addTitle');
tModal('editTitle');
tModal('fields.name');
tModal('sections.basicInfo');

console.log('\n=== Testing Direct Path Access ===');
console.log('Direct access settings.devices.title:', en.settings?.devices?.title);
console.log('Direct access settings.devices.modal.addTitle:', en.settings?.devices?.modal?.addTitle);

console.log('\n=== Testing Spanish ===');
const tEs = testTranslations(es, 'settings.devices');
tEs('title');

console.log('\n=== Testing Portuguese ===');
const tPt = testTranslations(pt, 'settings.devices');
tPt('title');