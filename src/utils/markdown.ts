import { marked } from 'marked'

// 配置 marked 选项
marked.setOptions({
  breaks: true, // 支持 GitHub 风格的换行
  gfm: true, // 启用 GitHub Flavored Markdown
})

/**
 * 将 Markdown 文本渲染为 HTML
 * @param content Markdown 文本
 * @returns 渲染后的 HTML 字符串
 */
export function renderMarkdown(content: string): string {
  if (!content) return ''
  return marked.parse(content) as string
}
