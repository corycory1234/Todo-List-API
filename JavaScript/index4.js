//  (0)API共用
let apiUrl = "https://todoo.5xcamp.us";
// let token = "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzNjAwIiwic2NwIjoidXNlciIsImF1ZCI6bnVsbCwiaWF0IjoxNjc4OTI4OTk4LCJleHAiOjE2ODAyMjQ5OTgsImp0aSI6IjVjZmQ5MGJkLTI0MjktNGZjNC1iZjcwLWRmOGVkYjE3OThkZiJ9.LRvAwSWSPHhM3i1EI2C5d3ba6vUpgkIXKfHlE_2mlcY";
//  (2)渲染
let list = document.querySelector("#list")
//  (3)新增
let inputText = document.querySelector("#inputText");
let addBtn = document.querySelector("#addBtn");
let todo_Arr = [];
//  (4)tab切換畫面 & 上.active底線(CSS屬性)
let tab = document.querySelector("#tab");
let tabChilds = document.querySelectorAll("#tab li");
//  (6)更新代辦清單
let notDone_Num = document.querySelector("#notDone_Num");
//  (7)清除「已完成」項目
let del_Done = document.querySelector("#del_Done");
//  (10)背景圖隱藏&呈現
let card_list = document.querySelector(".card_list");
let emptyArea = document.querySelector(".emptyArea");
let logoutBtn = document.querySelector("#logoutBtn");

//  (0)優化，Enter即可新增li
inputText.addEventListener("keypress", function(event){
    if(event.key === "Enter"){addTodo();}});

//  (1)getTodo函式
function getTodo(){
    axios.get(`${apiUrl}/todos`,{
        headers:{
            "Authorization": localStorage.getItem("token"),
        }
    })
    .then((response) =>{
        console.log(response.data.todos)
        //  Q：...是指(1)複製todo_Arr陣列，將其轉物件，
        //  Q：並且todo_Arr裡面所有元素，都額外加上key: value嗎?
        todo_Arr = response.data.todos.map(todo => ({...todo, editing: false}))
        render(todo_Arr);
        //  Q：渲染getTodo，要再加上的判斷式，才會一進頁面就跳出之前沒刪除的待辦清單
        if (todo_Arr.length > 0) {
          card_list.classList.add("show");
          emptyArea.classList.add("hide");
        }
    })
    .catch((error) => console.log(error.response))
}


let listInput;
// Q：若item.id !== id，就複製原有的item物件；
// Q：若item.id === id，就複製原有item物件，並且content會依照使用者輸入的value 
function editInput(value, id) {
  todo_Arr = todo_Arr.map((item) => item.id !== id ? { ...item } : { ...item, content: value }); 
}

// (2)渲染  
function render (arr){
    let str = "";
    arr.forEach((item) => {
//  ${item.completed_at ? "checked" : ""} 打勾:checkbox顯示checked，沒打勾:checkbox顯示空字串
//  Q：item.editing ? 'hide; : ''，這邊不太理解
        str += `<li data-id="${item.id}"> 
        <label class="checkbox ${item.editing ? 'hide' : ''}" for="${item.id}">
          <input type="checkbox" ${item.completed_at ? "checked" : ""}> 
          <span>${item.content}</span>
        </label>
        <input type="text" onkeyup="editInput(this.value, '${item.id}')" class="listInput ${!item.editing ? 'hide' : ''}" value="${item.content}" />
        <a href="#" class="edit"><i class="fa-solid fa-pen-to-square"></i></a>
        <a href="#" class="delete"></a>
      </li>`
    });
    list.innerHTML = str;
};

//  (3)新增
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
            "Authorization": localStorage.getItem("token"),
        }
    })
    .then((response) => {
    console.log(response);
    getTodo();
//  Q：為何todo_Arr必須放在.then裡面，是因為要取得API給的ID嗎?
    let obj = {
//  Q：這邊id若用時間戳 new Date().getTime()，應該就會跟API提供的ID對不上了吧?
//  Q：基本上，還是要以API提供的ID為主，放入Obj物件?
        id: response.data.id,
        content: inputText.value,
        check : "",
        editing: false
    };
    todo_Arr.unshift(obj);
//  update_Todo()更新代辦清單，取代原本render渲染
    update_Todo() 
    inputText.value = "";
    // render(todo_Arr);
    })
    .catch((error) => console.log(error.response))
//  新增LI後，也為背景圖還有整包UL，各上display屬性
    card_list.classList.add("show");
    emptyArea.classList.add("hide");
};




//  (4)tab切換畫面 & 上.active底線(CSS屬性)
//  大範圍UL監聽子層的li
let tabStatus = "all";
tab.addEventListener("click", tabSwitch);
function tabSwitch(event){
    tabStatus = event.target.dataset.tab;
//  這邊的tabChilds，適用querySelectorAll抓出來的DOM，是【陣列】，所以用forEach
    tabChilds.forEach((item) => {
        item.classList.remove("active");
    });
    event.target.classList.add("active");
//  切換後，再更新畫面
    update_Todo();
}




//  (5)單獨LI刪除 & Checkbox狀態
list.addEventListener("click", delAndCheck);
function delAndCheck(event){
//  此版型，LI不好點(大概在刪除鍵的下方)，所以才用closest("li")
//  透過ul往下找最「近」的li，並取得data-id(也可用getAttribute("data-id"))
    let id = event.target.closest("li").dataset.id;
    if(event.target.classList.value === "delete"){
        event.preventDefault();
//  這邊item.id和id，都是【字串】，看來API給的ID是字串
//  當item.id嚴格不相等id時，回傳true，並刪除
        todo_Arr = todo_Arr.filter((item) => item.id !== id); 
        axios.delete(`${apiUrl}/todos/${id}`,{
            headers:{                       
                "Authorization": localStorage.getItem("token"),
            }
        })
        .then((response) => Swal.fire(`${response.data.message}`,"已刪除","success"))
        .catch((error) => console.log(error.response))
//  update_Todo()更新待辦畫面
//  showAndHide()呈現背景圖，若被刪除到沒有LI，背景圖要秀出來
        update_Todo()
        showAndHide()
//  (5)單獨LI刪除 & Checkbox狀態
//  else，點到delete之外(意指點到checkbox的input)
//  Q：為什麼這裡用else if (!event.target.classList.contains("listInput"))???    
    } else if (!event.target.classList.contains("listInput")) {
        todo_Arr.forEach((item,index) => {
//  這邊item.id和id，都是【字串】，看來API給的ID是字串
            if(item.id === id){
            axios.patch(`${apiUrl}/todos/${id}/toggle`, {},
        {
            headers:{
                "Authorization": localStorage.token,
            }
        })
        .then((response) => {
            todo_Arr.forEach((item, index) => {
                if(item.id === response.data.id){
//  也可用item.completed_at = response.data.completed_at;
                    todo_Arr[index].completed_at = response.data.completed_at;
                }
            })
/*  update_Todo()要放在.then裡面；若放在.then的外層，
    會因為非同步關係，變成click後，.then(response)還沒將資料傳出，而先執行外層的updateList
    接著click任何一處，.then(response)才會有動作 */
            update_Todo(); // 3/17
        })
        .catch((error) => console.log(error.response))
            }
        })
    }
}




//  (6)更新代辦清單
function update_Todo(){
    let updateArr = [];
    if(tabStatus === "all"){
        updateArr = todo_Arr;
    }else if(tabStatus == "notDone"){
//  Q：為何用嚴格相等，「待完成」渲染不出任何「待完成」li!? 是因為null在filter裡面算是判讀false嗎?
        updateArr = todo_Arr.filter((item) => item.completed_at == null);
    }else if(tabStatus == "done"){
//  Q：為何用嚴格不相等，「已完成」卻渲染「全部」!? 是因為null在filter裡面算是判讀false嗎?
        updateArr = todo_Arr.filter((item) => item.completed_at != null);
    };

//  Q：為何用嚴格相等，每個 「待完成」li，必須打勾後，才會跳出【X】個待完成項目!? 是因為null在filter裡面算是判讀false嗎?
    let notDone_Length = todo_Arr.filter((item) => item.completed_at == null)
//  待完成數量.textContent 等於todoLength的長度也OK
    notDone_Num.innerHTML = notDone_Length.length;
//  若update_Todo(updateArr)，會造成堆疊上限，報錯
    render(updateArr);   
};
//  這邊初始化的用意，只是讓一開始進入頁面tabStatus = "all"
update_Todo();  


//  (7)清除「已完成」項目
del_Done.addEventListener("click", (event)=>{
    event.preventDefault();
//  Q：為何用嚴格不相等，只能刪第一次執行的「已完成」!??
//  將【非null = 已完成】過濾到deleteData變數, 並到API進行刪除【非null = 已完成】
//  Q：為何不直接todoArr.做filter，反而還要宣告個deleteData新變數?
    let deleteData = todo_Arr.filter((item) => item.completed_at != null);
    deleteData.forEach((item) => {
        axios.delete(`${apiUrl}/todos/${item.id}`,{
        headers:{
            "Authorization": localStorage.getItem("token"),
        }
    })
    .then((response) => console.log(response))
    .catch((error) => console.log(error.response))
    })
//  Q：用嚴格相等, 會變成刪除「全部」!?
//  Q：為何todoArr陣列, 還要進行一次filter將「未完成」篩選出來? 
//  Q：todoArr剩餘的元素，不就是「未完成」嗎?*/
    todo_Arr = todo_Arr.filter((item) => item.completed_at == null);
//  過濾完，必須更新頁面
    update_Todo();
//  showAndHide()呈現背景圖，若被刪除到沒有LI，背景圖要秀出來
    showAndHide();
})


//  (9)編輯LI內容
list.addEventListener("click", edit);
function edit(event){
    // 透過ul往下找最「近」的li，並取得data-id(也可用getAttribute("data-id"))
    let id = event.target.closest("li").dataset.id;
    console.log(id + " EDIT");
    if(event.target.parentElement.classList.value === "edit"){
        event.preventDefault();
        todo_Arr = todo_Arr.map((item) => item.id !== id ? { ...item, editing: false } : { ...item, editing: !item.editing }); 

        // // 當點擊li「刪除」時，該項li的id會不嚴格相等變數id，並再回報給API做刪除!?
        // // todo_Arr = todo_Arr.filter((item) => item.id !== id); 
        // axios.put(`${apiUrl}/todos/${id}`,{
        //     "todo": {
        //         "content": "string"
        //       }
        // },
        // {
        //     headers:{                       
        //         "Authorization": localStorage.getItem("token"),
        //     }
        // })
        // .then((response) => Swal.fire(`${response.data.message}`,"已編輯","success"))
        // // .then(() => render(todo_Arr))   // 3/16
        // // .then(() => update_Todo())    // 3/17
        // .catch((error) => console.log(error.response))
        // // update_Todo()透過axios.then去執行，跟單獨執行，差異在哪裡??
        // update_Todo()
    }
}


//  (10)呈現「無代辦事項」之背景圖&隱藏整包UL
function showAndHide(){
    if(todo_Arr.length == 0){
//  Q：為何背景圖加class與 card_List加class，要寫在97行?
//  Q：為何將上述寫在此函式當中，也在addTodo放上此函式，畫面卻不能渲染??
        card_list.classList.remove("show");
        emptyArea.classList.remove("hide")
    }
}

//  (11)登出
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
        window.location.assign("login.html");
    })
    .catch((error) => console.log(error.response));
}

//  (12)從登入取出Localstorage的使用者名字
let user = document.querySelector("#user")
user.textContent = localStorage.getItem("userName")

console.log(1111111);
getTodo();
