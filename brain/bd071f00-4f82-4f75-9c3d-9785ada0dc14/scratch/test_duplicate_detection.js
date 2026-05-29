import mongoose from 'file:///d:/Projects/FAQ/backend/node_modules/mongoose/index.js';

const BASE_URL = 'http://localhost:5000/api';
const randomStr = () => Math.random().toString(36).substring(2, 8);

const runDuplicateTests = async () => {
  console.log('🚀 --- STARTING DUPLICATE DETECTION WORKFLOW TESTS ---');

  const userData = { username: `user_${randomStr()}`, name: 'Student Author', email: `student_${randomStr()}@example.com`, password: 'Password123' };
  let token = '';
  let categoryId = '';
  
  // Set up mock organization IDs
  const org1Id = new mongoose.Types.ObjectId().toString();
  const org2Id = new mongoose.Types.ObjectId().toString();

  try {
    // 1. Register a user
    console.log('\n[1] Registering User...');
    let res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    let data = await res.json();
    token = data.data.accessToken;

    // Get a category ID
    console.log('[2] Fetching categories...');
    res = await fetch(`${BASE_URL}/categories`);
    data = await res.json();
    categoryId = data.data[0]._id;

    // 2. Create questions in the database
    // Connect to database to associate organization ID directly
    console.log('[Database] Connecting to setup organization questions...');
    await mongoose.connect('mongodb://ahanabanerjee4:vFObx0OdPRHcitaT@ac-fgxefuf-shard-00-00.poetmkl.mongodb.net:27017,ac-fgxefuf-shard-00-01.poetmkl.mongodb.net:27017,ac-fgxefuf-shard-00-02.poetmkl.mongodb.net:27017/?ssl=true&replicaSet=atlas-134l8s-shard-0&authSource=admin&appName=faq');
    
    // Create Question 1 belonging to Org 1
    console.log('\n[3] Creating Question 1 (Org 1)...');
    res = await fetch(`${BASE_URL}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'How to deploy MERN application on Heroku?',
        body: 'I am struggling with deploying my full-stack MERN dashboard onto Heroku. It keeps crashing with index.js errors.',
        tags: ['mern', 'heroku', 'deploy'],
        category: categoryId
      })
    });
    data = await res.json();
    const q1Id = data.data._id;
    
    // Update Question 1's organizationId in Database
    await mongoose.connection.db.collection('questions').updateOne(
      { _id: new mongoose.Types.ObjectId(q1Id) },
      { $set: { organizationId: new mongoose.Types.ObjectId(org1Id), isFAQ: true } }
    );
    console.log(`Question 1 created. ID: ${q1Id}, associated with Org 1, marked as FAQ.`);

    // Create Question 2 belonging to Org 2
    console.log('\n[4] Creating Question 2 (Org 2)...');
    res = await fetch(`${BASE_URL}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'How to deploy MERN application on AWS EC2?',
        body: 'I need steps to run my Node Express and React project in production on AWS EC2 behind Nginx reverse proxy.',
        tags: ['mern', 'aws', 'deploy'],
        category: categoryId
      })
    });
    data = await res.json();
    const q2Id = data.data._id;
    
    // Update Question 2's organizationId in Database
    await mongoose.connection.db.collection('questions').updateOne(
      { _id: new mongoose.Types.ObjectId(q2Id) },
      { $set: { organizationId: new mongoose.Types.ObjectId(org2Id), isFAQ: false } }
    );
    console.log(`Question 2 created. ID: ${q2Id}, associated with Org 2.`);

    // 3. TEST POST /questions/duplicates
    console.log('\n[5] Querying duplicates for Org 1 (should find Heroku MERN deploy, NOT AWS MERN deploy)...');
    res = await fetch(`${BASE_URL}/questions/duplicates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'deploying MERN app',
        organizationId: org1Id,
        tags: ['mern']
      })
    });
    data = await res.json();
    console.log('Duplicates Org 1 response:', JSON.stringify(data, null, 2));
    if (!data.success) {
      throw new Error('Duplicate query failed.');
    }
    if (data.data.length !== 1) {
      throw new Error(`Expected exactly 1 duplicate match for Org 1, got ${data.data.length}`);
    }
    if (data.data[0]._id !== q1Id) {
      throw new Error(`Expected match to be Question 1 (${q1Id}), got ${data.data[0]._id}`);
    }
    if (!data.data[0].isFAQ) {
      throw new Error('Expected isFAQ to be true for Question 1');
    }
    if (typeof data.data[0].similarity !== 'number' || data.data[0].similarity <= 0) {
      throw new Error(`Expected numeric similarity percentage > 0, got ${data.data[0].similarity}`);
    }
    console.log(`Success: Found Heroku MERN question. similarity: ${data.data[0].similarity}%`);

    console.log('\n[6] Querying duplicates for Org 2 (should find AWS MERN deploy, NOT Heroku MERN deploy)...');
    res = await fetch(`${BASE_URL}/questions/duplicates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'deploying MERN app',
        organizationId: org2Id,
        tags: ['mern']
      })
    });
    data = await res.json();
    console.log('Duplicates Org 2 response:', JSON.stringify(data, null, 2));
    if (!data.success) {
      throw new Error('Duplicate query failed.');
    }
    if (data.data.length !== 1) {
      throw new Error(`Expected exactly 1 duplicate match for Org 2, got ${data.data.length}`);
    }
    if (data.data[0]._id !== q2Id) {
      throw new Error(`Expected match to be Question 2 (${q2Id}), got ${data.data[0]._id}`);
    }
    if (data.data[0].isFAQ) {
      throw new Error('Expected isFAQ to be false for Question 2');
    }
    console.log(`Success: Found AWS MERN question. similarity: ${data.data[0].similarity}%`);

    console.log('\n🎉 --- ALL DUPLICATE DETECTION WORKFLOW INTEGRATION TESTS PASSED ---');
  } catch (error) {
    console.error('Test Suite Failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runDuplicateTests();
