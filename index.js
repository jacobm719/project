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

    return {
        addTodo,
        removeTodo,
        getTodos,
        completeTodo,
        editTodo,
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

    let { getTodos, removeTodo, addTodo, completeTodo, editTodo } = APIs;

    return {
        State,
        getTodos,
        removeTodo,
        addTodo,
        completeTodo,
        editTodo,
    };
})();

// BEM, block element modifier methodology
const View = (() => {
    const formEl = document.querySelector(".form");
    const todoListEl = document.querySelector(".todo-list");
    const updateTodoList = (todos) => {
        let template = "";
        todos.forEach((todo) => {
            if (todo.status) {
                const todoTemplate = `<li><span><input type="text" id="listid${todo.id}" value="${todo.title}"></span><button class="btn--edit" id="${todo.id}">edit</button><button class="btn--delete" id="${todo.id}">remove</button></li>`;
                template += todoTemplate;
            }
            else {
                const todoTemplate = `<li><span><input type="text" id="listid${todo.id}" value="${todo.title}" readonly></span><button class="btn--edit" id="${todo.id}">edit</button><button class="btn--delete" id="${todo.id}">remove</button></li>`;
                template += todoTemplate;                
            }
        });
        if (todos.length === 0) {
            template = "no task to display";
        }
        todoListEl.innerHTML = template;
    };

    return {
        formEl,
        todoListEl,
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

            const newTodo = { title , status:false};
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
        View.todoListEl.addEventListener("click",(event)=>{
            const id = event.target.id;
            if (event.target.className === "btn--delete") {
                Model.removeTodo(id).then(res=>{
                    state.todos = state.todos.filter(todo=> +todo.id !== +id);
                }).catch(err=>alert(`delete todo failed: ${err}`));
            }
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

    const bootstrap = () => {
        addTodo();
        getTodos();
        removeTodo();
        completeTodo();
        editTodo();
        state.subscribe(() => {
            View.updateTodoList(state.todos);
        });
    };

    return {
        bootstrap,
    };
}) (View, Model);

ViewModel.bootstrap();