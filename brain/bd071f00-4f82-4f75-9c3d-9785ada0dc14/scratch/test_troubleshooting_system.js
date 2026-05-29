import mongoose from 'file:///d:/Projects/FAQ/backend/node_modules/mongoose/index.js';

const BASE_URL = 'http://localhost:5000/api';
const randomStr = () => Math.random().toString(36).substring(2, 8);

const runTroubleshootingTests = async () => {
  console.log('🚀 --- STARTING TROUBLESHOOTING SYSTEM INTEGRATION TESTS ---');

  const userData = { username: `user_${randomStr()}`, name: 'Ticket Creator', email: `creator_${randomStr()}@example.com`, password: 'Password123' };
  const adminData = { username: `admin_${randomStr()}`, name: 'Admin Agent', email: `admin_${randomStr()}@example.com`, password: 'Password123' };

  let tokenUser = '';
  let tokenAdmin = '';
  let adminId = '';
  let ticketId = '';

  try {
    // 1. REGISTER USER & ADMIN
    console.log('\n[1] Registering User...');
    let res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    let data = await res.json();
    tokenUser = data.data.accessToken;
    console.log('User Registered. Token length:', tokenUser?.length);

    console.log('[2] Registering Admin...');
    res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminData)
    });
    data = await res.json();
    adminId = data.data.user._id;

    // Connect database and set role to admin
    console.log('[Database] Connecting to promote admin...');
    await mongoose.connect('mongodb://ahanabanerjee4:vFObx0OdPRHcitaT@ac-fgxefuf-shard-00-00.poetmkl.mongodb.net:27017,ac-fgxefuf-shard-00-01.poetmkl.mongodb.net:27017,ac-fgxefuf-shard-00-02.poetmkl.mongodb.net:27017/?ssl=true&replicaSet=atlas-134l8s-shard-0&authSource=admin&appName=faq');
    await mongoose.connection.db.collection('users').updateOne(
      { _id: new mongoose.Types.ObjectId(adminId) },
      { $set: { role: 'admin' } }
    );
    console.log('[Database] Admin role set.');

    // Login Admin
    res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminData.email, password: adminData.password })
    });
    data = await res.json();
    tokenAdmin = data.data.accessToken;
    console.log('Admin Logged in. Token length:', tokenAdmin?.length);

    // 2. CREATE TICKET WITH CATEGORY
    console.log('\n[3] User creating a support ticket with category "login"...');
    res = await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser}`
      },
      body: JSON.stringify({
        title: 'Cannot reset my user profile password',
        description: 'I tried sending the reset password link but the system keeps throwing 429 too many requests code, please help me clear the block.',
        category: 'login'
      })
    });
    data = await res.json();
    console.log('Create Ticket response:', JSON.stringify(data));
    if (!data.success) {
      throw new Error(`Failed to create ticket: ${JSON.stringify(data)}`);
    }
    ticketId = data.data._id;
    if (data.data.category !== 'login') {
      throw new Error(`Expected category "login", got "${data.data.category}"`);
    }
    console.log(`Ticket Created Successfully with ID: ${ticketId}`);

    // 3. FETCH USER TICKETS
    console.log('\n[4] User loading their support tickets...');
    res = await fetch(`${BASE_URL}/tickets`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokenUser}` }
    });
    data = await res.json();
    if (!data.success || data.data.length === 0) {
      throw new Error('User tickets list is empty or request failed.');
    }
    console.log(`User tickets found: ${data.data.length}. First title: "${data.data[0].title}"`);

    // 4. FETCH ADMIN TICKETS QUEUE
    console.log('\n[5] Admin loading support tickets queue...');
    res = await fetch(`${BASE_URL}/tickets`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokenAdmin}` }
    });
    data = await res.json();
    if (!data.success || data.data.length === 0) {
      throw new Error('Admin tickets queue is empty or request failed.');
    }
    console.log(`Admin queue tickets count: ${data.data.length}`);

    // 5. FETCH TICKET DETAILS (USER)
    console.log('\n[6] User fetching ticket detail by ID...');
    res = await fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokenUser}` }
    });
    data = await res.json();
    if (!data.success || !data.data.ticket) {
      throw new Error('Failed to load ticket detail for user.');
    }
    console.log(`Ticket detail loaded. Messages: ${data.data.messages.length}`);

    // 6. ADMIN ASSIGNS TICKET TO THEMSELVES
    console.log('\n[7] Admin assigning ticket to themselves...');
    res = await fetch(`${BASE_URL}/tickets/${ticketId}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({ assignedTo: adminId })
    });
    data = await res.json();
    if (!data.success) {
      throw new Error(`Failed to assign ticket: ${JSON.stringify(data)}`);
    }
    console.log(`Ticket assigned to: ${data.data.assignedTo}`);

    // 7. ADMIN RESPONDS TO TICKET
    console.log('\n[8] Admin sending response message in ticket discussion...');
    res = await fetch(`${BASE_URL}/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({ body: 'Hello. I have whitelisted your IP address. Please try resetting your password now.' })
    });
    data = await res.json();
    if (!data.success) {
      throw new Error(`Admin failed to post message: ${JSON.stringify(data)}`);
    }
    console.log(`Response message posted. Msg ID: ${data.data._id}`);

    // 8. USER REPLIES TO TICKET
    console.log('\n[9] User replying back in discussion...');
    res = await fetch(`${BASE_URL}/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser}`
      },
      body: JSON.stringify({ body: 'Thanks, Rajesh! The password reset worked fine now. You can resolve the ticket.' })
    });
    data = await res.json();
    if (!data.success) {
      throw new Error(`User failed to reply: ${JSON.stringify(data)}`);
    }
    console.log(`User reply message posted. Msg ID: ${data.data._id}`);

    // 9. ADMIN RESOLVES TICKET
    console.log('\n[10] Admin marking ticket status as resolved...');
    res = await fetch(`${BASE_URL}/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({ status: 'resolved' })
    });
    data = await res.json();
    if (!data.success) {
      throw new Error(`Failed to resolve ticket: ${JSON.stringify(data)}`);
    }
    console.log(`Ticket status resolved: ${data.data.status}`);

    // 10. VERIFY ALL MESSAGES AND DETAILS
    console.log('\n[11] Loading final ticket detail...');
    res = await fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokenUser}` }
    });
    data = await res.json();
    console.log(`Final message count in thread: ${data.data.messages.length}`);
    if (data.data.messages.length !== 2) {
      throw new Error(`Expected exactly 2 reply messages, got ${data.data.messages.length}`);
    }
    console.log(`Final ticket status is: ${data.data.ticket.status}`);
    if (data.data.ticket.status !== 'resolved') {
      throw new Error(`Expected ticket status resolved, got ${data.data.ticket.status}`);
    }

    console.log('\n🎉 --- ALL TROUBLESHOOTING SYSTEM INTEGRATION TESTS PASSED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runTroubleshootingTests();
