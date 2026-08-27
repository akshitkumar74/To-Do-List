const searchbar = document.getElementById("searchbar");
const taskcontainer = document.getElementById("taskcontainer");

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

    const { data, error } = await supabaseClient
        .from('tasks')
        .insert([{ user_id: userId, task_name: searchbar.value, is_completed: false }])
        .select();

    if (error) {
        console.error("Failed to add task:", error.message);
        searchbar.classList.add('error');
        setTimeout(()=>{
            searchbar.classList.remove('error');
        },1000);
        return;
    }

    const creatorNames = await getCreatorNames([userId]);
    renderTask(data[0], creatorNames[userId]);
    searchbar.value = "";
}

async function getCreatorNames(userIds){
    const uniqueIds = [...new Set(userIds)];
    if (uniqueIds.length === 0) return {};

    const { data, error } = await supabaseClient
        .from('profiles')
        .select('id, full_name')
        .in('id', uniqueIds);

    if (error) {
        console.error("Failed to load task creators:", error.message);
        return {};
    }

    return Object.fromEntries(data.map(profile => [profile.id, profile.full_name]));
}

function renderTask(task, creatorName){
    let li = document.createElement("li");
    li.innerHTML = task.task_name;
    li.dataset.id = task.id;
    if (task.is_completed) li.classList.add("checked");

    if (creatorName) {
        let creator = document.createElement("small");
        creator.className = "task-creator";
        creator.textContent = "Added by: " + creatorName;
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

    const creatorNames = await getCreatorNames(data.map(task => task.user_id));

    taskcontainer.innerHTML = "";
    data.forEach(task => renderTask(task, creatorNames[task.user_id]));
}

async function showUserInfo(){
    const userInfo = document.getElementById("userInfo");
    if(!userInfo) return;

    const { data: sessionData } = await supabaseClient.auth.getSession();
    const userId = sessionData.session && sessionData.session.user.id;
    if(!userId) return;

    const { data, error } = await supabaseClient
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

    if (error) {
        console.error("Failed to load user info:", error.message);
        return;
    }

    if(data){
        userInfo.textContent = data.full_name;
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
    module.exports = { addTask, renderTask, showTask, showUserInfo, checkSession, getCreatorNames, ready };
}
