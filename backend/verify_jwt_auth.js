import http from 'http';
import jwt from 'jsonwebtoken';

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

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function runTests() {
  console.log('🧪 Starting Tastybite JWT Authentication & Ownership Security Test Suite...\n');
  let passed = 0;
  let failed = 0;

  async function assertTest(name, fn) {
    try {
      await fn();
      passed++;
      console.log(`  ✓ Test ${passed + failed}: ${name}`);
    } catch (err) {
      failed++;
      console.error(`  ✗ Test ${passed + failed}: ${name} - ${err.message}`);
    }
    await delay(30);
  }

  const timestamp = Date.now();
  const userAEmail = `jwt_usera_${timestamp}@example.com`;
  const userBEmail = `jwt_userb_${timestamp}@example.com`;
  let userAToken = null;
  let userBToken = null;
  let userAId = null;
  let userBId = null;
  let createdRecipeId = null;

  // 1. Signup User A
  await assertTest('Signup - User A signup succeeds and returns JWT', async () => {
    const res = await makeRequest({
      hostname: 'localhost', port: 3000, path: '/api/signup', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: `userA_${timestamp}`, email: userAEmail, password: 'password123' });
    
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status} ${JSON.stringify(res.body)}`);
    if (!res.body.token) throw new Error('Response missing JWT token');
    if (!res.body.user || !res.body.user.user_id) throw new Error('Response missing user profile');
    userAToken = res.body.token;
    userAId = res.body.user.user_id;
  });

  // 2. Signup User B
  await assertTest('Signup - User B signup succeeds and returns JWT', async () => {
    const res = await makeRequest({
      hostname: 'localhost', port: 3000, path: '/api/signup', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: `userB_${timestamp}`, email: userBEmail, password: 'password123' });

    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    if (!res.body.token) throw new Error('Response missing JWT token');
    userBToken = res.body.token;
    userBId = res.body.user.user_id;
  });

  // 3. Login User A returns valid JWT
  await assertTest('Login - Valid login returns JWT token and user info', async () => {
    const res = await makeRequest({
      hostname: 'localhost', port: 3000, path: '/api/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: userAEmail, password: 'password123' });

    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.token) throw new Error('Login response missing token');
    if (res.body.user.user_id !== userAId) throw new Error('User ID mismatch');
  });

  // 4. Missing JWT on protected route returns 401
  await assertTest('Auth Middleware - Missing JWT on protected route returns 401', async () => {
    const res = await makeRequest({
      hostname: 'localhost', port: 3000, path: '/api/favorites', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { recipe_id: 1 });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 5. Malformed JWT returns 401
  await assertTest('Auth Middleware - Malformed Authorization header returns 401', async () => {
    const res = await makeRequest({
      hostname: 'localhost', port: 3000, path: '/api/favorites', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'NotBearer invalidtoken123' }
    }, { recipe_id: 1 });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 6. Invalid token signature returns 401
  await assertTest('Auth Middleware - Invalid signature JWT returns 401', async () => {
    const invalidToken = jwt.sign({ user_id: userAId }, 'wrong_secret_key_123');
    const res = await makeRequest({
      hostname: 'localhost', port: 3000, path: '/api/favorites', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${invalidToken}` }
    }, { recipe_id: 1 });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 7. Expired JWT returns 401
  await assertTest('Auth Middleware - Expired JWT returns 401', async () => {
    const secret = process.env.JWT_SECRET || 'tastybite_jwt_secret_key_2026_verifiable_auth';
    const expiredToken = jwt.sign({ user_id: userAId }, secret, { expiresIn: '-1s' });
    const res = await makeRequest({
      hostname: 'localhost', port: 3000, path: '/api/favorites', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${expiredToken}` }
    }, { recipe_id: 1 });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 8. Recipe creation with valid JWT succeeds
  await assertTest('Protected Operations - User A creates recipe with valid JWT', async () => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const bodyParts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\nUser A Secret Pasta\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="description"\r\n\r\nTasty pasta recipe\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="cooking_time"\r\n\r\n25\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="ingredients"\r\n\r\n[{"name":"Pasta","quantity":"200g"}]\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="steps"\r\n\r\n[{"instruction":"Boil water"}]\r\n`,
      `--${boundary}--\r\n`
    ].join('');

    const res = await makeRequest({
      hostname: 'localhost', port: 3000, path: '/api/add-recipe', method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${userAToken}`
      }
    }, bodyParts);

    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status} ${JSON.stringify(res.body)}`);
    if (!res.body.success) throw new Error('Recipe creation failed');

    // Fetch recipes to find created recipe ID
    const recipesRes = await makeRequest({
      hostname: 'localhost', port: 3000, path: '/api/all-recipes', method: 'GET'
    });
    const created = recipesRes.body.find(r => r.title === 'User A Secret Pasta');
    if (!created) throw new Error('Could not find created recipe');
    createdRecipeId = created.recipe_id;
  });

  // 9. Client-supplied user_id cannot override JWT identity
  await assertTest('Identity Protection - Client-supplied user_id in body cannot override JWT token identity', async () => {
    // Attempting to add favorite for userBId while using userAToken
    const res = await makeRequest({
      hostname: 'localhost', port: 3000, path: '/api/favorites', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userAToken}`
      }
    }, { user_id: userBId, recipe_id: createdRecipeId }); // Client tries spoofing user_id = userBId

    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);

    // Verify favorite was recorded under User A (the token owner), NOT User B
    const userAFavs = await makeRequest({
      hostname: 'localhost', port: 3000, path: '/api/favorites', method: 'GET',
      headers: { 'Authorization': `Bearer ${userAToken}` }
    });
    const isUserAFav = userAFavs.body.some(r => r.recipe_id === createdRecipeId);
    if (!isUserAFav) throw new Error('Favorite was not added to authenticated User A');

    const userBFavs = await makeRequest({
      hostname: 'localhost', port: 3000, path: '/api/favorites', method: 'GET',
      headers: { 'Authorization': `Bearer ${userBToken}` }
    });
    const isUserBFav = userBFavs.body.some(r => r.recipe_id === createdRecipeId);
    if (isUserBFav) throw new Error('Security Breach: Client spoofed user_id overridden JWT identity!');
  });

  // 10. Authenticated User B cannot edit User A's recipe (403 Forbidden)
  await assertTest('Ownership Protection - User B cannot edit User A recipe (403 Forbidden)', async () => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const bodyParts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\nHacked Title\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="cooking_time"\r\n\r\n30\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="ingredients"\r\n\r\n[{"name":"Pasta","quantity":"200g"}]\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="steps"\r\n\r\n[{"instruction":"Boil water"}]\r\n`,
      `--${boundary}--\r\n`
    ].join('');

    const res = await makeRequest({
      hostname: 'localhost', port: 3000, path: `/api/recipes/${createdRecipeId}`, method: 'PUT',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${userBToken}`
      }
    }, bodyParts);

    if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  });

  // 11. Authenticated User B cannot delete User A's recipe (403 Forbidden)
  await assertTest('Ownership Protection - User B cannot delete User A recipe (403 Forbidden)', async () => {
    const res = await makeRequest({
      hostname: 'localhost', port: 3000, path: `/api/recipes/${createdRecipeId}`, method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userBToken}`
      }
    });

    if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  });

  // 12. Rating, Comment, and Ingredient operations use verified JWT identity
  await assertTest('Protected Operations - Rating, comment, and ingredient operations work with JWT', async () => {
    // Rating with User A JWT
    const rateRes = await makeRequest({
      hostname: 'localhost', port: 3000, path: `/api/recipes/${createdRecipeId}/rate`, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userAToken}` }
    }, { rating: 5 });
    if (rateRes.status !== 200 || !rateRes.body.success) throw new Error(`Rating failed: ${rateRes.status}`);

    // Comment with User A JWT
    const commentRes = await makeRequest({
      hostname: 'localhost', port: 3000, path: `/api/recipes/${createdRecipeId}/comments`, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userAToken}` }
    }, { comment: 'Delicious pasta recipe!' });
    if (commentRes.status !== 201) throw new Error(`Comment failed: ${commentRes.status}`);

    // Ingredient status with User A JWT
    const ingRes = await makeRequest({
      hostname: 'localhost', port: 3000, path: '/api/ingredient-status', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userAToken}` }
    }, { ingredient_id: 1, have: true });
    if (ingRes.status !== 200) throw new Error(`Ingredient status failed: ${ingRes.status}`);
  });

  // 13. Owner User A can edit their recipe
  await assertTest('Ownership Protection - Owner User A can edit own recipe', async () => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const bodyParts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\nUser A Updated Pasta\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="cooking_time"\r\n\r\n30\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="ingredients"\r\n\r\n[{"name":"Pasta","quantity":"300g"}]\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="steps"\r\n\r\n[{"instruction":"Boil water and cook pasta"}]\r\n`,
      `--${boundary}--\r\n`
    ].join('');

    const res = await makeRequest({
      hostname: 'localhost', port: 3000, path: `/api/recipes/${createdRecipeId}`, method: 'PUT',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${userAToken}`
      }
    }, bodyParts);

    if (res.status !== 200 || !res.body.success) throw new Error(`Expected 200, got ${res.status}`);
  });

  // 14. Owner User A can delete their recipe
  await assertTest('Ownership Protection - Owner User A can delete own recipe', async () => {
    const res = await makeRequest({
      hostname: 'localhost', port: 3000, path: `/api/recipes/${createdRecipeId}`, method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userAToken}`
      }
    });

    if (res.status !== 200 || !res.body.success) throw new Error(`Expected 200, got ${res.status}`);
  });

  // 15. Public routes remain accessible without JWT
  await assertTest('Public Endpoints - Read-only recipe and category endpoints succeed without JWT', async () => {
    const resAll = await makeRequest({ hostname: 'localhost', port: 3000, path: '/api/all-recipes', method: 'GET' });
    if (resAll.status !== 200 || !Array.isArray(resAll.body)) throw new Error(`All recipes failed: ${resAll.status}`);

    const resCat = await makeRequest({ hostname: 'localhost', port: 3000, path: '/api/categories', method: 'GET' });
    if (resCat.status !== 200 || !Array.isArray(resCat.body)) throw new Error(`Categories failed: ${resCat.status}`);

    const resHigh = await makeRequest({ hostname: 'localhost', port: 3000, path: '/api/high-rated-recipes', method: 'GET' });
    if (resHigh.status !== 200 || !Array.isArray(resHigh.body)) throw new Error(`High rated recipes failed: ${resHigh.status}`);
  });

  console.log(`\n========================================`);
  console.log(`📊 Test Summary: ${passed}/${passed + failed} Tests Passed`);
  console.log(`========================================\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch(console.error);
