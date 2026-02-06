
// Very basic client-side validation + visual feedback
document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn = document.getElementById('loginBtn');

  if (!email || !password) {
    alert('Please fill in both email and password');
    return;
  }

  if (password.length < 6) {
    alert('Password must be at least 6 characters');
    return;
  }

  // Simulate loading state
  btn.textContent = 'Signing in...';
  btn.disabled = true;

  // Fake delay → in real app → fetch('/api/login', ...)
  setTimeout(() => {
    // Success simulation
    alert('Login successful! (demo)');
    btn.textContent = 'Sign In';
    btn.disabled = false;

    // Or redirect:
    // window.location.href = '/dashboard.html';
  }, 1400);
});

// Optional: show/hide password (you can add icon later)

