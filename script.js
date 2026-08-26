const searchbar = document.getElementById("searchbar");
const taskcontainer = document.getElementById("taskcontainer");

// eslint-disable-next-line no-unused-vars -- called from the onclick attribute in index.html
function addTask(){
    if(searchbar.value === ''){
        searchbar.classList.add('error');
                setTimeout(()=>{
                    searchbar.classList.remove('error');
                },1000);
    }
    else{
        let li = document.createElement("li");
        li.innerHTML = searchbar.value;
        taskcontainer.appendChild(li);
        let span = document.createElement("span");
        span.innerHTML = "\u00d7";
        li.appendChild(span);
    }
    searchbar.value = "";
    saveData();
}

taskcontainer.addEventListener("click",function(e){
    if(e.target.tagName === "LI"){
        e.target.classList.toggle("checked");
        saveData();
    }
    else if(e.target.tagName === "SPAN"){
        e.target.parentElement.remove();
        saveData();
    }
}, false);

function saveData(){
    localStorage.setItem("data", taskcontainer.innerHTML);
}
function showTask(){
    taskcontainer.innerHTML = localStorage.getItem("data");
}
showTask();
// Ye sirf testing ke liye hai, browser mein koi effect nahi padega
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { addTask, saveData, showTask };
}