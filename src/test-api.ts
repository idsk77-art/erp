import { buildServer } from './server/app.js';
import { loadConfig } from './config/env.js';

async function runTests() {
  console.log('=== STARTING INTEGRATION TESTS ===');
  
  const config = loadConfig();
  // Override environment to test and use mock providers
  config.env = 'test';
  config.port = 3001; // use separate port for test
  config.ocrProvider = 'mock';
  config.speechToTextProvider = 'mock';
  config.geminiApiKey = '';
  
  const server = await buildServer(config);
  
  try {
    await server.listen({ host: '127.0.0.1', port: config.port });
    console.log(`Test server listening on port ${config.port}`);
    
    const baseUrl = `http://127.0.0.1:${config.port}`;
    
    // 1. Test Health
    console.log('\n1. Testing Health Endpoint...');
    const healthRes = await fetch(`${baseUrl}/health`);
    if (!healthRes.ok) throw new Error('Health check failed');
    const health = await healthRes.json() as any;
    console.log('Health check response:', health);
    if (health.service !== 'ruah-note') throw new Error('Incorrect service name');
    
    // 2. Test Auth Callback (Get Token)
    console.log('\n2. Testing Mock Auth Callback...');
    const authRes = await fetch(`${baseUrl}/auth/google/callback?code=mock-code-test-user`);
    if (!authRes.ok) throw new Error('Auth callback failed');
    const auth = await authRes.json() as any;
    const token = auth.token;
    console.log('Generated token successfully.');
    
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
    };

    // 3. Test Todo Lifecycle
    console.log('\n3. Testing Todo Lifecycle...');
    const createTodoRes = await fetch(`${baseUrl}/api/todos`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test Todo Item' }),
    });
    if (!createTodoRes.ok) throw new Error('Create todo failed');
    const todo = (await createTodoRes.json() as any).item;
    console.log('Created Todo:', todo);

    const listTodosRes = await fetch(`${baseUrl}/api/todos`, { headers: authHeaders });
    const todos = await listTodosRes.json() as any;
    console.log('List Todos Count:', todos.items.length);
    if (todos.items.length === 0) throw new Error('Todo was not listed');

    const updateTodoRes = await fetch(`${baseUrl}/api/todos/${todo.id}`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated Test Todo Item' }),
    });
    if (!updateTodoRes.ok) throw new Error('Update todo failed');
    console.log('Updated Todo Title successfully.');

    const deleteTodoRes = await fetch(`${baseUrl}/api/todos/${todo.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (!deleteTodoRes.ok) throw new Error('Delete todo failed');
    console.log('Deleted Todo successfully.');

    // 4. Test Calendar Events Lifecycle
    console.log('\n4. Testing Calendar Events Lifecycle...');
    const createEventRes = await fetch(`${baseUrl}/api/calendar/events`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Event',
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 3600000).toISOString(),
      }),
    });
    if (!createEventRes.ok) throw new Error('Create event failed');
    const event = (await createEventRes.json() as any).item;
    console.log('Created Event:', event);

    const deleteEventRes = await fetch(`${baseUrl}/api/calendar/events/${event.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (!deleteEventRes.ok) throw new Error('Delete event failed');
    console.log('Deleted Event successfully.');

    // 5. Test Contacts Lifecycle
    console.log('\n5. Testing Contacts Lifecycle...');
    const createContactRes = await fetch(`${baseUrl}/api/contacts`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Tester',
        email: 'jane@test.com',
      }),
    });
    if (!createContactRes.ok) throw new Error('Create contact failed');
    const contact = (await createContactRes.json() as any).item;
    console.log('Created Contact:', contact);

    const deleteContactRes = await fetch(`${baseUrl}/api/contacts/${contact.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (!deleteContactRes.ok) throw new Error('Delete contact failed');
    console.log('Deleted Contact successfully.');

    // 6. Test Business Card OCR Upload
    console.log('\n6. Testing Business Card OCR Upload...');
    const dummyImage = new Blob([Buffer.from('dummy image content')], { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', dummyImage, 'john_doe_google.png');

    const ocrUploadRes = await fetch(`${baseUrl}/api/uploads/business-card`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });
    if (!ocrUploadRes.ok) throw new Error('OCR Upload failed');
    const ocrResult = await ocrUploadRes.json() as any;
    console.log('OCR Extraction Result:', ocrResult.scan);
    if (ocrResult.scan.result.name !== 'John Doe') {
      throw new Error('OCR mock name parsing failure');
    }

    // 7. Test Audio Upload & STT Polling
    console.log('\n7. Testing Audio Upload & Async STT...');
    const dummyAudio = new Blob([Buffer.from('dummy audio content')], { type: 'audio/mp3' });
    const audioFormData = new FormData();
    audioFormData.append('file', dummyAudio, 'weekly_sales_meeting.mp3');

    const audioUploadRes = await fetch(`${baseUrl}/api/uploads/audio`, {
      method: 'POST',
      headers: authHeaders,
      body: audioFormData,
    });
    if (!audioUploadRes.ok) throw new Error('Audio Upload failed');
    const audioResult = await audioUploadRes.json() as any;
    const reportId = audioResult.item.id;
    console.log('Audio Uploaded successfully. Report ID:', reportId);

    // Poll for status 'done'
    console.log('Polling for STT completion...');
    let attempts = 0;
    let completed = false;
    while (attempts < 10) {
      const getReportRes = await fetch(`${baseUrl}/api/reports/${reportId}`, { headers: authHeaders });
      const responseJson = await getReportRes.json() as any;
      const reportItem = responseJson.item;
      console.log(`Poll Attempt ${attempts + 1}: status = ${reportItem.status}`);
      if (reportItem.status === 'done') {
        console.log('STT Success! Title:', reportItem.title);
        console.log('Summary:', reportItem.summary);
        completed = true;
        break;
      }
      attempts++;
      await new Promise((r) => setTimeout(r, 1000));
    }
    if (!completed) throw new Error('STT Polling timed out');

    console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY ===');
    process.exit(0);

  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error(error);
    process.exit(1);
  } finally {
    await server.close();
  }
}

runTests();
