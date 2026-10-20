const $ = selector => document.querySelector(selector);

export function createAccounts({getProgress, getGuestProgress, applyProgress, restoreGuest, notify}) {
  let user = null;
  let mode = 'login';
  let busy = false;
  let pending = null;
  let saveTimer;
  let chain = Promise.resolve();
  let generation = 0;
  let lastSaveFailed = false;
  let saving = false;
  let apiAvailable = true;
  let expired = false;
  const dialog = $('#auth-dialog');

  async function request(path, method = 'GET', payload) {
    const response = await fetch(path, {
      method, credentials: 'same-origin',
      headers: payload ? {'Content-Type': 'application/json'} : {},
      body: payload ? JSON.stringify(payload) : undefined,
    });
    let result;
    try { result = await response.json(); }
    catch { throw new Error('Start the app with python3 server.py to use local accounts.'); }
    if (!response.ok) {
      const error = new Error(result.error || 'That did not go through. Please try again.');
      error.status = response.status;
      throw error;
    }
    return result;
  }

  function status(text) { $('#save-status').textContent = text; }

  function renderAccount() {
    $('#login-button').hidden = !!user && !expired;
    $('#login-button').innerHTML = '<span aria-hidden="true">↪</span> ' + (expired ? 'Reconnect' : 'Log in');
    $('#account-details').hidden = !user || expired;
    $('#save-login').hidden = !!user && !expired;
    if (user) {
      $('#account-name').textContent = user.name;
      $('#account-full-name').textContent = user.name;
      $('#account-avatar').textContent = user.name.slice(0, 1).toUpperCase();
      $('#account-email').textContent = user.email;
      status(expired ? 'Your session expired. Log in again to save your progress.' : '✓ Progress saved to your local account.');
    } else {
      status('Guest progress is saved in this browser.');
      $('#account-details').open = false;
    }
  }

  function showError(message) {
    $('#auth-error').textContent = message;
    $('#auth-error').hidden = false;
  }

  function setMode(nextMode) {
    mode = nextMode;
    const register = mode === 'register';
    $('#auth-title').innerHTML = register ? 'Make it yours<span>.</span>' : 'Welcome back<span>.</span>';
    $('#auth-description').textContent = register ? 'A little progress deserves a place to call home.' : 'Your next adventure is right where you left it.';
    $('#auth-name-field').hidden = !register;
    $('#auth-name').required = register;
    $('#auth-import-row').hidden = !register;
    $('#password-help').hidden = !register;
    $('#auth-password').minLength = register ? 10 : 1;
    $('#auth-password').autocomplete = register ? 'new-password' : 'current-password';
    $('#auth-switch-copy').textContent = register ? 'Already part of the adventure?' : 'New around here?';
    $('#auth-switch').textContent = register ? 'Log in' : 'Create an account';
    $('#auth-submit').innerHTML = (register ? 'Create account' : 'Log in') + ' <span>→</span>';
    $('#auth-error').hidden = true;
    $('#auth-switch').disabled = expired;
  }

  function show(nextMode = 'login') {
    if (user && !expired) return;
    $('#auth-form').reset();
    $('#auth-password').type = 'password';
    $('#password-toggle').textContent = 'Show';
    $('#password-toggle').setAttribute('aria-label', 'Show password');
    $('#password-toggle').setAttribute('aria-pressed', 'false');
    setMode(expired ? 'login' : nextMode);
    $('#auth-email').readOnly = expired;
    if (expired) $('#auth-email').value = user.email;
    dialog.showModal();
    if (!apiAvailable) showError('Start the app with python3 server.py to use local accounts.');
  }

  function setBusy(value) {
    busy = value;
    $('#auth-submit').disabled = value;
    $('#auth-switch').disabled = value || expired;
    $('#auth-close').disabled = value;
    $('#auth-form').setAttribute('aria-busy', String(value));
    if (value) $('#auth-submit').textContent = mode === 'register' ? 'Creating your account…' : 'Logging you in…';
    else $('#auth-submit').innerHTML = (mode === 'register' ? 'Create account' : 'Log in') + ' <span>→</span>';
  }

  async function flush() {
    clearTimeout(saveTimer);
    if (!user || !pending || expired) return chain;
    const snapshot = pending;
    const owner = user.id;
    const epoch = generation;
    pending = null;
    chain = chain.catch(() => {}).then(async () => {
      if (user?.id !== owner || generation !== epoch) return;
      saving = true;
      status('Saving your progress…');
      try {
        await request('/api/progress', 'PUT', {progress: snapshot});
        lastSaveFailed = false;
        if (user?.id === owner && generation === epoch && !pending) status('✓ Progress saved to your local account.');
      } catch (error) {
        if (user?.id === owner && generation === epoch) {
          pending ||= snapshot;
          lastSaveFailed = true;
          if (error.status === 401) {
            expired = true;
            renderAccount();
          } else status('Progress has not saved. Keep this tab open; retry with your next command.');
          notify(error.message);
        }
        throw error;
      } finally { saving = false; }
    });
    return chain;
  }

  function save() {
    if (!user) return;
    pending = structuredClone(getProgress());
    if (expired) { status('Your session expired. Log in again to save your progress.'); return; }
    status('Saving your progress…');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => flush().catch(() => {}), 250);
  }

  $('#login-button').onclick = () => show();
  $('#save-login').onclick = () => show('register');
  $('#auth-close').onclick = () => dialog.close();
  dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  dialog.addEventListener('close', () => { $('#auth-password').value = ''; });
  $('#auth-switch').onclick = () => { if (!expired) setMode(mode === 'login' ? 'register' : 'login'); };
  $('#password-toggle').onclick = () => {
    const showPassword = $('#auth-password').type === 'password';
    $('#auth-password').type = showPassword ? 'text' : 'password';
    $('#password-toggle').textContent = showPassword ? 'Hide' : 'Show';
    $('#password-toggle').setAttribute('aria-label', showPassword ? 'Hide password' : 'Show password');
    $('#password-toggle').setAttribute('aria-pressed', String(showPassword));
  };

  $('#auth-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    $('#auth-error').hidden = true;
    const payload = {email: $('#auth-email').value.trim(), password: $('#auth-password').value};
    if (mode === 'register') {
      payload.name = $('#auth-name').value.trim();
      payload.progress = $('#auth-import').checked ? getGuestProgress() : {completed: [], sessions: {}};
    }
    setBusy(true);
    try {
      const result = await request('/api/auth/' + mode, 'POST', payload);
      const draft = expired ? structuredClone(getProgress()) : null;
      user = result.user;
      generation++;
      pending = null;
      lastSaveFailed = false;
      expired = false;
      const progress = draft ? {completed: [...new Set([...result.progress.completed, ...draft.completed])], sessions: {...result.progress.sessions, ...draft.sessions}} : result.progress;
      applyProgress(progress);
      renderAccount();
      if (draft) save();
      dialog.close();
      notify(mode === 'register' ? 'Your account is ready. Let’s make some progress.' : 'Welcome back, ' + user.name + '.');
    } catch (error) { showError(error.message); }
    finally { setBusy(false); }
  });

  $('#logout-button').onclick = async () => {
    const button = $('#logout-button');
    button.disabled = true;
    try {
      await flush();
      await request('/api/auth/logout', 'POST', {});
      clearTimeout(saveTimer);
      generation++;
      user = null;
      pending = null;
      lastSaveFailed = false;
      renderAccount();
      restoreGuest();
      notify('Logged out. Your account progress is saved.');
    } catch (error) { notify('Could not log out: ' + error.message); }
    finally { button.disabled = false; }
  };

  document.addEventListener('click', event => {
    if (!$('#account-details').contains(event.target)) $('#account-details').open = false;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush().catch(() => {});
  });
  window.addEventListener('beforeunload', event => {
    if (user && (pending || saving || lastSaveFailed)) { event.preventDefault(); event.returnValue = ''; }
  });

  return {
    isSignedIn: () => !!user,
    save,
    flush,
    async init() {
      try {
        const result = await request('/api/me');
        user = result.user;
        if (user) applyProgress(result.progress);
      } catch { apiAvailable = false; }
      renderAccount();
    },
  };
}
