import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoAccess } from '../dataLayer/todosAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { getUserId } from '../lambda/utils'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const todoAccess = new TodoAccess()

export async function getAllTodos(event: APIGatewayProxyEvent): Promise<TodoItem[]> {
  const userId = getUserId(event);
  return todoAccess.getAllTodes(userId);
}

export async function createTodo(event: APIGatewayProxyEvent): Promise<TodoItem> {

  const itemId = uuid.v4()
  const userId = getUserId(event);
  const newTodo: CreateTodoRequest = typeof(event.body) === 'string'?JSON.parse(event.body): event.body 

  return await todoAccess.createTodo({
  	userId: userId,
  	todoId: itemId,
  	createdAt: new Date().toISOString(),
  	done: false,
  	...newTodo
  })
}
export async function deleteTodo(event: APIGatewayProxyEvent){
  const userId = getUserId(event);
  const todoId = event.pathParameters.todoId;
	return await todoAccess.deleteTodo(todoId, userId);
}

export async function updateTodo(event: APIGatewayProxyEvent){
  const todoId = event.pathParameters.todoId;
  const userId = getUserId(event)
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body);
  return await todoAccess.updateTodo(userId,todoId,updatedTodo);
}
export async function generateUploadUrl(event: APIGatewayProxyEvent): Promise<string>{
  const todoId = event.pathParameters.todoId;
  const userId = getUserId(event);
  return await todoAccess.generateUploadUrl(todoId, userId);
}