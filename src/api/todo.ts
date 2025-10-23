import request from '@/utils/request'
import type { ApiResponse, Todo, TodoListParams, PageData, TodoFinishRequest, TodoRecord } from '@/types'

// 获取待办详情
export function getTodo(id: string): Promise<ApiResponse<Todo>> {
  return request({
    url: `/v1/todo/${id}`,
    method: 'get'
  })
}

// 创建待办
export function createTodo(data: Todo): Promise<ApiResponse<{ id: string }>> {
  return request({
    url: '/v1/todo',
    method: 'post',
    data
  })
}

// 编辑待办
export function updateTodo(data: Todo): Promise<ApiResponse> {
  return request({
    url: '/v1/todo',
    method: 'put',
    data
  })
}

// 删除待办
export function deleteTodo(id: string): Promise<ApiResponse> {
  return request({
    url: `/v1/todo/${id}`,
    method: 'delete'
  })
}

// 获取待办列表
export function getTodoList(params: TodoListParams): Promise<ApiResponse<PageData<Todo>>> {
  return request({
    url: '/v1/todo/list',
    method: 'get',
    params
  })
}

// 完成待办
export function finishTodo(data: TodoFinishRequest): Promise<ApiResponse> {
  return request({
    url: '/v1/todo/finish',
    method: 'post',
    data
  })
}

// 创建待办记录
export function createTodoRecord(data: TodoRecord): Promise<ApiResponse> {
  return request({
    url: '/v1/todo/record',
    method: 'post',
    data
  })
}
