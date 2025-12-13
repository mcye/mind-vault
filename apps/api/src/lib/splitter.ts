/**
 * 极轻量、Edge 专属的递归字符切片器
 * 专为中文优化 + 标点智能断句 + 零依赖 + < 1KB gzip
 */
export async function splitText(
  text: string,
  options: {
    chunkSize?: number      // 目标块大小（字符数）
    chunkOverlap?: number   // 重叠字符数
    separators?: string[] // 优先断句符号（从强到弱）
  } = {}
): Promise<string[]> {
  const {
    chunkSize = 1000,
    chunkOverlap = 200,
    separators = ['\n\n', '\n', '。', '！', '？', '；', ' ', ''], // 优先级从高到低
  } = options

  if (!text || text.length === 0) return []
  if (text.length <= chunkSize) return [text.trim()]

  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)

    let chunk = text.slice(start, end)

    // 如果不是最后一块，尝试在 separators 中找最佳断点
    if (end < text.length) {
      let bestSplitIndex = -1

      for (const sep of separators) {
        // 在 [end - 200, end] 区间内找最后一个 sep 的位置
        const searchStart = Math.max(start, end - 200)
        const lastOccur = text.lastIndexOf(sep, end - 1)

        if (lastOccur >= searchStart) {
          bestSplitIndex = lastOccur + sep.length // 分隔符结尾作为切点
          break
        }
      }

      if (bestSplitIndex > start + chunkSize * 0.5) {
        // 找到了一个合理的断点
        chunk = text.slice(start, bestSplitIndex)
        start = bestSplitIndex
      } else {
        // 没找到好断点，就硬切
        start = end
      }
    } else {
      // 最后一块
      start = text.length
    }

    const trimmed = chunk.trim()
    if (trimmed) chunks.push(trimmed)
    
    // 重叠逻辑
    start = Math.max(start - chunkOverlap, start)
  }

  return chunks
}