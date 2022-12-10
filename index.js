//design pattern
//readable, maintainable, debuggable
//MVC/MVVM, model(data) view(element) controller(eventlistener, logic), model view viewmodel
//template(html), controller(javascript),css(), DOM api(window.document),

//closure, IIFE(immediately invoked function expression)

/* const model = (() => {
    let counter = 0;
    const increment = () => {
        counter++
        return counter
    };
    return {
        increment,
    };
})();

console.log(model.increment());
console.log(model.increment()); */

//table, rows, columns, id(uuid(universally unique identifier), uid)

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
        // post
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

    const editTodo = (id, status) => {
        return fetch(URL + `/${id}`, {
            method: "PATCH",
            body: JSON.stringify({status}),
            headers: { "Content-Type": "application/json" },
        }).then((res) => res.json());
    };

    return {
        addTodo,
        removeTodo,
        getTodos,
        editTodo
    };
})();

const Model = (() => {
    //todolist
    class State {
        #todos; //[{id: ,title: },{}]
        #onChange;
        constructor() {
            this.#todos = [];
        }

        get todos() {
            return this.#todos;
        }

        set todos(newTodo) {
            console.log("setter");
            this.#todos = newTodo;
            //const obj = {name:"adam"}; 
            //obj.age //undefined 
            //obj.age(); //error
            this.#onChange?.();
        }

        subscribe(callback) {
            this.#onChange = callback;
        }
    }
    let { getTodos, removeTodo, addTodo, editTodo } = APIs;

    return {
        State,
        getTodos,
        removeTodo,
        addTodo,
        editTodo,
    };
})();
//BEM, block element modifier methodology
const View = (() => {
    const formEl = document.querySelector(".form"); //querying
    const todoListEl = document.querySelector(".todo-list");
    const updateTodoList = (todos) => {
        let template = "";
        todos.forEach((todo) => {
            if (todos.status) {
                const todoTemplate = `<li><span><input type="text" value="${todo.title}"></span><button class="btn--edit" id="${todo.id}">edit</button><button class="btn--delete" id="${todo.id}">remove</button></li>`;
                template += todoTemplate;
            }
            else {
                const todoTemplate = `<li><span><input type="text" value="${todo.title}" readonly></span><button class="btn--edit" id="${todo.id}">edit</button><button class="btn--delete" id="${todo.id}">remove</button></li>`;
                template += todoTemplate;                
            }
        });
        if(todos.length === 0){
            template = "no task to display"
        }
        todoListEl.innerHTML = template;
    };

    return {
        formEl,
        todoListEl,
        updateTodoList,
    };
})();

//reference: pointer
//window.console.log

//

/* 
    prevent the refresh
    get the value from input
    save the new task to the database(could fail)
    save new task object to state, update the page
    

*/

const ViewModel = ((View, Model) => {
    console.log("model", Model);
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
            if(title.trim() === "") {
                alert("please input title!");
                return;
            }
            console.log("title", title);
            const newTodo = { title , status:false};
            Model.addTodo(newTodo)
                .then((res) => {
                    state.todos = [res, ...state.todos];
                    event.target[0].value = ""
                })
                .catch((err) => {
                    alert(`add new task failed: ${err}`);
                });
        });
    };

    const removeTodo = () => {
        //event bubbling: event listener from parent element can receive event emitted from its child
        View.todoListEl.addEventListener("click",(event)=>{
            //console.log(event.target/* emit the event */, event.currentTarget/* receive the event */);
            const id = event.target.id;
            //console.log("id", id)
            if(event.target.className === "btn--delete"){
                Model.removeTodo(id).then(res=>{
                    state.todos = state.todos.filter(todo=> +todo.id !== +id)
                }).catch(err=>alert(`delete todo failed: ${err}`))
            }
            if(event.target.className === "btn--edit"){
                let newStatus = !state.todos[state.todos.findIndex((e) => +e.id === +id)].status
                Model.editTodo(id, newStatus)
                alert(state.todos[state.todos.findIndex((e) => +e.id === +id)].status)
            }
        })
    };

    const bootstrap = () => {
        addTodo();
        getTodos();
        removeTodo();
        state.subscribe(() => {
            View.updateTodoList(state.todos);
        });
    };

    return {
        bootstrap,
    };
})(View, Model);

ViewModel.bootstrap();