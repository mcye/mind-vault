// 1. Polyfill: 深度伪造浏览器环境
if (typeof window === 'undefined') {
  // @ts-ignore
  globalThis.window = globalThis;
}

if (typeof document === 'undefined') {
  const dummyElement = {
    appendChild: () => { },
    append: () => { }, // 关键修复：添加 append 方法
    style: {},
  };

  // @ts-ignore
  globalThis.document = {
    // 模拟创建 script 标签，返回一个带基础事件的对象
    createElement: (_tagName: string) => ({
      src: '',
      onload: () => { },
      onerror: () => { },
      ...dummyElement
    }),

    // 模拟 head，同时支持 append 和 appendChild
    head: dummyElement,

    // 模拟 body/documentElement，防止库回退查找
    body: dummyElement,
    documentElement: dummyElement,

    // 骗过脚本检查
    currentScript: null,
  } as any;
}

// 2. 导入库
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js'
// @ts-ignore
import 'pdfjs-dist/legacy/build/pdf.worker.entry.js'

// 3. 配置
// 设置为任意非空字符串以通过检查
// 由于我们已经通过 import 加载了 worker 到 window.pdfjsWorker，PDF.js 会优先使用它
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = 'no-op'

/**
 * 接收 Uint8Array
 */
export async function parsePdf(data: Uint8Array): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: data,
      disableFontFace: true,
      useSystemFonts: true,
      standardFontDataUrl: '',
      cMapPacked: true,
      isEvalSupported: false,
    })

    const pdfDocument = await loadingTask.promise
    const numPages = pdfDocument.numPages
    let fullText = ''

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDocument.getPage(i)
      const textContent = await page.getTextContent()

      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')

      fullText += `\n--- Page ${i} ---\n${pageText}`
    }

    return fullText
  } catch (error) {
    console.error('PDF Parse Error:', error)
    throw new Error(`PDF Parsing Failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}