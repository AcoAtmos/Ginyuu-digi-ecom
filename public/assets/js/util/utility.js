export const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/page/home";
}