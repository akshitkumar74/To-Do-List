const searchbar = document.getElementById("searchbar");
const taskcontainer = document.getElementById("taskcontainer");

let currentUserFullName = null;

// eslint-disable-next-line no-unused-vars -- called from the onclick attribute in todo.html
async function addTask(){
    if(searchbar.value === ''){
        searchbar.classList.add('error');
        setTimeout(()=>{
            searchbar.classList.remove('error');
        },1000);
        return;
    }

    const { data: sessionData } = await supabaseClient.auth.getSession();
    const userId = sessionData.session.user.id;

    if (!currentUserFullName) {
        currentUserFullName = await getCurrentUserFullName(userId);
    }

    const { data, error } = await supabaseClient
        .from('tasks')
        .insert([{ user_id: userId, task_name: searchbar.value, is_completed: false, full_name: currentUserFullName }])
        .select();

    if (error) {
        console.error("Failed to add task:", error.message);
        searchbar.classList.add('error');
        setTimeout(()=>{
            searchbar.classList.remove('error');
        },1000);
        return;
    }

    renderTask(data[0]);
    searchbar.value = "";
}

async function getCurrentUserFullName(userId){
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

    if (error) {
        console.error("Failed to load user info:", error.message);
        return null;
    }

    return data ? data.full_name : null;
}

function renderTask(task){
    let li = document.createElement("li");
    li.innerHTML = task.task_name;
    li.dataset.id = task.id;
    if (task.is_completed) li.classList.add("checked");

    if (task.full_name) {
        let creator = document.createElement("small");
        creator.className = "task-creator";
        creator.textContent = "Added by: " + task.full_name;
        li.appendChild(creator);
    }

    taskcontainer.appendChild(li);
    let span = document.createElement("span");
    span.innerHTML = "×";
    li.appendChild(span);
}

taskcontainer.addEventListener("click", async function(e){
    if(e.target.tagName === "LI"){
        e.target.classList.toggle("checked");
        const taskId = e.target.dataset.id;
        const isCompleted = e.target.classList.contains("checked");
        const { error } = await supabaseClient.from('tasks').update({ is_completed: isCompleted }).eq('id', taskId);
        if (error) console.error("Failed to update task:", error.message);
    }
    else if(e.target.tagName === "SPAN"){
        const li = e.target.parentElement;
        const taskId = li.dataset.id;
        const { error } = await supabaseClient.from('tasks').delete().eq('id', taskId);
        if (error) {
            console.error("Failed to delete task:", error.message);
            return;
        }
        li.remove();
    }
}, false);

async function showTask(){
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const userId = sessionData.session.user.id;

    const { data, error } = await supabaseClient
        .from('tasks')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error("Failed to load tasks:", error.message);
        return;
    }

    taskcontainer.innerHTML = "";
    data.forEach(task => renderTask(task));
}

async function showUserInfo(){
    const userInfo = document.getElementById("userInfo");
    if(!userInfo) return;

    const { data: sessionData } = await supabaseClient.auth.getSession();
    const userId = sessionData.session && sessionData.session.user.id;
    if(!userId) return;

    currentUserFullName = await getCurrentUserFullName(userId);
    if (currentUserFullName) {
        userInfo.textContent = currentUserFullName;
    }
}

async function checkSession(){
    const { data } = await supabaseClient.auth.getSession();
    if(!data.session){
        window.location.href = "index.html";
        return false;
    }
    return true;
}

const ready = (async function init(){
    const hasSession = await checkSession();
    if(!hasSession) return;
    await showTask();
    await showUserInfo();
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { addTask, renderTask, showTask, showUserInfo, checkSession, getCurrentUserFullName, ready };
}
