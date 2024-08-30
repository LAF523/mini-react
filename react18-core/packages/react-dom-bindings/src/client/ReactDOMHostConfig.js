import {
  setInitialProperties,
  diffProperties,
  updateProperties,
} from "./ReactDOMComponent";
import {
  addFiberToDOM,
  addPropsToDOM,
  updateFiberProps,
} from "../client/ReactDOMComponentTree";
import {
  DefaultEventPriority,
  DiscreteEventPriority,
  ContinuousEventPriority,
} from "../../../react-reconciler/src/ReactEventPriorities";

/**
 * 判断DOM元素是否应该根据props来设置文本内容
 */
export function shouldSetTextContent(props) {
  return (
    typeof props.children === "string" || typeof props.children === "number"
  );
}

/**
 * 创建真实DOM元素
 */
export function createInstance(type, fiber, props) {
  const dom = document.createElement(type);
  addFiberToDOM(fiber, dom);
  addPropsToDOM(props, dom);
  return dom;
}
/**
 * 创建真实text节点
 */
export function createTextInstance(content) {
  return document.createTextNode(content);
}
/**
 * 添加子节点
 */
export function appendInitialChild(parent, child) {
  parent.append(child);
}

export function finalizeInitialChildren(dom, type, props) {
  setInitialProperties(dom, type, props);
}

export function insertBefore(parent, child, before) {
  parent.insertBefore(child, before);
}

export function appendChild(parent, child) {
  parent.append(child);
}

export function prepareUpdate(domElement, type, oldProps, newProps) {
  return diffProperties(domElement, type, oldProps, newProps);
}

export function commitUpdate(
  instance,
  updatePayload,
  type,
  oldProps,
  newProps,
  finishedWork
) {
  updateProperties(instance, updatePayload, type, oldProps, newProps);
  updateFiberProps(instance, newProps);
}

export function getCurrentEventPriority() {
  const currentEvent = window.event;
  if (currentEvent === undefined) {
    return DefaultEventPriority;
  }
  return getEventPriority(currentEvent.type);
}
// 根据事件返回事件的优先级
export function getEventPriority(domEventName) {
  switch (domEventName) {
    case "click":
      return DiscreteEventPriority;
    case "drag":
      return ContinuousEventPriority;
    default:
      return DefaultEventPriority;
  }
}
