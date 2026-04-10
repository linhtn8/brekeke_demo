const WebSocket = require('ws');

async function runTests() {
  console.log("Starting Signaling Server Tests...\n");
  
  let passed = 0;
  let failed = 0;

  const assert = (condition, name) => {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${name}`);
      failed++;
    }
  };

  // Assuming server is running on ws://localhost:8080
  const serverUrl = 'ws://localhost:8080';
  
  let client1, client2;
  
  try {
    // Test: Multiple clients can connect
    client1 = new WebSocket(serverUrl);
    client2 = new WebSocket(serverUrl);
    
    await new Promise((resolve) => {
      let connected = 0;
      const onConnect = () => {
        connected++;
        if (connected === 2) resolve();
      };
      client1.on('open', onConnect);
      client2.on('open', onConnect);
      setTimeout(resolve, 2000); // timeout
    });
    
    assert(client1.readyState === WebSocket.OPEN && client2.readyState === WebSocket.OPEN, "Server starts successfully & Multiple clients can connect");

    // Test: User registration & Online users list updates
    const register1 = new Promise(resolve => {
      client1.on('message', data => {
        const msg = JSON.parse(data);
        if (msg.type === 'register-success') resolve(msg);
      });
    });
    
    client1.send(JSON.stringify({ type: 'register', userId: '101', userName: 'Test 1' }));
    const msg1 = await register1;
    assert(msg1.type === 'register-success' && msg1.userId === '101', "User registration works for Client 1");
    
    const register2 = new Promise(resolve => {
      client2.on('message', data => {
        const msg = JSON.parse(data);
        if (msg.type === 'register-success') resolve(msg);
      });
    });
    const userOnlineEvent = new Promise(resolve => {
      client1.on('message', data => {
        const msg = JSON.parse(data);
        if (msg.type === 'user-online') resolve(msg);
      });
    });

    client2.send(JSON.stringify({ type: 'register', userId: '102', userName: 'Test 2' }));
    const msg2 = await register2;
    assert(msg2.onlineUsers.includes('101'), "Online users list updates on connect");
    
    const onlineMsg = await userOnlineEvent;
    assert(onlineMsg.userId === '102', "User online broadcast works");

    // Test: Call offer forwarding
    const offerEvent = new Promise(resolve => {
      client2.on('message', data => {
        const msg = JSON.parse(data);
        if (msg.type === 'incoming-call') resolve(msg);
      });
    });
    client1.send(JSON.stringify({
      type: 'call-offer',
      to: '102',
      offer: { type: 'offer', sdp: 'dummy-sdp' },
      callerName: 'Test 1'
    }));
    const incomingCall = await offerEvent;
    assert(incomingCall.from === '101' && incomingCall.offer.type === 'offer', "Call offer forwarding");

    // Test: Call answer forwarding
    const answerEvent = new Promise(resolve => {
      client1.on('message', data => {
        const msg = JSON.parse(data);
        if (msg.type === 'call-answer') resolve(msg);
      });
    });
    client2.send(JSON.stringify({
      type: 'call-answer',
      to: '101',
      answer: { type: 'answer', sdp: 'dummy-sdp-answer' }
    }));
    const callAnswer = await answerEvent;
    assert(callAnswer.from === '102' && callAnswer.answer.type === 'answer', "Call answer forwarding");

    // Test: ICE candidate forwarding
    const iceEvent = new Promise(resolve => {
      client2.on('message', data => {
        const msg = JSON.parse(data);
        if (msg.type === 'ice-candidate') resolve(msg);
      });
    });
    client1.send(JSON.stringify({
      type: 'ice-candidate',
      to: '102',
      candidate: { candidate: 'dummy-ice' }
    }));
    const iceMsg = await iceEvent;
    assert(iceMsg.from === '101' && iceMsg.candidate.candidate === 'dummy-ice', "ICE candidate forwarding");

    // Test: User offline detection
    const offlineEvent = new Promise(resolve => {
      client1.on('message', data => {
        const msg = JSON.parse(data);
        if (msg.type === 'user-offline') resolve(msg);
      });
    });
    
    client2.close();
    const offlineMsg = await offlineEvent;
    assert(offlineMsg.userId === '102', "User offline detection");

  } catch (e) {
    console.error("Test error:", e);
  } finally {
    if (client1) client1.close();
    if (client2) client2.close();
  }

  console.log(`\nTests completed: ${passed} passed, ${failed} failed.`);
  if (failed === 0) {
    console.log("All Signaling Server Tests passed!");
  }
}

runTests();
