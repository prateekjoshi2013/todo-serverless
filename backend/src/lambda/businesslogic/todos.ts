import * as uuid from 'uuid'

import { TodoItem } from '../../models/TodoItem'
import { ImageUrl } from '../../models/ImageUrl'
import { TodoItemAccess } from '../../datalayer/todosAccess'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { parseUserId } from '../../../src/auth/utils'

const todoItemAccess = new TodoItemAccess()

export async function getAllTodos(jwtToken:string): Promise<TodoItem[]> {
  const userId = parseUserId(jwtToken);
  return todoItemAccess.getAllTodos(userId)
}

export async function deleteTodo(jwtToken:string,todoId:string): Promise<any> {
  const userId = parseUserId(jwtToken)
  return todoItemAccess.deleteTodo(userId,todoId)
}

export async function updateTodo(jwtToken:string, todoId:string, updateTodoRequest: UpdateTodoRequest): Promise<any> {
  const userId = parseUserId(jwtToken)
  return todoItemAccess.updateTodo(userId,todoId,updateTodoRequest)
}

export async function generateUploadUrl(jwtToken:string, todoId:string): Promise<ImageUrl> {
  const userId = parseUserId(jwtToken)
  const imageId = uuid.v4();
  return todoItemAccess.generateUploadUrl(userId,todoId,imageId)
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  jwtToken: string
): Promise<TodoItem> {

  const itemId = uuid.v4()
  const userId = parseUserId(jwtToken)

  return await todoItemAccess.createTodo({
    todoId: itemId,
    userId: userId,
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    createdAt: new Date().toISOString(),
    done: false
  })
}
