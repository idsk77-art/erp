let currentUser = null;

async function api(path, options = {}) {
  const hasBody = options.body !== undefined;
  const isMultipart = options.body instanceof FormData;
  
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(hasBody && !isMultipart ? { 'content-type': 'application/json' } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (response.status === 401) {
    showLogin();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function checkAuth() {
  try {
    const user = await api('/api/me');
    showApp(user);
  } catch (error) {
    showLogin();
  }
}

function showApp(user) {
  currentUser = user;
  document.querySelector('#loginScreen').style.display = 'none';
  document.querySelector('#appScreen').style.display = 'block';
  
  const profileArea = document.querySelector('#userProfileArea');
  profileArea.style.display = 'flex';
  document.querySelector('#userName').textContent = user.name;
  document.querySelector('#userPicture').src = user.profileImageUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
  
  refreshAll().catch(console.error);
}

function showLogin() {
  currentUser = null;
  document.querySelector('#loginScreen').style.display = 'flex';
  document.querySelector('#appScreen').style.display = 'none';
  document.querySelector('#userProfileArea').style.display = 'none';
}

function renderList(selector, items, renderItem) {
  const list = document.querySelector(selector);
  list.replaceChildren();

  if (items.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'muted';
    empty.textContent = 'No items yet.';
    list.append(empty);
    return;
  }

  for (const item of items) {
    list.append(renderItem(item));
  }
}

function row(text, actions = []) {
  const li = document.createElement('li');
  const label = document.createElement('span');
  label.textContent = text;
  li.append(label);

  if (actions.length > 0) {
    const actionGroup = document.createElement('span');
    actionGroup.className = 'row-actions';

    for (const action of actions) {
      const button = document.createElement('button');
      button.className = 'ghost-button';
      button.textContent = action.label;
      button.addEventListener('click', action.onClick);
      actionGroup.append(button);
    }

    li.append(actionGroup);
  }

  return li;
}

async function refreshAll() {
  const [todos, events, contacts, documents, reports] = await Promise.all([
    api('/api/todos'),
    api('/api/calendar/events'),
    api('/api/contacts'),
    api('/api/documents'),
    api('/api/reports'),
  ]);

  renderList('#todoList', todos.items, (item) =>
    row(`${item.completed ? '[done]' : '[todo]'} ${item.title}`, [
      {
        label: item.completed ? 'Reopen' : 'Done',
        onClick: async () => {
          await api(`/api/todos/${item.id}/completion`, {
            method: 'PATCH',
            body: JSON.stringify({ completed: !item.completed }),
          });
          await refreshAll();
        },
      },
      {
        label: 'Delete',
        onClick: async () => {
          await api(`/api/todos/${item.id}`, { method: 'DELETE' });
          await refreshAll();
        },
      },
    ]),
  );

  renderList('#eventList', events.items, (item) =>
    row(item.title, [
      {
        label: 'Delete',
        onClick: async () => {
          await api(`/api/calendar/events/${item.id}`, { method: 'DELETE' });
          await refreshAll();
        },
      },
    ]),
  );

  renderList('#contactList', contacts.items, (item) =>
    row(item.email ? `${item.name} / ${item.email}` : item.name, [
      {
        label: 'Delete',
        onClick: async () => {
          await api(`/api/contacts/${item.id}`, { method: 'DELETE' });
          await refreshAll();
        },
      },
    ]),
  );

  renderList('#documentList', documents.items, (item) =>
    row(item.title, [
      {
        label: 'Delete',
        onClick: async () => {
          await api(`/api/documents/${item.id}`, { method: 'DELETE' });
          await refreshAll();
        },
      },
    ]),
  );

  renderList('#reportList', reports.items, (item) => {
    let text = `${item.title ?? item.audioFilePath} [${item.status}]`;
    if (item.status === 'done' && item.summary) {
      text += ` - 요약: ${item.summary}`;
    }
    return row(text, [
      {
        label: 'Delete',
        onClick: async () => {
          await api(`/api/reports/${item.id}`, { method: 'DELETE' });
          await refreshAll();
        },
      },
    ]);
  });

  // Auto-poll if any report is in queued/processing state
  const hasPending = reports.items.some((r) => r.status === 'queued' || r.status === 'processing');
  if (hasPending && !window.pollActive) {
    window.pollActive = true;
    setTimeout(() => {
      window.pollActive = false;
      refreshAll().catch(console.error);
    }, 3000);
  }
}

async function uploadFile(path, inputSelector) {
  const input = document.querySelector(inputSelector);
  const file = input.files?.[0];

  if (!file) {
    throw new Error('선택된 파일이 없습니다. 파일을 먼저 선택해 주세요.');
  }

  const formData = new FormData();
  formData.append('file', file);
  const res = await api(path, {
    method: 'POST',
    body: formData,
  });
  input.value = '';
  await refreshAll();
  return res;
}

async function handleUpload(path, inputSelector) {
  try {
    return await uploadFile(path, inputSelector);
  } catch (error) {
    alert(error.message);
  }
}

// Business Card Upload and OCR Review Flow
const ocrModal = document.querySelector('#ocrModal');
const closeOcrModal = document.querySelector('#closeOcrModal');
const saveOcrContact = document.querySelector('#saveOcrContact');

closeOcrModal.addEventListener('click', () => {
  ocrModal.classList.remove('active');
});

document.querySelector('#uploadCard').addEventListener('click', async () => {
  const uploadButton = document.querySelector('#uploadCard');
  const originalText = uploadButton.textContent;
  
  try {
    uploadButton.disabled = true;
    uploadButton.textContent = '스캔 중...';
    
    const result = await uploadFile('/api/uploads/business-card', '#cardFile');
    if (result && result.scan && result.scan.status === 'done') {
      const data = result.scan.result;
      document.querySelector('#ocrName').value = data.name || '';
      document.querySelector('#ocrCompany').value = data.companyName || '';
      document.querySelector('#ocrJobTitle').value = data.jobTitle || '';
      document.querySelector('#ocrPhone').value = data.phoneNumber || '';
      document.querySelector('#ocrEmail').value = data.email || '';
      document.querySelector('#ocrRawText').textContent = data.rawText || '';
      
      ocrModal.classList.add('active');
    }
  } catch (error) {
    alert('OCR 스캔에 실패했습니다: ' + error.message);
  } finally {
    uploadButton.disabled = false;
    uploadButton.textContent = originalText;
  }
});

saveOcrContact.addEventListener('click', async () => {
  const name = document.querySelector('#ocrName').value.trim();
  const companyName = document.querySelector('#ocrCompany').value.trim();
  const jobTitle = document.querySelector('#ocrJobTitle').value.trim();
  const phoneNumber = document.querySelector('#ocrPhone').value.trim();
  const email = document.querySelector('#ocrEmail').value.trim();
  const memo = document.querySelector('#ocrRawText').textContent.trim();

  if (!name) {
    alert('이름은 필수 입력 항목입니다.');
    return;
  }

  await api('/api/contacts', {
    method: 'POST',
    body: JSON.stringify({
      name,
      companyName,
      jobTitle,
      phoneNumber,
      email,
      memo,
    }),
  });

  ocrModal.classList.remove('active');
  await refreshAll();
});

document.querySelector('#addTodo').addEventListener('click', async () => {
  const title = document.querySelector('#todoTitle').value.trim();
  if (!title) return;
  await api('/api/todos', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
  document.querySelector('#todoTitle').value = '';
  await refreshAll();
});

document.querySelector('#addEvent').addEventListener('click', async () => {
  const title = document.querySelector('#eventTitle').value.trim();
  if (!title) return;
  const startsAt = new Date().toISOString();
  const endsAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  await api('/api/calendar/events', {
    method: 'POST',
    body: JSON.stringify({ title, startsAt, endsAt }),
  });
  document.querySelector('#eventTitle').value = '';
  await refreshAll();
});

document.querySelector('#addContact').addEventListener('click', async () => {
  const name = document.querySelector('#contactName').value.trim();
  const email = document.querySelector('#contactEmail').value.trim();
  if (!name) return;
  await api('/api/contacts', {
    method: 'POST',
    body: JSON.stringify({ name, ...(email ? { email } : {}) }),
  });
  document.querySelector('#contactName').value = '';
  document.querySelector('#contactEmail').value = '';
  await refreshAll();
});

document
  .querySelector('#uploadDocument')
  .addEventListener('click', () => handleUpload('/api/uploads/document', '#documentFile'));

document
  .querySelector('#uploadAudio')
  .addEventListener('click', () => handleUpload('/api/uploads/audio', '#audioFile'));

document.querySelector('#googleLoginBtn').addEventListener('click', async () => {
  try {
    const response = await fetch('/auth/google/url');
    if (response.status === 501) {
      // Mock login for local dev if client id/secret are missing
      const callbackRes = await fetch('/auth/google/callback?code=mock-code-development');
      if (callbackRes.ok) {
        window.location.reload();
      } else {
        alert('Mock login failed.');
      }
      return;
    }
    const data = await response.json();
    window.location.href = data.url;
  } catch (error) {
    alert('로그인 요청 중 실패: ' + error.message);
  }
});

document.querySelector('#logoutBtn').addEventListener('click', () => {
  // Expire session cookie
  document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  showLogin();
});

async function boot() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  if (code) {
    try {
      const res = await fetch(`/auth/google/callback?code=${code}`);
      if (res.ok) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.error('Failed to exchange OAuth code:', e);
    }
  }

  await checkAuth();
}

boot().catch(console.error);

