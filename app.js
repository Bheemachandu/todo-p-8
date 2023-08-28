const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

const dbPath = path.join(__dirname, "todoApplication.db");
app.use(express.json());
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

function getStatusAndPriority(query) {
  return query.priority != undefined && query.status != undefined;
}
function getPriority(query) {
  return query.status == undefined;
}
function getStatus(query) {
  return query.priority == undefined;
}
//1)
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status } = request.query;
  switch (true) {
    case getStatusAndPriority(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE priority="${priority}" AND status="${status}" AND todo LIKE "%${search_q}%";`;
      break;
    case getPriority(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE priority="${priority}" AND todo LIKE "%${search_q}%";`;
      break;
    case getStatus(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE status="${status}" AND todo LIKE "%${search_q}%";`;
      break;
    default:
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%";`;
      break;
  }
  data = await db.all(getTodoQuery);
  response.send(data);
});

//2)Returns a specific todo based on the todo ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const stateDetails = await db.get(getQuery);
  response.send(stateDetails);
});

//3)Create a todo in the todo table
app.post("/todos/", async (request, response) => {
  const requestBody = request.body;
  const { id, todo, priority, status } = requestBody;
  const postQuery = `INSERT INTO todo (id,todo,priority,status) VALUES (${id},"${todo}","${priority}","${status}");`;
  await db.run(postQuery);
  response.send("Todo Successfully Added");
});

//4)Updates the details of a specific todo based on the todo ID
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  const { status, priority, todo } = requestBody;
  let data = null;
  let putQuery = "";
  switch (true) {
    case requestBody.status != undefined:
      putQuery = `UPDATE todo SET status="${status}" WHERE id=${todoId}`;
      await db.run(putQuery);
      response.send("Status Updated");
      break;
    case requestBody.priority != undefined:
      putQuery = `UPDATE todo SET priority="${priority}" WHERE id=${todoId}`;
      await db.run(putQuery);
      response.send("Priority Updated");
      break;
    case requestBody.todo != undefined:
      putQuery = `UPDATE todo SET todo="${todo}" WHERE id=${todoId}`;
      await db.run(putQuery);
      response.send("Todo Updated");
      break;
  }
});

//5)
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
