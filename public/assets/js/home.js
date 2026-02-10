document.addEventListener("DOMContentLoaded", async() => {
    const token = localStorage.getItem("token");
    // cek token
    if (!token){
        showSignin();
        return;
    } else{
        const data = await hit_api_verify_token(token);
        console.log(data);

        // ambil user dari local storage
        if (data.status === "success"){
            const user = await getUser(localStorage.getItem('user'));
            console.log(user);
            showProfile(user);
            dropdown();
            // klik di luar nutup dropdown
            document.addEventListener("click", (e) => {
                if (!e.target.closest(".profile-wrapper")) {
                    const dropdown = document.getElementById("profileDropdown");
                    dropdown.style.display = "none";
                }
            });
        } else {
            showSignin();
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        }
    }
});

async function hit_api_verify_token(token) {
    try {
        const response = await fetch("http://localhost:4100/api/auth/verify_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.log(error);
    }
}


function showProfile(user) {
    const btnSignin = document.getElementById("btnSignin");
    const navLinks = document.getElementById("navLinks");   
    
    btnSignin.style.display = "none";
    // make a profile img div  
    const profileLink = document.createElement("div");
    profileLink.className = "profile-wrapper";
    profileLink.innerHTML = ` 
        <img
          src="../../assets/img/profile/${user.image_url}"
          alt="Profile"
          class="profile-img"
          id="profileimg"
        />
        <div class="profile-dropdown" id="profileDropdown">
          <a href="/dashboard">Dashboard</a>
          <a href="/products">My Products</a>
          <a href="/settings">Settings</a>
          <hr />
          <a href="#" onclick="logout()" class="logout">Logout</a>
        </div>
    `;
    // append profile img div to navLinks
    navLinks.appendChild(profileLink);
}

function showSignin() {
    const btnSignin = document.getElementById("btnSignin");
    btnSignin.style.display = "block";
}

// dropdown 
function dropdown() {
    const toggle = document.getElementById("profileimg");
    const dropdown = document.getElementById("profileDropdown");    
    toggle.addEventListener("click", () => {
        dropdown.style.display =
        dropdown.style.display === "block" ? "none" : "block";
    });
}

// utils
async function getUser(data) {
    const user = JSON.parse(data);
    return user;
}
const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/page/home";
}
