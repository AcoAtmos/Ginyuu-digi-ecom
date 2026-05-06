
// ════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════
function showToast(msg) {
  if (!document.getElementById('toastContainer')) {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    const styleHeader = document.createElement('style');
    styleHeader.textContent = `
        .toast-container {
            position: fixed; bottom: 24px; left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            display: flex; flex-direction: column; gap: 8px;
            align-items: center;
            pointer-events: none;
        }
        .toast {
            background: var(--bg2); border: 1px solid var(--border2);
            color: var(--text); font-size: 14px;
            padding: 11px 20px; border-radius: 999px;
            box-shadow: var(--shadow);
            display: flex; align-items: center; gap: 8px;
            animation: toastIn .3s ease;
            pointer-events: all;
        }
        @keyframes toastIn {
            from { opacity: 0; transform: translateY(16px) scale(.95); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .toast.hide { animation: toastOut .3s ease forwards; }
        @keyframes toastOut {
            to { opacity: 0; transform: translateY(8px) scale(.95); }
        }
    `;
    document.head.appendChild(styleHeader);
  }

  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// ════════════════════════════════════════════
// CHECK COOKIE
// ════════════════════════════════════════════
function isCookieSet(name) {
  return document.cookie
    .split("; ")
    .some((cookie) => cookie.startsWith(name + "="));
}

function setCookie(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(n) {
  let a = `; ${document.cookie}`.match(`;\\s*${n}=([^;]+)`);
  return a ? decodeURIComponent(a[1]) : "";
}

function deleteCookie(name, path = '/') {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=' + path;
}


// ════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════
async function Login(email, password) {
    try {
        const response = await fetch("http://localhost:4100/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: 'include',
            body: JSON.stringify({
                email,
                password,
            }),
        });
        if (response.ok) {
            const data = await response.json();
            if (data.status === "success") {
                return { status: "success", message: "Login successful", data: data.data }; 
            } else {
                return { status: "error", message: data.message };
            }
        } else {
            const error = await response.json();
            return { status: "error", message: error.message };
        }
    } catch (error) {
        console.error("Error during login:", error);
        return { status: "error", message: "An error occurred during login" };
    } 
}

async function register(username, email, password, confirmPass, terms) {
  if (!username || !email || !password || !confirmPass) {
    showToast('⚠️ Fill all the fields');
    return;
  }

  if (username.length < 4) {
    showToast('⚠️ Username minimal 4 characters');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('⚠️ Invalid email format');
    return;
  }

  if (password.length < 8) {
    showToast('⚠️ Password minimal 8 characters');
    return;
  }

  if (password !== confirmPass) {
    showToast('⚠️ Password does not match');
    return;
  }

  if (!terms) {
    showToast('⚠️ Please agree to the terms and conditions');
    return;
  }
  
  try {
        const response = await fetch("http://localhost:4100/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: 'include',
            body: JSON.stringify({
                username,
                email, 
                password,
                terms
            }),
        });
        if (response.ok) {
            const data = await response.json();
            if (data.status === "success") {
                return { status: "success", message: "Register successful" };  
            } else {
                return { status: "error", message: data.message };
            }
        } else {
            const error = await response.json();
            return { status: "error", message: error.message };
        }
    } catch (error) {
        console.error("Error during register:", error);
        return { status: "error", message: "An error occurred during register" };
    } 
}

async function logout() {
    try {
        await fetch("http://localhost:4100/api/auth/logout", {
            method: "POST",
            credentials: 'include',
        });
    } catch (err) {
        console.error("Logout API call failed:", err);
    }
    deleteCookie("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    showToast("Logout successful");
    window.location.href = "/";
}
// ════════════════════════════════════════════
// AUTH CHECK & AUTO LOGOUT
// ════════════════════════════════════════════

/**
 * Verify if user is still authenticated.
 * Returns user data if valid, null if expired/guest.
 * Automatically clears localStorage on expiry.
 */
async function checkAuthStatus() {
    try {
        const res = await fetch("http://localhost:4100/api/auth/verify_token", {
            method: "POST",
            credentials: 'include',
        });
        if (res.ok) {
            const json = await res.json();
            if (json.data?.user) {
                return json.data.user;
            }
        }
    } catch (err) {
        // Connection refused or network error — user is guest
    }
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    return null;
}

export {
    isCookieSet,
    setCookie,
    getCookie,
    deleteCookie,
    checkAuthStatus,
    Login,
    logout,
    register,
    showToast
}
