import {
  isCookieSet,
  setCookie,
  getCookie
} from "./main/main.js";

document.getElementById('loginBtn').addEventListener('click', function(e) {
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

  // hit api login
  // Simulate loading state
  hit_api_login(email, password); 
  


  // redirect to home page
 
});

async function hit_api_login(email, password){
  try{
    const res = await fetch(`http://localhost:4100/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    // parse data from BE
    const data = await res.json();
    
    // set data 
    // localStorage.setItem('token', data.data.token);
    setCookie('token', data.data.token, 1);
    localStorage.setItem('user', JSON.stringify(data.data.user));
  
    const token = data.token;
    if(data.status === "success"){
      window.location.href = "/page/home";
    }
  }catch(error){
    console.log(error);
    alert("Login failed");
  }
}


