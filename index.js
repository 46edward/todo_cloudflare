const html = todos =>  `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <title>Todos</title>
</head>
<body class="bg-blue-100">
    <div class="w-full h-full flex content-center justify-center mt-8">
      <div class="bg-white shadow-md rounded px-8 pt-6 py-8 mb-4">
        <h1 class="block text-grey-800 text-md font-bold mb-2">TODOS</h1>
        <div class="flex">
            <input class="shadow appearance-none border rounded w-full py-2 px-3 text-grey-800 leading-tight focus:outline-none focus:shadow-outline" type="text" name="name" placeholder="A new todo">
            <button class="bg-blue-500 hover:bg-blue-800 text-white font-bold ml-2 py-2 px-4 rounded focus:outline-none focus:shadow-outline" id="create" type="submit">Create</button>
        </div>
        <div class="mt-4" id="todos"></div>
      </div>
    </div>
</body>
<script>
  window.todos = ${todos || []}

  const updateTodos = function() {
    fetch("/", { method: 'PUT', body: JSON.stringify({todos: window.todos}) })
    populateTodos()
  }

  const completeTodo = function(evt){
    let checkbox = evt.target
    let todoElement = checkbox.parentNode
    let newTodoSet = [].concat(window.todos)
    let todo = newTodoSet.find(t => t.id == todoElement.dataset.todo)
    todo.completed = !todo.completed
    window.todos = newTodoSet
    updateTodos()
  }

   const populateTodos = function() {
    let todoContainer = document.querySelector("#todos")
    todoContainer.innerHTML = null
    
    window.todos.forEach(todo => {
      let el = document.createElement("div")
      el.className="border-t py-4"
      el.dataset.todo = todo.id

      let name = document.createElement("span")
      name.className = todo.completed ? "line-through" : ""
      name.textContent = todo.name
      
      let checkbox = document.createElement("input")
      checkbox.className = "mx-4"
      checkbox.type = "checkbox"
      checkbox.checked = todo.completed ? 1 : 0
      checkbox.addEventListener('click', completeTodo)

      el.appendChild(checkbox)
      el.appendChild(name)
      todoContainer.appendChild(el)
    })
  }

  populateTodos()



  const createTodo = function() {
    const input = document.querySelector("input[name=name]")
    if(input.value.length) {
      window.todos = [].concat(todos, {
        id: window.todos.length + 1,
        name: input.value,
        completed: false
      })
      input.value = ""
      updateTodos()
    }
  }
  document.querySelector("#create").addEventListener('click', createTodo)
</script>
</html>
`

const defaultData = {todos : []}

const setCache = (key, data) => TODOS_APP.put(key, data)
const getCache = key => TODOS_APP.get(key)

async function getTodos(request){
  const ip = request.headers.get('CF-Connection-IP')
  const cacheKey = `data-${ip}`
  let data
  const cache = await getCache(cacheKey)
  if(!cache){
    await setCache(cacheKey, JSON.stringify(defaultData))
    data = defaultData
  } else {
    data = JSON.parse(cache)
  }
  const body = html(JSON.stringify(data.todos || []))
  return new Response(body, {
    headers : { 'Content-Type' : 'text/html'},
  })
}

async function updateTodos(request){
  const body = await request.text()
  const cacheKey = `data`
  try{
    JSON.parse(body)
    await setCache(cacheKey, body)
    return new Response(body, {status : 200})
  } catch (err){
    return new Response(err, { status: 500 })
  }
}


async function handleRequest(request) {
  if(request.method === 'PUT') {
    return updateTodos(request)
  } else {
    return getTodos(request)
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})