import { EVT } from '../EVT'
import { lang } from '../Lang'
import { pageType } from '../PageType'
import { states } from '../store/States'
import { IDData } from '../store/StoreType'
import { toast } from '../Toast'
import { Tools } from '../Tools'

// 快速抓取
class QuickCrawl {
  constructor() {
    this.addBtn()
    this.setVisible()
    this.bindEvents()
  }

  private btn!: HTMLButtonElement

  private show = true // 是否显示

  // 指定在哪些页面类型里启用
  private readonly enablePageType = [pageType.list.Artwork, pageType.list.Novel]

  private addBtn() {
    // 在右侧添加快速抓取按钮
    this.btn = document.createElement('button')
    this.btn.classList.add('rightButton')
    this.btn.id = 'quickCrawlBtn'
    this.btn.setAttribute('data-xztitle', '_快速下载本页')
    this.btn.innerHTML = `<svg class="icon" aria-hidden="true">
  <use xlink:href="#icon-download"></use>
</svg>`
    document.body.append(this.btn)
    lang.register(this.btn)
  }

  private bindEvents() {
    // 点击按钮启动快速抓取
    this.btn.addEventListener(
      'click',
      () => {
        this.sendDownload()
      },
      false
    )

    // 使用快捷键 Alt + q 启动快速抓取
    window.addEventListener(
      'keydown',
      (ev) => {
        if (this.show && ev.altKey && ev.code === 'KeyQ') {
          this.sendDownload()
        }
      },
      false
    )

    // 页面类型改变时设置按钮的显示隐藏
    window.addEventListener(EVT.list.pageSwitch, () => {
      this.setVisible()
    })
  }

  private sendDownload() {
    // 因为 quickCrawl 状态会影响后续下载行为，所以必须先判断 busy 状态
    if (states.busy) {
      toast.error(lang.transl('_当前任务尚未完成'))
      return
    }

    states.quickCrawl = true
    EVT.fire('quickCrawl')

    const isNovel = window.location.href.includes('/novel')

    let idData: IDData

    if (isNovel) {
      idData = {
        type: 'novels',
        id: Tools.getNovelId(window.location.href),
      }
    } else {
      idData = {
        type: 'unknown',
        id: Tools.getIllustId(window.location.href),
      }
    }

    EVT.fire('crawlIdList', [idData])
  }

  private setVisible() {
    this.show = this.enablePageType.includes(pageType.type)
    this.btn.style.display = this.show ? 'flex' : 'none'
  }
}

new QuickCrawl()
