let inputText = document.querySelector("#inputText");
let addBtn = document.querySelector("#addBtn");
let list = document.querySelector("#list")
let todo_Arr = [];
let apiUrl = "https://todoo.5xcamp.us";
// let token = "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzNjAwIiwic2NwIjoidXNlciIsImF1ZCI6bnVsbCwiaWF0IjoxNjc4OTI4OTk4LCJleHAiOjE2ODAyMjQ5OTgsImp0aSI6IjVjZmQ5MGJkLTI0MjktNGZjNC1iZjcwLWRmOGVkYjE3OThkZiJ9.LRvAwSWSPHhM3i1EI2C5d3ba6vUpgkIXKfHlE_2mlcY";
let card_list = document.querySelector(".card_list");
let emptyArea = document.querySelector(".emptyArea");
let logoutBtn = document.querySelector("#logoutBtn");
// (0) 優化, Enter即可新增li
inputText.addEventListener("keypress", function(event){
    if(event.key === "Enter"){addTodo();}});

// (1)getTodo函式
function getTodo(){
    axios.get(`${apiUrl}/todos`,{
        headers:{
            "Authorization": localStorage.getItem("token"),
        }
    })
    .then((response) =>{
        console.log(response.data)
        todo_Arr = response.data.todos
        render(todo_Arr);
    })
    .catch((error) => console.log(error.response))
}


// (2)渲染  
function render (arr){
    let str = "";
    arr.forEach((item) => {
        // ${item.completed_at ? "checked" : ""} 打勾:checkbox顯示checked，沒打勾:checkbox顯示空字串
        str += `<li data-id="${item.id}"> 
        <label class="checkbox" for="${item.id}">
          <input type="checkbox" ${item.completed_at ? "checked" : ""}> 
          <span>${item.content}</span>
        </label>
        <a href="#" class="edit"><i class="fa-solid fa-pen-to-square"></i></a>
        <a href="#" class="delete"></a>
      </li>`
    });
    list.innerHTML = str;
};


// (3)新增
// 於監聽事件內，可先放入函式名稱，避免程式碼太冗長
addBtn.addEventListener("click", addTodo); 
function addTodo() {
   if(inputText.value.trim() === ""){
        Swal.fire("請輸入代辦事項", "字元不可空白", "warning");
        return;
    };
    axios.post(`${apiUrl}/todos`,{
        "todo": {
            content: inputText.value,
        }
    },{
        // 要放headers與token, 不然會跑出401錯誤
        headers:{                  
            "Authorization": localStorage.token,
        }
    })
    .then((response) => {
    console.log(response);
    // getTodo();
    //  為何todo_Arr必須放在axios.post向API請求傳送之後，而不是之前? 
    let obj = {
        id: response.data.id,
        content: inputText.value,
        check : "",
    };
    todo_Arr.unshift(obj);
    update_List() // 3/17
    inputText.value = "";
    // render(todo_Arr);
    })
    .catch((error) => console.log(error.response))
    
    // 新增LI後，也為背景圖還有整包UL，各上display屬性
    card_list.classList.add("show");
    emptyArea.classList.add("hide")
};





// (4)刪除
list.addEventListener("click", deleteBtn);
function deleteBtn(event){
    // 透過ul往下找最「近」的li，並取得data-id(也可用getAttribute("data-id"))
    let id = event.target.closest("li").dataset.id;
    // console.log(id);
    if(event.target.classList.value === "delete"){
        event.preventDefault();
        // 當點擊li「刪除」時，該項li的id會不嚴格相等變數id，並再回報給API做刪除!?
        todo_Arr = todo_Arr.filter((item) => item.id !== id); 
        axios.delete(`${apiUrl}/todos/${id}`, {
            headers:{                       
                "Authorization": localStorage.token,
            }
        })
        .then((response) => Swal.fire(`${response.data.message}`,"已刪除","success"))
        // .then(() => render(todo_Arr))   // 3/16
        // .then(() => update_List())    // 3/17
        .catch((error) => console.log(error.response))
        // update_List()透過axios.then去執行，跟單獨執行，差異在哪裡??
        update_List()
        showAndHide()
// (5)切換check狀態    
    }else{
        todo_Arr.forEach((item,index) => {
            if(item.id == id){
            axios.patch(`${apiUrl}/todos/${id}/toggle`, {},
        {
            headers:{
                "Authorization": localStorage.token,
            }
        })
        .then((response) => {
            todo_Arr.forEach((item, index) => {
                if(item.id === response.data.id){
                    todo_Arr[index].completed_at = response.data.completed_at;
                }
            })
            console.log(response)
            /* update_List()要放在.then裡面；若放在.then的外層，
               會因為非同步關係，變成click後，.then(response)還沒將資料傳出，而先執行外層的updateList
               接著click任何一處，.then(response)才會有動作 */
            update_List(); // 3/17
        })
        .catch((error) => console.log(error.response))
            }
        })
    }
}


// (6)tab切換畫面 & 上.active底線(CSS屬性)
let tab = document.querySelector("#tab");
// 大範圍UL監聽底下的li
let toggleStatus = "all";
tab.addEventListener("click", task);
function task(event){
    toggleStatus = event.target.dataset.tab;
    let tabs = document.querySelectorAll("#tab li");
    tabs.forEach((item, index) => {
        item.classList.remove("active");
    });
    event.target.classList.add("active");
    update_List()
}


// (7)更新「待完成項目」之數量
function update_List(){
    let done_element = [];
    if(toggleStatus === "all"){
        done_element = todo_Arr;
    }else if(toggleStatus == "notFinished"){
        // 為何用嚴格相等，「待完成」渲染不出任何li!?
        done_element = todo_Arr.filter((item) => item.completed_at == null);
    }else if(toggleStatus == "done"){
        // 為何用嚴格不相等，「已完成」卻渲染「全部」!?
        done_element = todo_Arr.filter((item) => item.completed_at != null);
    };

    let notFinishedNum = document.querySelector("#notFinishedNum");
    // 為何用嚴格相等，每個 「待完成」li，必須打勾後，才會跳出【X】個待完成項目!?
    let todoLength = todo_Arr.filter((item) => item.completed_at == null)
    // 待完成數量.textContent 等於todoLength的長度
    notFinishedNum.innerHTML = todoLength.length;


    render(done_element);   // 3/17
};
// 初始化
update_List();  // 3/17


// (8)清除「已完成」項目
let deleteAll = document.querySelector("#deleteAll");
deleteAll.addEventListener("click", (event)=>{
    event.preventDefault();
    // 用嚴格相等, 會變成刪除「全部」
    // 將【非null = 已完成】過濾到deleteData變數, 並到API進行刪除【非null = 已完成】
    let deleteData = todo_Arr.filter((item) => item.completed_at != null);
    deleteData.forEach((item) => {
        axios.delete(`${apiUrl}/todos/${item.id}`,{
        headers:{
            "Authorization": localStorage.token,
        }
    })
    .then((response) => console.log(response))
    .catch((error) => console.log(error.response))
    })
    // 用嚴格相等, 會變成刪除「全部」!?
    /* 為何todoArr陣列, 還要進行一次filter將「未完成」篩選出來? 
        todoArr剩餘的元素，不就是「未完成」嗎?*/
    todo_Arr = todo_Arr.filter((item) => item.completed_at == null);
    update_List();    // 3/17
    // render(todo_Arr); // 3/16
    showAndHide();
})

// (9)編輯LI內容
list.addEventListener("click", edit);
function edit(event){
    // 透過ul往下找最「近」的li，並取得data-id(也可用getAttribute("data-id"))
    let id = event.target.closest("li").dataset.id;
    console.log(id + "EDIT");
    if(event.target.classList.value === "edit"){
        event.preventDefault();

        
        // 當點擊li「刪除」時，該項li的id會不嚴格相等變數id，並再回報給API做刪除!?
        // todo_Arr = todo_Arr.filter((item) => item.id !== id); 
        axios.put(`${apiUrl}/todos/${id}`,{
            "todo": {
                "content": "string"
              }
        },
        {
            headers:{                       
                "Authorization": localStorage.token,
            }
        })
        .then((response) => Swal.fire(`${response.data.message}`,"已編輯","success"))
        // .then(() => render(todo_Arr))   // 3/16
        // .then(() => update_List())    // 3/17
        .catch((error) => console.log(error.response))
        // update_List()透過axios.then去執行，跟單獨執行，差異在哪裡??
        update_List()
    }
}




// (10)呈現「無代辦事項」之背景圖&隱藏整包UL
function showAndHide(){
    if(todo_Arr.length == 0){
        // let card_list = document.querySelector(".card_list");
        // let emptyArea = document.querySelector(".emptyArea");
        card_list.classList.remove("show");
        emptyArea.classList.remove("hide")
    }
}

// (11)登出
logoutBtn.addEventListener("click", logout);
function logout(event){
    event.preventDefault();
    axios.delete(`${apiUrl}/users/sign_out`,{
        headers:{                       
            //透過localStorage使用getItem將存在瀏覽器的資料取出
            "Authorization": localStorage.getItem("token")
        }
    })
    .then((response) => Swal.fire(`${response.data.message}`, "已登出", "success"))
    .then(() => {
        //將storage 中的所有屬性移除。
        localStorage.clear();
        window.location.assign("index.html");
    })
    .catch((error) => console.log(error.response));
}

// (12)判斷頁面 + 監聽事件
