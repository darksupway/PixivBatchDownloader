import { EVT } from './EVT'
import { lang } from './Lang'
import { pageType } from './PageType'

// 右侧的下载按钮
class DownloadButton {
  constructor() {
    this.addBtn()
    this.setVisible()
    this.bindEvents()
  }

  private btn: HTMLButtonElement = document.createElement('button')

  private addBtn() {
    this.btn = document.createElement('button')
    this.btn.id = 'rightButton'
    this.btn.textContent = '↓'
    this.btn.setAttribute('title', lang.transl('_显示下载面板') + ' (Alt + X)')
    document.body.insertAdjacentElement('afterbegin', this.btn)
  }

  private bindEvents() {
    // 这里阻止事件冒泡是为了配合 CenterPanel 的“点击页面其他部分隐藏 CenterPanel”的效果
    this.btn.addEventListener('click', (e) => {
      const ev = e || window.event
      ev.stopPropagation()
      EVT.fire(EVT.list.openCenterPanel)
    })

    window.addEventListener(EVT.list.centerPanelClosed, () => {
      this.show()
    })

    window.addEventListener(EVT.list.centerPanelOpened, () => {
      this.hide()
    })

    window.addEventListener(EVT.list.pageSwitchedTypeChange, () => {
      this.setVisible()
    })
  }

  private show() {
    this.btn.style.display = 'block'
  }

  private hide() {
    this.btn.style.display = 'none'
  }

  // 如果当前页面不支持下载，就隐藏按钮。这只是一个障眼法。
  private setVisible() {
    pageType.type === -1 ? this.hide() : this.show()
  }
}

new DownloadButton()
export {}
