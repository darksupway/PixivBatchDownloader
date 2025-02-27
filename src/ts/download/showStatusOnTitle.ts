import { pageType } from '../PageType'
import { EVT } from '../EVT'

/**
↑ 抓取中
→ 等待下一步操作（搜索页）
▶ 可以开始下载
↓ 下载中
║ 下载暂停
■ 下载停止
✓ 下载完毕
*/
enum Flags {
  crawling = '↑',
  waiting = '→',
  readyDownload = '▶',
  downloading = '↓',
  paused = '║',
  stopped = '■',
  completed = '✓',
  space = ' ',
}

// 把下载器运行中的状态添加到页面标题前面
class showStatusOnTitle {
  constructor() {
    this.bindEvents()
  }

  private timer: number = 0 // title 闪烁时，使用的定时器

  private bindEvents() {
    window.addEventListener(EVT.list.crawlStart, () => {
      this.set(Flags.crawling)
    })

    window.addEventListener(EVT.list.worksUpdate, () => {
      this.set(Flags.waiting)
    })

    for (const ev of [
      EVT.list.crawlFinish,
      EVT.list.resultChange,
      EVT.list.resume,
    ]) {
      window.addEventListener(ev, () => {
        this.set(Flags.readyDownload)
      })
    }

    window.addEventListener(EVT.list.downloadStart, () => {
      this.set(Flags.downloading)
    })

    window.addEventListener(EVT.list.downloadComplete, () => {
      this.set(Flags.completed)
    })

    window.addEventListener(EVT.list.downloadPause, () => {
      this.set(Flags.paused)
    })

    window.addEventListener(EVT.list.downloadStop, () => {
      this.set(Flags.stopped)
    })
    window.addEventListener(EVT.list.crawlEmpty, () => {
      this.reset()
    })
  }

  // 检查标题里是否含有标记
  private includeFlag(flag?: Flags) {
    if (!flag) {
      // 没有传递标记，则检查所有标记
      for (const value of Object.values(Flags)) {
        const str = `[${value}]`
        if (document.title.includes(str)) {
          return true
        }
      }
    } else {
      // 否则检查指定标记
      const str = `[${flag}]`
      return document.title.includes(str)
    }
    return false
  }

  // 重设 title
  private reset() {
    clearInterval(this.timer)

    const metaTagPage = [
      pageType.list.Artwork,
      pageType.list.UserHome,
      pageType.list.Novel,
    ]
    // 从 og:title 标签获取标题。og:title 标签是最早更新标题的。但不确定是否在所有页面上都可以直接使用 og:title 标签的内容，所以这里只在部分页面上使用
    if (metaTagPage.includes(pageType.type)) {
      const ogTitle = document.querySelector(
        'meta[property="og:title"]'
      )! as HTMLMetaElement
      if (ogTitle) {
        document.title = ogTitle.content
        return
      }
    }

    // 去掉 title 里的标记
    const index = document.title.indexOf(']')
    document.title = document.title.substring(index + 1)
  }

  // 在标题上显示指定标记
  private set(flag: Flags) {
    const str = `[${flag}]`
    // 如果 title 里没有标记，就添加标记
    if (!this.includeFlag()) {
      document.title = `${str} ${document.title}`
    } else {
      // 如果已经有标记了，则替换为新当前传入的标记
      document.title = document.title.replace(/\[.?\]/, str)
    }

    // 可以开始下载，或者等待下一步操作，进行闪烁提醒
    if (flag === Flags.readyDownload || flag === Flags.waiting) {
      this.flashing(flag)
    } else {
      clearInterval(this.timer)
    }
  }

  // 闪烁提醒，把给定的标记替换成空白，来回切换
  private flashing(flag: Flags.readyDownload | Flags.waiting) {
    clearInterval(this.timer)
    const str = `[${flag}]`
    const whiteSpace = `[${Flags.space}]`
    this.timer = window.setInterval(() => {
      if (this.includeFlag(flag)) {
        // 如果含有标记，就替换成空白
        document.title = document.title.replace(str, whiteSpace)
      } else {
        if (this.includeFlag(Flags.space)) {
          // 如果含有空白，就替换成标记
          document.title = document.title.replace(whiteSpace, str)
        } else {
          // 如果都没有，一般是页面切换了，标题被重置了，取消闪烁
          clearInterval(this.timer)
        }
      }
    }, 500)
  }
}

new showStatusOnTitle()
