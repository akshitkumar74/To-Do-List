/**
 * @jest-environment jsdom
 */

describe('To-Do List functions', () => {
    let addTask;

    beforeEach(() => {
        document.body.innerHTML = `
            <input id="searchbar" />
            <ul id="taskcontainer"></ul>
        `;
        localStorage.clear();

        jest.resetModules();
        const scriptModule = require('./script.js');
        addTask = scriptModule.addTask;
    });

    test('empty searchbar par error class lagni chahiye', () => {
        const searchbar = document.getElementById('searchbar');
        searchbar.value = '';
        addTask();

        expect(searchbar.classList.contains('error')).toBe(true);
        const items = document.querySelectorAll('#taskcontainer li');
        expect(items.length).toBe(0);
    });

    test('valid input dene par task list mein add hona chahiye', () => {
        const searchbar = document.getElementById('searchbar');
        searchbar.value = 'Buy milk';
        addTask();

        const items = document.querySelectorAll('#taskcontainer li');
        expect(items.length).toBe(1);
        expect(items[0].textContent).toContain('Buy milk');
    });

    test('task add karne ke baad searchbar khali ho jana chahiye', () => {
        const searchbar = document.getElementById('searchbar');
        searchbar.value = 'Clean house';
        addTask();

        expect(searchbar.value).toBe('');
    });

    test('task add hone par localStorage mein save hona chahiye', () => {
        const searchbar = document.getElementById('searchbar');
        searchbar.value = 'Read book';
        addTask();

        const savedData = localStorage.getItem('data');
        expect(savedData).toContain('Read book');
    });
});
