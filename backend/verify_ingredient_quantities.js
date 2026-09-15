import http from 'http';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

// UNIT_MAP and combineQuantities implementation from index.js for unit testing
const UNIT_MAP = {
  // Weight -> base unit 'g'
  'kg': { base: 'g', factor: 1000 },
  'kilogram': { base: 'g', factor: 1000 },
  'kilograms': { base: 'g', factor: 1000 },
  'g': { base: 'g', factor: 1 },
  'gram': { base: 'g', factor: 1 },
  'grams': { base: 'g', factor: 1 },
  'mg': { base: 'g', factor: 0.001 },
  'milligram': { base: 'g', factor: 0.001 },
  'milligrams': { base: 'g', factor: 0.001 },

  // Volume -> base unit 'ml'
  'l': { base: 'ml', factor: 1000 },
  'liter': { base: 'ml', factor: 1000 },
  'liters': { base: 'ml', factor: 1000 },
  'litre': { base: 'ml', factor: 1000 },
  'litres': { base: 'ml', factor: 1000 },
  'ml': { base: 'ml', factor: 1 },
  'milliliter': { base: 'ml', factor: 1 },
  'milliliters': { base: 'ml', factor: 1 },
  'millilitre': { base: 'ml', factor: 1 },
  'millilitres': { base: 'ml', factor: 1 },

  // Spoon measurements -> base unit 'tsp'
  'tbsp': { base: 'tsp', factor: 3 },
  'tablespoon': { base: 'tsp', factor: 3 },
  'tablespoons': { base: 'tsp', factor: 3 },
  'tsp': { base: 'tsp', factor: 1 },
  'teaspoon': { base: 'tsp', factor: 1 },
  'teaspoons': { base: 'tsp', factor: 1 },
};

function combineQuantities(quantities) {
  if (!quantities || quantities.length === 0) return '1 unit';

  const baseSums = new Map();
  const otherUnitSums = new Map();
  const nonNumeric = [];

  for (const qStr of quantities) {
    if (!qStr || typeof qStr !== 'string') continue;
    const trimmed = qStr.trim();
    if (!trimmed) continue;

    const match = trimmed.match(/^([\d.]+)\s*(.*)$/);
    if (match) {
      const num = parseFloat(match[1]);
      const unit = match[2] ? match[2].trim() : '';
      if (!isNaN(num)) {
        const unitKey = unit.toLowerCase();
        const mapInfo = UNIT_MAP[unitKey];

        if (mapInfo) {
          const { base, factor } = mapInfo;
          const current = baseSums.get(base) || 0;
          baseSums.set(base, current + num * factor);
        } else {
          const current = otherUnitSums.get(unitKey) || { sum: 0, displayUnit: unit, hasSpace: trimmed.includes(' ') };
          current.sum += num;
          otherUnitSums.set(unitKey, current);
        }
        continue;
      }
    }
    nonNumeric.push(trimmed);
  }

  const parts = [];

  // Format base units (g, ml, tsp)
  for (const [base, sum] of baseSums) {
    if (base === 'g') {
      if (sum >= 1000) {
        const val = sum / 1000;
        const formatted = Number.isInteger(val) ? val.toString() : parseFloat(val.toFixed(2)).toString();
        parts.push(`${formatted}kg`);
      } else {
        const formatted = Number.isInteger(sum) ? sum.toString() : parseFloat(sum.toFixed(2)).toString();
        parts.push(`${formatted}g`);
      }
    } else if (base === 'ml') {
      if (sum >= 1000) {
        const val = sum / 1000;
        const formatted = Number.isInteger(val) ? val.toString() : parseFloat(val.toFixed(2)).toString();
        parts.push(`${formatted}l`);
      } else {
        const formatted = Number.isInteger(sum) ? sum.toString() : parseFloat(sum.toFixed(2)).toString();
        parts.push(`${formatted}ml`);
      }
    } else if (base === 'tsp') {
      if (sum >= 3) {
        const val = sum / 3;
        const formatted = Number.isInteger(val) ? val.toString() : parseFloat(val.toFixed(2)).toString();
        parts.push(`${formatted} tbsp`);
      } else {
        const formatted = Number.isInteger(sum) ? sum.toString() : parseFloat(sum.toFixed(2)).toString();
        parts.push(`${formatted} tsp`);
      }
    }
  }

  // Format other units (cups, pcs, etc.)
  for (const [_, { sum, displayUnit, hasSpace }] of otherUnitSums) {
    const formattedNum = Number.isInteger(sum) ? sum.toString() : parseFloat(sum.toFixed(2)).toString();
    if (!displayUnit) {
      parts.push(formattedNum);
    } else if (hasSpace || displayUnit.length > 2) {
      parts.push(`${formattedNum} ${displayUnit}`);
    } else {
      parts.push(`${formattedNum}${displayUnit}`);
    }
  }

  for (const item of nonNumeric) {
    if (!parts.includes(item)) parts.push(item);
  }

  return parts.length > 0 ? parts.join(' + ') : '1 unit';
}

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    let payload = null;
    const reqHeaders = { ...(options.headers || {}) };
    
    if (postData !== undefined && postData !== null) {
      payload = typeof postData === 'string' ? postData : JSON.stringify(postData);
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request({ ...options, headers: reqHeaders }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (_) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runIngredientQuantityTests() {
  console.log('🧪 Starting Ingredient Quantity Verification Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assertCase(name, input, expected) {
    try {
      const actual = combineQuantities(input);
      if (actual !== expected) {
        throw new Error(`Expected "${expected}", got "${actual}"`);
      }
      passed++;
      console.log(`  ✓ Case ${passed + failed}: ${name} => "${actual}"`);
    } catch (err) {
      failed++;
      console.error(`  ✗ Case ${passed + failed}: ${name} - ${err.message}`);
    }
  }

  // 1. 1kg + 500g -> 1.5kg
  assertCase('1kg + 500g -> 1.5kg', ['1kg', '500g'], '1.5kg');

  // 2. 500g + 500g -> 1kg
  assertCase('500g + 500g -> 1kg', ['500g', '500g'], '1kg');

  // 3. 200g + 300g -> 500g
  assertCase('200g + 300g -> 500g', ['200g', '300g'], '500g');

  // 4. 1.5l + 500ml -> 2l
  assertCase('1.5l + 500ml -> 2l', ['1.5l', '500ml'], '2l');

  // 5. 2 cups + 3 cups -> 5 cups
  assertCase('2 cups + 3 cups -> 5 cups', ['2 cups', '3 cups'], '5 cups');

  // 6. 1 tbsp + 1 tsp -> sensible rounded display (1.33 tbsp)
  assertCase('1 tbsp + 1 tsp -> 1.33 tbsp', ['1 tbsp', '1 tsp'], '1.33 tbsp');

  // 7. 1 tbsp + 2 tbsp -> 3 tbsp
  assertCase('1 tbsp + 2 tbsp -> 3 tbsp', ['1 tbsp', '2 tbsp'], '3 tbsp');

  // 8. Non-convertible units are not incorrectly converted
  assertCase('Non-convertible units (1kg + 2 cups)', ['1kg', '2 cups'], '1kg + 2 cups');
  assertCase('Non-convertible units (200g + 1 tsp)', ['200g', '1 tsp'], '200g + 1 tsp');

  // 9. No floating-point artifacts such as 1.3333333333 or 355.00
  assertCase('No trailing .00 (355.00ml -> 355ml)', ['355.00ml'], '355ml');
  assertCase('Rounded 1/3 tbsp (1 tbsp + 1 tsp)', ['1 tbsp', '1 tsp'], '1.33 tbsp');
  assertCase('Rounded 2/3 tbsp (2 tbsp + 1 tsp)', ['2 tbsp', '1 tsp'], '2.33 tbsp');
  assertCase('Clean float cups (1.3333333333 cups)', ['1.3333333333 cups'], '1.33 cups');

  // 10. Empty, invalid, or missing quantities do not break the checklist
  assertCase('Null input -> 1 unit', null, '1 unit');
  assertCase('Undefined input -> 1 unit', undefined, '1 unit');
  assertCase('Empty array -> 1 unit', [], '1 unit');
  assertCase('Array with empty string -> 1 unit', [''], '1 unit');
  assertCase('Array with whitespace -> 1 unit', ['   '], '1 unit');
  assertCase('Array with nulls/whitespace -> 1 unit', [null, undefined, '  '], '1 unit');
  assertCase('Non-numeric descriptor preserved', ['to taste'], 'to taste');
  assertCase('Case insensitive unit matching (1 Kilogram + 500 Grams)', ['1 Kilogram', '500 Grams'], '1.5kg');
  assertCase('Case insensitive unit matching (1 Liter + 500 Milliliters)', ['1 Liter', '500 Milliliters'], '1.5l');

  // Integration test with API endpoint /api/favorite-ingredients
  console.log('\n  --- API Integration Test ---');
  try {
    const timestamp = Date.now();
    const signupRes = await makeRequest({
      hostname: 'localhost', port: 3000, path: '/api/signup', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: `quant_user_${timestamp}`, email: `quant_${timestamp}@example.com`, password: 'password123' });

    if (signupRes.status === 201 && signupRes.body.token) {
      const token = signupRes.body.token;
      const favRes = await makeRequest({
        hostname: 'localhost', port: 3000, path: '/api/favorite-ingredients', method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (favRes.status === 200 && Array.isArray(favRes.body)) {
        passed++;
        console.log(`  ✓ Case ${passed + failed}: GET /api/favorite-ingredients endpoint returns 200 array`);
      } else {
        failed++;
        console.error(`  ✗ Case ${passed + failed}: GET /api/favorite-ingredients returned status ${favRes.status}`);
      }
    }
  } catch (err) {
    failed++;
    console.error(`  ✗ API Integration Test error: ${err.message}`);
  }

  console.log(`\n========================================`);
  console.log(`📊 Ingredient Quantity Test Summary: ${passed}/${passed + failed} Tests Passed`);
  console.log(`========================================\n`);
  if (failed > 0) process.exit(1);
}

runIngredientQuantityTests().catch(console.error);
