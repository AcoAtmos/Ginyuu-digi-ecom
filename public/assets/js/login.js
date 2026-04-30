document.getElementById('loginBtn').addEventListener('click', function(e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    alert('Please fill in both email and password');
    return;
  }

  if (password.length < 6) {
    alert('Password must be at least 6 characters');
    return;
  }

  hit_api_login(email, password); 
});

async function hit_api_login(email, password) {
  try {
    const res = await fetch(`${window.BE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    console.log("data", data); 

    if (data.status === "success") {
      window.location.href = "/page/home";
    }
  } catch (error) {
    console.log(error);
    alert("Login failed");
  }
}

