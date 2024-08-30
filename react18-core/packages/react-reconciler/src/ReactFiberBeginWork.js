import { HostRoot, HostComponent } from "./ReactWorkTag";
import { processUpdateQueue } from "./ReactFiberClassUpdateQueue";
import { mountChildFibers, reconclieChildFibers } from "./ReactChildFiber";
import { shouldSetTextContent } from "../../react-dom-bindings/src/client/ReactDOMHostConfig";
import { IndeterminateComponent, FunctionComponent } from "./ReactWorkTag";
import { renderWithHooks } from "./ReactFiblerHook";
/**
 * 根据工作进程树中包含的vnode,构建子fiber链表
 * 返回子fiber或null,然后会根据子fiber的vnode继续构建子fiber
 */
export function beginWork(current, workInProgress) {
  switch (workInProgress.tag) {
    case IndeterminateComponent:
      return mountIndeterminateComponent(
        current,
        workInProgress,
        workInProgress.type
      );
    case HostRoot:
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    case FunctionComponent:
      const Component = workInProgress.type;
      const props = workInProgress.pendingProps;
      return updateFunctionComponent(current, workInProgress, Component, props);
    default:
      return null;
  }
}
// 第一次函数式组件tag为未知,更新时再beginWork函数式组件类型就已经赋值上了
function updateFunctionComponent(current, workInProgress, Component, props) {
  const nextChildren = renderWithHooks(
    current,
    workInProgress,
    Component,
    props
  );
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

// 处理函数式组件,对于不知道类型的组件优先当作函数式组件处理
function mountIndeterminateComponent(current, workInProgress, Component) {
  const props = workInProgress.pendingProps;
  const vnode = renderWithHooks(current, workInProgress, Component, props); // 处理hook,并获取函数式组件返回的虚拟DOM
  workInProgress.tag = FunctionComponent;
  reconcileChildren(current, workInProgress, vnode);
  return workInProgress.child;
}
/**
 * 更新原生标签,目的是构建workInProgress的下一个子fiber
 */
function updateHostComponent(current, workInProgress) {
  // 获取子级虚拟DOM,根据子级虚拟DOM才能构建子级fiber
  const { type, pendingProps: newProps } = workInProgress;
  let nextChildren = newProps.children;
  const isDirectTextChild = shouldSetTextContent(newProps); // 判断是否还有标签子元素,true:子元素是文本
  if (isDirectTextChild) {
    nextChildren = null;
  }
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

/**
 * 更新HostRoot类型的子节点
 */
function updateHostRoot(current, workInProgress) {
  // 处理更新队列,将新vnode的属性合并到memoizedState
  processUpdateQueue(workInProgress);
  const newState = workInProgress.memoizedState;
  const nextChildren = newState.element;

  // 根据虚拟DOM构建fiber
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

function reconcileChildren(current, workInProgress, nextChildren) {
  if (current === null) {
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
  } else {
    workInProgress.child = reconclieChildFibers(
      workInProgress,
      current.child,
      nextChildren
    );
  }
}
