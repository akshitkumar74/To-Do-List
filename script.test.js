/**
 * @jest-environment jsdom
 */

function createSupabaseMock(profilesById = { 'user-123': 'Akshit Kumar' }) {
    const insertMock = jest.fn();
    const updateMock = jest.fn();
    const deleteMock = jest.fn();

    const signOutMock = jest.fn().mockResolvedValue({ error: null });

    const client = {
        auth: {
            getSession: jest.fn().mockResolvedValue({
                data: { session: { user: { id: 'user-123' } } },
            }),
            signOut: signOutMock,
        },
        from: jest.fn((table) => {
            const state = { isInsert: false, insertedRow: null, isSingle: false, eqValue: null };
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
                        resolve({ data: [state.insertedRow], error: null });
                    } else if (table === 'profiles' && state.isSingle) {
                        const fullName = profilesById[state.eqValue];
                        resolve({ data: fullName ? { full_name: fullName } : null, error: null });
                    } else {
                        resolve({ data: [], error: null });
                    }
                },
            };
            return builder;
        }),
    };

    return { client, insertMock, updateMock, deleteMock, signOutMock };
}

describe('To-Do List functions', () => {
    let addTask;
    let insertMock;
    let updateMock;
    let deleteMock;
    let signOutMock;

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

        jest.resetModules();
        const scriptModule = require('./script.js');
        await scriptModule.ready;
        addTask = scriptModule.addTask;
    });

    test('empty searchbar par error class lagni chahiye', async () => {
        const searchbar = document.getElementById('searchbar');
        searchbar.value = '';
        await addTask();

        expect(searchbar.classList.contains('error')).toBe(true);
        const items = document.querySelectorAll('#taskcontainer li');
        expect(items.length).toBe(0);
    });

    test('valid input dene par task list mein add hona chahiye', async () => {
        const searchbar = document.getElementById('searchbar');
        searchbar.value = 'Buy milk';
        await addTask();

        const items = document.querySelectorAll('#taskcontainer li');
        expect(items.length).toBe(1);
        expect(items[0].textContent).toContain('Buy milk');
    });

    test('task add karne ke baad searchbar khali ho jana chahiye', async () => {
        const searchbar = document.getElementById('searchbar');
        searchbar.value = 'Clean house';
        await addTask();

        expect(searchbar.value).toBe('');
    });

    test('task add hone par Supabase ko correct user_id/task_name/full_name ke sath insert call jana chahiye', async () => {
        const searchbar = document.getElementById('searchbar');
        searchbar.value = 'Read book';
        await addTask();

        expect(insertMock).toHaveBeenCalledWith([
            { user_id: 'user-123', task_name: 'Read book', is_completed: false, full_name: 'Akshit Kumar' },
        ]);
    });

    test('task ke sath uska creator naam (Added by) dikhna chahiye', async () => {
        const searchbar = document.getElementById('searchbar');
        searchbar.value = 'Read book';
        await addTask();

        const items = document.querySelectorAll('#taskcontainer li');
        expect(items[0].querySelector('.task-creator').textContent).toBe('Added by: Akshit Kumar');
    });

    test('× dabane par task UI se hat jani chahiye, aur row delete hone ki jagah is_deleted=true set hona chahiye', async () => {
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

    test('Logout button dabane par supabase signOut call hona chahiye', async () => {
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        await Promise.resolve();
        await Promise.resolve();

        expect(signOutMock).toHaveBeenCalled();
    });
});
