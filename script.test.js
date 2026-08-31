/**
 * @jest-environment jsdom
 */

function createSupabaseMock(profilesById = { 'user-123': 'Akshit Kumar' }) {
    const insertMock = jest.fn();
    const updateMock = jest.fn();
    const deleteMock = jest.fn();
    const signOutMock = jest.fn().mockResolvedValue({ error: null });
    const forceError = { insert: null, update: null, select: null, single: null };

    const client = {
        auth: {
            getSession: jest.fn().mockResolvedValue({
                data: { session: { user: { id: 'user-123' } } },
            }),
            signOut: signOutMock,
        },
        from: jest.fn((table) => {
            const state = { isInsert: false, isUpdate: false, insertedRow: null, isSingle: false, eqValue: null };
            const builder = {
                insert: jest.fn((rows) => {
                    insertMock(rows);
                    state.isInsert = true;
                    state.insertedRow = { id: 1, ...rows[0] };
                    return builder;
                }),
                select: jest.fn(() => builder),
                eq: jest.fn((column, value) => {
                    state.eqValue = value;
                    return builder;
                }),
                update: jest.fn((payload) => {
                    updateMock(payload);
                    state.isUpdate = true;
                    return builder;
                }),
                delete: jest.fn(() => {
                    deleteMock();
                    return builder;
                }),
                single: jest.fn(() => {
                    state.isSingle = true;
                    return builder;
                }),
                then: (resolve) => {
                    if (state.isInsert) {
                        if (forceError.insert) {
                            resolve({ data: null, error: { message: forceError.insert } });
                            return;
                        }
                        resolve({ data: [state.insertedRow], error: null });
                    } else if (table === 'profiles' && state.isSingle) {
                        if (forceError.single) {
                            resolve({ data: null, error: { message: forceError.single } });
                            return;
                        }
                        const fullName = profilesById[state.eqValue];
                        resolve({ data: fullName ? { full_name: fullName } : null, error: null });
                    } else if (state.isUpdate) {
                        if (forceError.update) {
                            resolve({ data: null, error: { message: forceError.update } });
                            return;
                        }
                        resolve({ data: [], error: null });
                    } else {
                        if (table === 'tasks' && forceError.select) {
                            resolve({ data: null, error: { message: forceError.select } });
                            return;
                        }
                        resolve({ data: [], error: null });
                    }
                },
            };
            return builder;
        }),
    };

    return { client, insertMock, updateMock, deleteMock, signOutMock, forceError };
}

describe('To-Do List functions', () => {
    let addTask;
    let insertMock;
    let updateMock;
    let deleteMock;
    let signOutMock;
    let forceError;

    beforeEach(async () => {
        document.body.innerHTML = `
            <input id="searchbar" />
            <ul id="taskcontainer"></ul>
            <button id="logoutBtn"></button>
        `;

        const mock = createSupabaseMock();
        global.supabaseClient = mock.client;
        insertMock = mock.insertMock;
        updateMock = mock.updateMock;
        deleteMock = mock.deleteMock;
        signOutMock = mock.signOutMock;
        forceError = mock.forceError;

        jest.resetModules();
        const scriptModule = require('./script.js');
        await scriptModule.ready;
        addTask = scriptModule.addTask;
    });

    test('empty searchbar should get the error class', async () => {
        const searchbar = document.getElementById('searchbar');
        searchbar.value = '';
        await addTask();

        expect(searchbar.classList.contains('error')).toBe(true);
        const items = document.querySelectorAll('#taskcontainer li');
        expect(items.length).toBe(0);
    });

    test('valid input should be added to the task list', async () => {
        const searchbar = document.getElementById('searchbar');
        searchbar.value = 'Buy milk';
        await addTask();

        const items = document.querySelectorAll('#taskcontainer li');
        expect(items.length).toBe(1);
        expect(items[0].textContent).toContain('Buy milk');
    });

    test('searchbar should be cleared after adding a task', async () => {
        const searchbar = document.getElementById('searchbar');
        searchbar.value = 'Clean house';
        await addTask();

        expect(searchbar.value).toBe('');
    });

    test('adding a task should call Supabase insert with correct user_id/task_name/full_name', async () => {
        const searchbar = document.getElementById('searchbar');
        searchbar.value = 'Read book';
        await addTask();

        expect(insertMock).toHaveBeenCalledWith([
            { user_id: 'user-123', task_name: 'Read book', is_completed: false, full_name: 'Akshit Kumar' },
        ]);
    });

    test('task should show its creator name (Added by)', async () => {
        const searchbar = document.getElementById('searchbar');
        searchbar.value = 'Read book';
        await addTask();

        const items = document.querySelectorAll('#taskcontainer li');
        expect(items[0].querySelector('.task-creator').textContent).toBe('Added by: Akshit Kumar');
    });

    test('failed task insert should show error class and not add to the list', async () => {
        const searchbar = document.getElementById('searchbar');
        searchbar.value = 'Should fail';
        forceError.insert = 'insert blocked';

        await addTask();

        expect(searchbar.classList.contains('error')).toBe(true);
        expect(document.querySelectorAll('#taskcontainer li').length).toBe(0);
    });

    test('clicking the checkbox (LI) should toggle the checked class and call is_completed update', async () => {
        const searchbar = document.getElementById('searchbar');
        searchbar.value = 'Toggle me';
        await addTask();

        const li = document.querySelector('#taskcontainer li');
        li.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();

        expect(li.classList.contains('checked')).toBe(true);
        expect(updateMock).toHaveBeenCalledWith({ is_completed: true });
    });

    test('clicking × should remove the task from the UI, setting is_deleted=true instead of deleting the row', async () => {
        const searchbar = document.getElementById('searchbar');
        searchbar.value = 'Temporary task';
        await addTask();

        const span = document.querySelector('#taskcontainer li span');
        span.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();

        expect(document.querySelectorAll('#taskcontainer li').length).toBe(0);
        expect(updateMock).toHaveBeenCalledWith({ is_deleted: true });
        expect(deleteMock).not.toHaveBeenCalled();
    });

    test('a failed delete request should not remove the task from the UI', async () => {
        const searchbar = document.getElementById('searchbar');
        searchbar.value = 'Cannot delete';
        await addTask();

        forceError.update = 'RLS blocked';

        const span = document.querySelector('#taskcontainer li span');
        span.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();

        expect(document.querySelectorAll('#taskcontainer li').length).toBe(1);
    });

    test('clicking the Logout button should call supabase signOut', async () => {
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        await Promise.resolve();
        await Promise.resolve();

        expect(signOutMock).toHaveBeenCalled();
    });

    test('a failed profile fetch should still add the task, with full_name null', async () => {
        document.body.innerHTML = `
            <input id="searchbar" />
            <ul id="taskcontainer"></ul>
        `;

        const mock = createSupabaseMock();
        mock.forceError.single = 'profile lookup failed';
        global.supabaseClient = mock.client;

        jest.resetModules();
        const scriptModule = require('./script.js');
        await scriptModule.ready;

        const searchbar = document.getElementById('searchbar');
        searchbar.value = 'No profile';
        await scriptModule.addTask();

        expect(mock.insertMock).toHaveBeenCalledWith([
            { user_id: 'user-123', task_name: 'No profile', is_completed: false, full_name: null },
        ]);
    });

    test('a failed tasks fetch should leave the list empty', async () => {
        document.body.innerHTML = `
            <input id="searchbar" />
            <ul id="taskcontainer"></ul>
        `;

        const mock = createSupabaseMock();
        mock.forceError.select = 'tasks fetch failed';
        global.supabaseClient = mock.client;

        jest.resetModules();
        const scriptModule = require('./script.js');
        await scriptModule.ready;

        expect(document.querySelectorAll('#taskcontainer li').length).toBe(0);
    });

    test('with no session, tasks/profile should never be fetched (redirect guard)', async () => {
        document.body.innerHTML = `
            <input id="searchbar" />
            <ul id="taskcontainer"></ul>
        `;

        const mock = createSupabaseMock();
        mock.client.auth.getSession = jest.fn().mockResolvedValue({ data: { session: null } });
        global.supabaseClient = mock.client;

        jest.resetModules();
        const scriptModule = require('./script.js');
        await scriptModule.ready;

        expect(mock.client.from).not.toHaveBeenCalled();
    });

    test('after login, the user name and avatar should show in the UI', async () => {
        document.body.innerHTML = `
            <input id="searchbar" />
            <ul id="taskcontainer"></ul>
            <div id="accountWidget"><div id="avatarInitial"></div><span id="userInfo"></span></div>
        `;

        const mock = createSupabaseMock();
        global.supabaseClient = mock.client;

        jest.resetModules();
        const scriptModule = require('./script.js');
        await scriptModule.ready;

        expect(document.getElementById('userInfo').textContent).toBe('Akshit Kumar');
        expect(document.getElementById('avatarInitial').textContent).toBe('A');
        expect(document.getElementById('accountWidget').classList.contains('visible')).toBe(true);
    });
    
});
