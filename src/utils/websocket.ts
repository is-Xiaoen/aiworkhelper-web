import type { WsMessage } from '@/types'

export class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private token: string
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private messageHandlers: ((message: WsMessage) => void)[] = []
  private savedHandlers: ((message: WsMessage) => void)[] = [] // 保存处理器引用用于重连
  private statusHandlers: ((connected: boolean) => void)[] = [] // 连接状态变化回调

  constructor(url: string, token: string) {
    this.url = url
    this.token = token
  }

  // 注册连接状态变化回调
  onStatusChange(handler: (connected: boolean) => void): void {
    this.statusHandlers.push(handler)
  }

  // 通知所有状态监听器
  private notifyStatusChange(connected: boolean): void {
    this.statusHandlers.forEach(handler => handler(connected))
  }

  // 连接WebSocket
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 在URL中添加token作为查询参数，因为浏览器WebSocket API无法设置自定义header
        const wsUrl = `${this.url}?token=${encodeURIComponent(this.token)}`
        console.log('正在连接WebSocket:', wsUrl.replace(/token=[^&]+/, 'token=***'))
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('WebSocket连接成功')
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.notifyStatusChange(true) // 通知连接成功
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WsMessage = JSON.parse(event.data)
            console.log(`[WebSocket底层] 收到消息，当前有${this.messageHandlers.length}个处理器`)
            this.messageHandlers.forEach((handler, index) => {
              console.log(`[WebSocket底层] 调用处理器 #${index + 1}`)
              handler(message)
            })
          } catch (error) {
            console.error('解析WebSocket消息失败:', error)
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket错误:', error)
          reject(error)
        }

        this.ws.onclose = () => {
          console.log('WebSocket连接关闭')
          this.stopHeartbeat()
          this.notifyStatusChange(false) // 通知连接断开
          this.attemptReconnect()
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  // 发送消息
  send(message: WsMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.error('WebSocket未连接')
    }
  }

  // 添加消息处理器
  onMessage(handler: (message: WsMessage) => void): void {
    console.log(`[WebSocket] 添加消息处理器，当前共${this.messageHandlers.length + 1}个`)
    this.messageHandlers.push(handler)
    this.savedHandlers.push(handler) // 同时保存到savedHandlers
  }

  // 移除消息处理器
  offMessage(handler: (message: WsMessage) => void): void {
    const index = this.messageHandlers.indexOf(handler)
    if (index > -1) {
      this.messageHandlers.splice(index, 1)
    }
    const savedIndex = this.savedHandlers.indexOf(handler)
    if (savedIndex > -1) {
      this.savedHandlers.splice(savedIndex, 1)
    }
  }

  // 关闭连接
  close(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    // 清除所有消息处理器,防止重复监听
    this.messageHandlers = []
  }

  // 尝试重连
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`尝试重连WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

      this.reconnectTimer = setTimeout(() => {
        this.connect().then(() => {
          // 重连成功后，重新注册所有保存的处理器
          this.messageHandlers = [...this.savedHandlers]
          console.log(`[WebSocket] 重连成功，重新注册了${this.messageHandlers.length}个处理器`)
        }).catch(error => {
          console.error('重连失败:', error)
        })
      }, 3000 * this.reconnectAttempts)
    } else {
      console.error('WebSocket重连失败，已达到最大重连次数')
    }
  }

  // 开始心跳
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // 发送心跳包（可以根据后端需求调整）
        this.ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000) // 每30秒发送一次心跳
  }

  // 停止心跳
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  // 获取连接状态
  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED
  }

  // 判断是否已连接
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// 创建WebSocket实例的工厂函数
export function createWebSocket(token: string): WebSocketClient {
  const wsUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://127.0.0.1:9000'
  return new WebSocketClient(`${wsUrl}/ws`, token)
}
