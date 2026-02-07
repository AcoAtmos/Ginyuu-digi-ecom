  const form = document.getElementById('registerForm');
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  const registerBtn = document.getElementById('registerBtn');

  // Show/hide password
  togglePassword.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
  });

  // Basic client-side validation
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let isValid = true;

    // Reset errors
    document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;
    let phone ="0" + document.getElementById('phone').value.trim();

    if (username.length < 2) { 
      document.getElementById('usernameError').style.display = 'block';
      isValid = false;
    }

    if (!email.includes('@') || !email.includes('.')) {
      document.getElementById('emailError').style.display = 'block';
      isValid = false;
    }

    if (phone.length < 10) {
      document.getElementById('phoneError').style.display = 'block';
      isValid = false;
    }

    if (password.length < 8) {
      document.getElementById('passwordError').style.display = 'block';
      isValid = false;
    }

    if (confirmPassword !== password) {
      document.getElementById('confirmPasswordError').style.display = 'block';
      isValid = false;
    }

    if (!terms) {
      alert('You must agree to the Terms of Service');
      isValid = false;
    }

    if (!isValid) return;

    // Simulate loading
    registerBtn.textContent = 'Creating account...';
    registerBtn.disabled = true;

    // make payload
    const payload = {
      username,
      email,
      phone,
      password,
      terms
    };

    // send to backend
    try{
    const response = await fetch("http://localhost:4100/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      console.log(response);
      const data = await response.json();
      if (data.success) {
        alert('Account created successfully! Welcome to Manjuu 🎉');
        window.location.href = '/profile.html';
      } else {
        alert(data.message);
      }
    }catch(err){
      console.log(err);
    }

});