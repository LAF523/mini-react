// 事件合成系统核心逻辑
import { allNativeEvents } from "./EventRegistry";
import {
  addEventCaptureListener,
  addEventBubbleListener,
} from "./EventListener";
import { getFiberPropsFormDOM } from "../client/ReactDOMComponentTree";
import { createListenerWrap } from "./ReactDOMEventListener";
import { IS_CAPTURE_PHASE } from "./EventSystemFlags";
import { getEventTarget } from "./getTarget";
import * as SimpleEventPlugin from "./plugins/SimpleEventPlugin";
import { HostComponent } from "../../../react-reconciler/src/ReactWorkTag";
SimpleEventPlugin.registerEvents(); // 调用给allNativeEvents中添加react事件名,采用插件系统机制,该插件可以注册相同类型的事件名

const listenerMasker = `_reactListening${Math.random().toString(36).slice(2)}`;
export function listenToAllSupportedEvents(rootContainer) {
  allNativeEvents.forEach((eventName) => {
    const isListenerDone = rootContainer[listenerMasker];
    if (!isListenerDone) {
      rootContainer[listenerMasker] = true;
      // 注册捕获阶段事件
      listenToNativeEvent(eventName, rootContainer, true);
      // 注册冒泡阶段事件
      listenToNativeEvent(eventName, rootContainer, false);
    }
  });
}

function listenToNativeEvent(eventName, container, isCapturePhaseListener) {
  const flags = isCapturePhaseListener ? IS_CAPTURE_PHASE : 0;
  const listener = createListenerWrap(container, eventName, flags);
  if (isCapturePhaseListener) {
    // 捕获阶段监听器
    addEventCaptureListener(container, eventName, listener);
  } else {
    // 冒泡阶段监听器
    addEventBubbleListener(container, eventName, listener);
  }
}

// 为插件分发事件
export function dispatchEventForPlugins(
  eventName,
  flags,
  nativeEvent,
  targetFiber,
  container
) {
  const nativeEventTarget = getEventTarget(nativeEvent);
  const dispatchQueue = [];
  SimpleEventPlugin.extractEvents(
    // 提取事件,插件系统的好处,不同类型事件,每个类型单独注册,提取
    dispatchQueue,
    eventName,
    targetFiber,
    nativeEvent,
    nativeEventTarget,
    flags,
    container
  );
  processDispatchQueue(dispatchQueue, flags);
}

// 处理分发队列,执行队列中的事件
function processDispatchQueue(dispatchQueue, flags) {
  const isCapturePhase = flags & IS_CAPTURE_PHASE;
  for (let i = 0; i < dispatchQueue.length; i++) {
    const { event, listeners } = dispatchQueue[i];
    processDispatchQueueItemsInOrder(event, listeners, isCapturePhase);
  }
}
// 模拟捕获,冒泡
function processDispatchQueueItemsInOrder(event, listeners, isCapturePhase) {
  if (isCapturePhase) {
    // 倒序执行,模拟捕获
    for (let i = listeners.length - 1; i > 0; i--) {
      const { currentTarget, listener } = listeners[i];
      if (event.isPropagationStopped) {
        return;
      }
      executeDispatch(event, listener, currentTarget);
    }
  } else {
    // 正序执行,模拟冒泡
    for (let i = 0; i < listeners.length; i++) {
      const { currentTarget, listener } = listeners[i];
      if (event.isPropagationStopped) {
        return;
      }
      executeDispatch(event, listener, currentTarget);
    }
  }
}
// 真正执行函数回调的地方
function executeDispatch(event, listener, currentTarget) {
  event.currentTarget = currentTarget;
  listener(event);
}

// 收集本身以及父节点上的事件函数,如click的事件函数
export function accumulateSinglePhaseListeners(
  targetFiber,
  reactName,
  nativeEventType,
  isCapturePhase
) {
  const captureName = reactName + "Capture";
  const reactEventName = isCapturePhase ? captureName : reactName;
  let fiber = targetFiber;
  const listeners = [];
  while (fiber !== null) {
    console.log(1);
    const { stateNode, tag } = fiber;
    if (tag === HostComponent && stateNode !== null) {
      const listener = getListenerByNameFormFiber(fiber, reactEventName);
      if (listener) {
        listeners.push({ instance: fiber, listener, currentTaget: stateNode });
      }
    }

    fiber = fiber.return;
  }
  return listeners;
}

export function getListenerByNameFormFiber(fiber, reactEventName) {
  const { stateNode } = fiber;
  if (stateNode) {
    const props = getFiberPropsFormDOM(stateNode);
    if (props) {
      return props[reactEventName];
    }
  }
  return null;
}
