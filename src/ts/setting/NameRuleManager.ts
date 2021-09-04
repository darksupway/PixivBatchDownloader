import { EVT } from '../EVT'
import { lang } from '../Lang'
import { msgBox } from '../MsgBox'
import { pageType } from '../PageType'
import { Utils } from '../utils/Utils'
import { settings, setSetting } from './Settings'

// 管理命名规则
// 在实际使用中，作为 settings.userSetName 的代理
// 其他类必须使用 nameRuleManager.rule 存取器来存取命名规则
class NameRuleManager {
  constructor() {
    this.bindEvents()
  }

  private bindEvents() {
    // 页面类型变化时，设置命名规则
    window.addEventListener(EVT.list.pageSwitchedTypeChange, () => {
      this.setInputValue()
    })

    window.addEventListener(EVT.list.settingChange, (ev: CustomEventInit) => {
      const data = ev.detail.data as any
      // 当用户开启这个开关时，设置当前页面类型的命名规则
      if (
        data.name === 'setNameRuleForEachPageType' &&
        settings.setNameRuleForEachPageType
      ) {
        if (
          settings.nameRuleForEachPageType[pageType.type] !==
          settings.userSetName
        ) {
          this.setInputValue()
        }
      }
    })
  }

  // 命名规则输入框的集合
  private inputList: HTMLInputElement[] = []

  // 注册命名规则输入框
  public registerInput(input: HTMLInputElement) {
    this.inputList.push(input)
    this.setInputValue()

    // 给输入框绑定事件
    // 额外监听 focus 事件。因为用户从下拉框添加一个命名标记之后，输入框会获得焦点
    ;['change', 'focus'].forEach((ev) => {
      input.addEventListener(ev, () => {
        if (settings.nameRuleForEachPageType[pageType.type] !== input.value) {
          this.rule = input.value
        }
      })
    })
  }

  // 设置输入框的值为当前命名规则
  private setInputValue() {
    const rule = this.rule
    this.inputList.forEach((input) => {
      input.value = rule
    })

    if (rule !== settings.userSetName) {
      setSetting('userSetName', this.rule)
    }
  }

  // 可以在所有页面使用的通用命名规则
  private readonly generalRule = '{p_title}/{id}'

  public get rule() {
    if (settings.setNameRuleForEachPageType) {
      return settings.nameRuleForEachPageType[pageType.type]
    } else {
      return settings.userSetName
    }
  }

  public set rule(str: string) {
    // 检查传递的命名规则的合法性
    // 为了防止文件名重复，命名规则里一定要包含 {id} 或者 {id_num}{p_num}
    const check =
      str.includes('{id}') ||
      (str.includes('{id_num}') && str.includes('{p_num}'))
    if (!check) {
      msgBox.error(lang.transl('_命名规则一定要包含id'))
    } else {
      // 检查合法性通过
      if (str) {
        // 替换特殊字符
        str = this.handleUserSetName(str)
      } else {
        str = this.generalRule
      }

      setSetting('userSetName', str)

      if (settings.setNameRuleForEachPageType) {
        settings.nameRuleForEachPageType[pageType.type] = str
        setSetting('nameRuleForEachPageType', settings.nameRuleForEachPageType)
      }

      this.setInputValue()
    }
  }

  // 处理用命名规则的非法字符和非法规则
  // 这里不必处理得非常详尽，因为在生成文件名时，还会对结果进行处理
  // 测试用例：在作品页面内设置下面的命名规则，下载器会自动进行更正
  // /{p_tag}/|/{user}////<//{rank}/{px}/{sl}/{p_tag}///{id}-{user}-{user_id}""-?{tags_transl_only}////
  private handleUserSetName(str: string) {
    // 替换命名规则里可能存在的非法字符
    str = Utils.replaceUnsafeStr(str)
    // replaceUnsafeStr 会把斜线 / 替换成全角的斜线 ／，这里再替换回来，否则就不能建立文件夹了
    str = str.replace(/／/g, '/')

    // 处理连续的 /
    str = str.replace(/\/{2,100}/g, '/')

    // 如果命名规则头部或者尾部是 / 则去掉
    if (str.startsWith('/')) {
      str = str.replace('/', '')
    }
    if (str.endsWith('/')) {
      str = str.substr(0, str.length - 1)
    }

    return str
  }
}

const nameRuleManager = new NameRuleManager()
export { nameRuleManager }
