const MouseEventInterface = { clientX: 0, clientY: 0 }; // 鼠标事件对象特有属性

// 通过工厂函数使用同一个构造函数根据接口衍生多种功能的构造函数
export const SyntheticMouseEvent = createSyntheticEvent(MouseEventInterface);

function createSyntheticEvent(Interface) {
  function SyntheticMouseEvent(
    reactName,
    reactEventType,
    targetInst,
    nativeEvent,
    nativeEventTarget
  ) {
    this._reactName = reactName;
    this._type = reactEventType;
    this._targetInst = targetInst;
    this.nativeEvent = nativeEvent;
    this.target = nativeEventTarget;
    for (let key in Interface) {
      // copy接口中的非通用属性
      if (!Interface.hasOwnProperty(key)) {
        continue;
      }
      this[key] = Interface[key];
    }

    // 初始状态事件默认行为和事件传播都不被阻止
    this.isDefaultPrevented = false;
    this.isPropagationStopped = false;
    return this;
  }
  // 自定义阻止事件冒泡和默认行为的方法,
  Object.assign(SyntheticMouseEvent.prototype, {
    preventDefault() {
      const nativeEvent = this.nativeEvent;
      if (nativeEvent.preventDefault) {
        nativeEvent.perventDefault();
      } else {
        nativeEvent.returnValue = false;
      }
      this.isDefaultPrevented = true;
    },
    stopPropagation() {
      const nativeEvent = this.nativeEvent;
      if (nativeEvent.stopPropagation) {
        nativeEvent.stopPropagation();
      } else {
        nativeEvent.cancelBubble = true;
      }
      this.isPropagationStopped = true;
    },
  });
  return SyntheticMouseEvent;
}
