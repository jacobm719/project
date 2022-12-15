//design pattern
//readable, maintainable, debuggable
//MVC/MVVM, model(data) view(element) controller(eventlistener, logic), model view viewmodel
//template(html), controller(javascript), stylesheet(css), DOM api(window.document)

/* 
    get(id optionally): read
    post: write
    put(id): update, replace
    patch(id): update, partial replace
    delete(id): remove a row
*/

const APIs = (() => {
    const URL = "http://localhost:3000/todos";

    const addTodo = (newTodo) => {
        return fetch(URL, {
            method: "POST",
            body: JSON.stringify(newTodo),
            headers: { "Content-Type": "application/json" },
        }).then((res) => res.json());
    };

    const removeTodo = (id) => {
        return fetch(URL + `/${id}`, {
            method: "DELETE",
        }).then((res) => res.json());
    };

    const getTodos = () => {
        return fetch(URL).then((res) => res.json());
    };

    const completeTodo = (id, title) => {
        return fetch(URL + `/${id}`, {
            method: "PATCH",
            body: JSON.stringify({"title": title}),
            headers: { "Content-Type": "application/json" },
        }).then((res) => res.json());
    };

    const editTodo = (id, status) => {
        return fetch(URL + `/${id}`, {
            method: "PATCH",
            body: JSON.stringify({"status": status}),
            headers: { "Content-Type": "application/json" },
        }).then((res) => res.json());
    };

    const finished = (id, done) => {
        return fetch(URL + `/${id}`, {
            method: "PATCH",
            body: JSON.stringify({"done": done}),
            headers: { "Content-Type": "application/json" },
        }).then((res) => res.json());
    };

    return {
        addTodo,
        removeTodo,
        getTodos,
        completeTodo,
        editTodo,
        finished,
    };
})();

// Builds todos
const Model = (() => {
    class State {
        #todos;
        #onChange;

        constructor() {
            this.#todos = [];
        }

        get todos() {
            return this.#todos;
        }

        set todos(newTodo) {
            this.#todos = newTodo;
            this.#onChange?.();
        }

        subscribe(callback) {
            this.#onChange = callback;
        }
    }

    let { getTodos, removeTodo, addTodo, completeTodo, editTodo, finished } = APIs;

    return {
        State,
        getTodos,
        removeTodo,
        addTodo,
        completeTodo,
        editTodo,
        finished,
    };
})();

// BEM, block element modifier methodology
const View = (() => {
    const formEl = document.querySelector(".form");
    const todoListEl = document.querySelector(".todo-list");
    const finishedListEl = document.querySelector(".finished-list");
    const editButton = `<svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="EditIcon" aria-label="fontSize small"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>`;
    const deleteButton = `<svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="DeleteIcon" aria-label="fontSize small"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>`;
    const updateTodoList = (todos) => {
        let template = "";
        let templateFinished = "";
        todos.forEach((todo) => {
            if (!todo.done) {
                if (todo.status) {
                    const todoTemplate = `<li><span><input type="text" id="listid${todo.id}" value="${todo.title}"></span><button class="btn--edit" id="${todo.id}">${editButton}</button><button class="btn--delete" id="${todo.id}">${deleteButton}</button></li>`;
                    template += todoTemplate;
                }
                else {
                    const todoTemplate = `<li><span><input type="text" id="listid${todo.id}" value="${todo.title}" readonly></span><button class="btn--edit" id="${todo.id}">${editButton}</button><button class="btn--delete" id="${todo.id}">${deleteButton}</button></li>`;
                    template += todoTemplate;
                }
            } else {
                const finishedTemplate = `<li><span><input type="text" id="listid${todo.id}" value="${todo.title}" readonly></span><button class="btn--delete" id="${todo.id}">${deleteButton}</button></li>`;
                templateFinished += finishedTemplate;
            }
        });
        if (template == "") {
            template = "no active tasks";
        }
        todoListEl.innerHTML = template;
        finishedListEl.innerHTML = templateFinished;
    };

    return {
        formEl,
        todoListEl,
        finishedListEl,
        updateTodoList,
    };
})();


/*
    prevent the refresh
    get the value from input
    save the new task to the database(could fail)
    save new task object to state, update the page
*/

const ViewModel = ((View, Model) => {
    const state = new Model.State();

    const getTodos = () => {
        Model.getTodos().then((res) => {
            state.todos = res;
        });
    };

    const addTodo = () => {
        View.formEl.addEventListener("submit", (event) => {
            event.preventDefault();
            
            const title = event.target[0].value;
            if (title.trim() === "") {
                alert("please input title!");
                return;
            }

            const newTodo = { title , status:false, done:false};
            Model.addTodo(newTodo)
                .then((res) => {
                    state.todos = [res, ...state.todos];
                    event.target[0].value = "";
                })
                .catch((err) => {
                    alert(`add new task failed: ${err}`);
                });
        });
    };

    const removeTodo = () => {
        [View.todoListEl, View.finishedListEl].forEach((listEl) => {
            listEl.addEventListener("click",(event)=>{
                const id = event.target.id;
                if (event.target.className === "btn--delete") {
                    Model.removeTodo(id).then(res=>{
                        state.todos = state.todos.filter(todo=> +todo.id !== +id);
                    }).catch(err=>alert(`delete todo failed: ${err}`));
                }
            });
        });
    };

    const completeTodo = () => {
        View.todoListEl.addEventListener("click", (event)=>{
            const id = event.target.id;
            if (event.target.className === "btn--edit") {
                let curIndex = -1;
                for (let i = 0;  i < state.todos.length; i++) {
                    if (state.todos[i].id === parseInt(id)) {
                        curIndex = i;
                        break;
                    }
                }
                if (state.todos[curIndex].status) {
                    let newTitle = document.getElementById(`listid${id}`).value;
                    Model.completeTodo(id, newTitle);
                }
            }
        });
    };

    const editTodo = () => {
        View.todoListEl.addEventListener("click", (event)=>{
            const id = event.target.id;
            if (event.target.className === "btn--edit") {
                let curIndex = -1;
                for (let i = 0;  i < state.todos.length; i++) {
                    if (state.todos[i].id === parseInt(id)) {
                        curIndex = i;
                        break;
                    }
                }
                let newStatus = !state.todos[curIndex].status;
                Model.editTodo(id, newStatus);
            }
        });
    };

    const finished = () => {
        [View.todoListEl, View.finishedListEl].forEach((listEl) => {
            listEl.addEventListener("click", (event)=>{
                const id = event.target.id.substr(6);
                const inputBox = event.target.tagName;
                if (inputBox === "INPUT") {
                    let curIndex = -1;
                    for (let i = 0;  i < state.todos.length; i++) {
                        if (state.todos[i].id === parseInt(id)) {
                            curIndex = i;
                            break;
                        }
                    }
                    if (state.todos[curIndex].done || !state.todos[curIndex].status) {
                        let done = !state.todos[curIndex].done;
                        Model.finished(id, done);
                    }
                }
            });
        });
    };

    const bootstrap = () => {
        addTodo();
        getTodos();
        removeTodo();
        completeTodo();
        editTodo();
        finished();
        state.subscribe(() => {
            View.updateTodoList(state.todos);
        });
    };

    return {
        bootstrap,
    };
}) (View, Model);

ViewModel.bootstrap();