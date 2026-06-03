document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const errEl = document.getElementById('authError');
  const data = Object.fromEntries(new FormData(form));
  btn.disabled = true;
  btn.textContent = 'Signing in...';
  errEl.classList.remove('show');
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (res.ok && result.code === 200) {
      window.location.href = '/dashboard';
    } else {
      errEl.textContent = result.message || 'Login failed';
      errEl.classList.add('show');
    }
  } catch {
    errEl.textContent = 'Connection error';
    errEl.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign in';
  }
});

document.getElementById('forgotForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const errEl = document.getElementById('authError');
  const email = form.email.value;
  btn.disabled = true;
  btn.textContent = 'Sending...';
  errEl.classList.remove('show');
  try {
    const res = await fetch('/api/auth/forget-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const result = await res.json();
    form.innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <svg viewBox="0 0 24 24" width="48" height="48" style="color:#4ade80;margin-bottom:16px" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <p style="color:#fff;font-size:16px;font-weight:500;margin-bottom:8px">Check your email</p>
        <p style="color:#666;font-size:14px">If an admin account exists for ${email}, we've sent a reset link.</p>
      </div>
    `;
  } catch {
    errEl.textContent = 'Connection error';
    errEl.classList.add('show');
    btn.disabled = false;
    btn.textContent = 'Send reset link';
  }
});

document.getElementById('resetForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const errEl = document.getElementById('authError');
  const password = form.password.value;
  const confirm = form.confirm.value;
  errEl.classList.remove('show');
  if (password !== confirm) {
    errEl.textContent = 'Passwords do not match';
    errEl.classList.add('show');
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Resetting...';
  try {
    const token = window.location.pathname.split('/').pop();
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const result = await res.json();
    if (res.ok && result.code === 200) {
      form.innerHTML = `
        <div style="text-align:center;padding:20px 0">
          <svg viewBox="0 0 24 24" width="48" height="48" style="color:#4ade80;margin-bottom:16px" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <p style="color:#fff;font-size:16px;font-weight:500;margin-bottom:8px">Password reset successful</p>
          <p style="color:#666;font-size:14px;margin-bottom:20px">You can now sign in with your new password.</p>
          <a href="/auth/login" class="btn btn-primary" style="display:inline-flex">Sign in</a>
        </div>
      `;
    } else {
      errEl.textContent = result.message || 'Reset failed';
      errEl.classList.add('show');
    }
  } catch {
    errEl.textContent = 'Connection error';
    errEl.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Reset password';
  }
});
