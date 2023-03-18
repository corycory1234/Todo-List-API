let registerEmail = document.querySelector("#registerEmail");
let nickName = document.querySelector("#nickName");
let registerPassword = document.querySelector("#registerPassword");
let passwordAgain = document.querySelector("#passwordAgain");
let registerBtn = document.querySelector("#registerBtn");
let loginBtn = document.querySelector("#loginBtn");
let apiUrl = "https://todoo.5xcamp.us";
let token = "";

//監聽「註冊」
registerBtn.addEventListener("click", (event) => {
    if(registerEmail.value.trim() === "" || 
    nickName.value.trim() === "" ||
    registerPassword.value.trim() === "" ||
    passwordAgain.value.trim() === "" ){
        Swal.fire("帳號/暱稱/密碼/再次輸入密碼，不可留白!!!","請重新輸入!!!","warning");
        return;
    }else if(registerPassword.value.length < 6){
        Swal.fire("密碼不可少於8個字元","請重新輸入密碼","warning");
        return;
    }else if(passwordAgain.value !== registerPassword.value){
        Swal.fire("密碼必須一樣","請重新輸入密碼","warning");
        return;
    }
    register(registerEmail.value, nickName.value, registerPassword.value, passwordAgain.value)
});

//註冊REGISTER函式
function register(registerEmail, nickName, registerPassword){
    let obj = {
        "email": registerEmail, //這邊若用.value, 會報錯
        "nickname": nickName,   //這邊若用.value, 會報錯
        "password": registerPassword    //這邊若用.value, 會報錯
    }
    axios.post(`${apiUrl}/users`, {
        "user": obj
      })
      .then((response) => {
        console.log(response),
        Swal.fire(`${response.data.message}`, "請牢記帳號密碼", "success")
        // 成功登入後, 跳轉到首頁
        // result這邊不太懂
        .then((result) => {
            console.log(result);
        if(result.isConfirmed){
            window.location.assign("index3.html");
        };
      });
    })
      
      .catch((error) => {
        console.log(error.response),
        Swal.fire(`${error.response.data.error}`, "請檢查輸入帳號密碼", "error")
    })
}