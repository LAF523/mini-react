import { getEventTarget } from "./getTarget.js";
import { getFiberFormDOM } from "../client/ReactDOMComponentTree.js";
import { dispatchEventForPlugins } from "./DOMPluginEventSystem.js";

// 创建一个具有事件优先级的事件监听器包装器
export function createListenerWrap(container, eventName, flags) {
  const listener = dispatchEvent;
  return listener.bind(null, eventName, flags, container);
}
// 事件派发核心逻辑
function dispatchEvent(eventName, flags, container, nativeEvent) {
  const target = getEventTarget(nativeEvent);
  const targetFiber = getFiberFormDOM(target);
  dispatchEventForPlugins(
    eventName,
    flags,
    nativeEvent,
    targetFiber,
    container
  );
}
