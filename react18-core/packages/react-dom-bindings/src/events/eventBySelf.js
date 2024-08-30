/*
1.事件注册
  冒泡/捕获阶段的事件全部委托到根节点
2.事件派发
*/
import {
  getFiberFormDOM,
  getFiberPropsFormDOM,
} from "../client/ReactDOMComponentTree";
import { HostComponent } from "../../../react-reconciler/src/ReactWorkTag";

const allNativeEvents = ["click"];
const nameMap = new Map();
export function listenerAllEvents(container) {
  for (let nativeName of allNativeEvents) {
    const { reactName } = getName(nativeName);
    nameMap.set(nativeName, reactName);
    listenerEvents(nativeName, container, true); // 捕获
    listenerEvents(nativeName, container, false); // 冒泡
  }
}
function getName(nativeName) {
  const reactName = `on${nativeName[0].toUpperCase()}${nativeName
    .slice(1)
    .toLowerCase()}`;
  return { reactName, nativeName };
}

function listenerEvents(nativeName, container, isCapture) {
  const listener = dispatchEvent.bind(null, nativeName, isCapture);
  container.addEventListener(nativeName, listener, isCapture);
}

function dispatchEvent(nativeName, isCapture, nativeEvent) {
  // 收集事件
  const target = nativeEvent.target || nativeEvent.srcElement || window;
  const listeners = patchQueue(target, nativeName);

  // 创建合成事件对象
  const _eventObj = {
    nativeEvent,
    currentTarget: target,
    isDefaultPrevented: false,
    isPropagationStopped: false,
    stopPagation() {
      if (nativeEvent.stopPropagation) {
        nativeEvent.stopPropagation();
      } else {
        nativeEvent.cancelBubble = true;
      }
      this.isPropagationStopped = true;
    },
    preventDefault() {
      if (nativeEvent.preventDefault) {
        nativeEvent.perventDefault();
      } else {
        nativeEvent.returnValue = false;
      }
      this.isDefaultPrevented = true;
    },
  };
  // 派发队列
  if (isCapture) {
    for (let i = listeners.length - 1; i >= 0; i--) {
      const { listener, currentTarget } = listeners[i];
      listener(_eventObj);
    }
  } else {
    for (let i = 0; i < listeners.length; i++) {
      const { listener, currentTarget } = listeners[i];
      listener(_eventObj);
    }
  }
}

function patchQueue(target, nativeName) {
  let fiber = getFiberFormDOM(target);
  const listeners = [];
  while (fiber != null) {
    console.log(2);

    if (fiber.tag === HostComponent) {
      const { stateNode } = fiber;
      const props = getFiberPropsFormDOM(stateNode);
      if (props) {
        const reactName = nameMap.get(nativeName);
        const listener = props[reactName];
        if (listener) {
          listeners.push({ listener, currentTarget: target });
        }
      }
    }

    fiber = fiber.return;
  }
  return listeners;
}
