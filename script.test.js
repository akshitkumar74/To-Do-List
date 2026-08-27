/**
 * @jest-environment jsdom
 */

function createSupabaseMock() {
    const insertMock = jest.fn();

    const client = {
        auth: {
            getSession: jest.fn().mockResolvedValue({
                data: { session: { user: { id: 'user-123' } } },
            }),
        },
        from: jest.fn(() => {
            const state = { isInsert: false, insertedRow: null };
            const builder = {
                insert: jest.fn((rows) => {
                    insertMock(rows);
                    state.isInsert = true;
                    state.insertedRow = { id: 1, ...rows[0] };
                    return builder;
                }),
                select: jest.fn(() => builder),
                eq: jest.fn(() => builder),
                update: jest.fn(() => builder),
                delete: jest.fn(() => builder),
                single: jest.fn(() => builder),
                then: (resolve) => {
                    if (state.isInsert) {
                        resolve({ data: [state.insertedRow], error: null });
                    } else {
                        resolve({ data: [], error: null });
                    }
                },
            };
            return builder;
        }),
    };

    return { client, insertMock };
}

describe('To-Do List functions', () => {
    let addTask;
    let insertMock;

    beforeEach(async () => {
        document.body.innerHTML = `
            <input id="searchbar" />
            <ul id="taskcontainer"></ul>
        `;

        const mock = createSupabaseMock();
        global.supabaseClient = mock.client;
        insertMock = mock.insertMock;

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

    test('task add hone par Supabase ko correct user_id/task_name ke sath insert call jana chahiye', async () => {
        const searchbar = document.getElementById('searchbar');
        searchbar.value = 'Read book';
        await addTask();

        expect(insertMock).toHaveBeenCalledWith([
            { user_id: 'user-123', task_name: 'Read book', is_completed: false },
        ]);
    });
});
