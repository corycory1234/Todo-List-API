/*********************** 登入LOGIN *************************/
let loginBtn = document.querySelector("#loginBtn");
let email = document.querySelector("#email");
let password = document.querySelector("#password");
let apiUrl = "https://todoo.5xcamp.us";
let token = "";

// 監聽「登入」
loginBtn.addEventListener("click", (event) =>{
    if(email.value.trim() === "" || password.value.trim() === ""){
        Swal.fire({
            icon: 'error',
            title: '帳號密碼不可留白!!!',
            text: '請重新輸入帳號密碼!!!',
            footer: '<a href="">忘記帳號密碼?</a>'
          });
          return;
    };
    login(email.value, password.value); // 一定要寫.value, 不然會401錯誤
    email.value ="";
    password.value ="";
});

// 登入LOGIN
function login(email, password){
    let obj= {
        email: email,
        password: password
    }
    axios.post(`${apiUrl}/users/sign_in`, {
        "user": obj
    })
    .then(response => {
        console.log(response.headers.authorization);
//  token的優化，就不用在其他axios一直補上header...token
        axios.defaults.headers.common['Authorization'] = response.headers.authorization; 
//  localStorage儲存token
        token = response.headers.authorization;
        localStorage.setItem("token", token);
//  localStorage儲存使用者名
        let userName = response.data.nickname;
        localStorage.setItem("userName", userName);

        Swal.fire(`${response.data.message}`, `${userName}您好`, "success")
        // 成功登入後, 跳轉到首頁
        .then((result) => {
            if(result.isConfirmed){
                window.location.assign("index3.html")
            }
        }) 
    })
    .catch(error => {
        console.log(error.response);
        Swal.fire(`${error.response.data.message}`, "請重新輸入", "error") 
    });
};