import {
  HostRoot,
  HostComponent,
  HostText,
  FunctionComponent,
} from "./ReactWorkTag";
import { NoFlags, Update } from "./ReactFiberFlags";
import {
  createTextInstance,
  prepareUpdate,
} from "../../react-dom-bindings/src/client/ReactDOMHostConfig";
import {
  createInstance,
  appendInitialChild,
  finalizeInitialChildren,
} from "../../react-dom-bindings/src/client/ReactDOMHostConfig";

/**
 * 完成一个fiber节点的转换
 */
export function completeWork(current, workInProgress) {
  // 创建真实DOM
  // 处理真实DOM的属性
  // 挂载flags
  const { tag } = workInProgress;
  switch (tag) {
    case HostRoot:
      // HostRoot对应的是容器,真实DOM本身就是存在的,只需要收集flags就可以
      bubbleProperties(workInProgress);
      break;
    case HostComponent:
      // 创建DOM实例,绑定stateNode
      const { type, pendingProps: props } = workInProgress;
      if (current?.alternate) {
        // 说明不是第一次执行
        updateHostComponent(current, workInProgress, type, props);
      } else {
        const instance = createInstance(type, workInProgress, props);
        workInProgress.stateNode = instance;
        // 将子元素添加至当前DOM
        appendAllChildren(instance, workInProgress);
        // 处理DOM属性
        const newProps = workInProgress.pendingProps;
        finalizeInitialChildren(instance, type, newProps);
      }
      bubbleProperties(workInProgress);
      break;
    case FunctionComponent:
      bubbleProperties(workInProgress);
      break;
    case HostText:
      const text = workInProgress.pendingProps;
      workInProgress.stateNode = createTextInstance(text);
      bubbleProperties(workInProgress);
      break;
  }
}

// 函数式组件的提交阶段
function updateHostComponent(current, workInProgress, type, newProps) {
  const oldProps = current.memoizedProps;
  const instance = workInProgress.stateNode;
  const updatePayload = prepareUpdate(instance, type, oldProps, newProps); // 获取更新内容
  workInProgress.updateQueue = updatePayload;
  if (updatePayload) {
    markUpdate(workInProgress);
  }
}
function markUpdate(workInProgress) {
  workInProgress.flags |= Update;
}

/**
 * 收集子元素的flags
 */
function bubbleProperties(workInProgress) {
  let child = workInProgress.child;
  let subtreeFlags = NoFlags;
  while (child !== null) {
    console.log(13);

    subtreeFlags |= child.flags; // 子节点需要的操作
    subtreeFlags |= child.subtreeFlags; // 子节点的子节点需要的操作
    child = child.sibling;
  }
  workInProgress.subtreeFlags = subtreeFlags;
}

/**
 * 添加所有子节点
 */
function appendAllChildren(parent, workInProgress) {
  let node = workInProgress.child;
  while (node !== null) {
    console.log(14);

    if (node.tag === HostComponent || node.tag === HostText) {
      // 是文本节点或标签节点
      appendInitialChild(parent, node.stateNode);
    } else if (node.child !== null) {
      // 不是文本或标签但是又子元素,说明是函数式组件或类组件
      node = node.child;
      continue;
    }
    if (node === workInProgress) {
      return;
    }
    while (node.sibling === null) {
      console.log(15);
      if (node.return === null || node.return === workInProgress) {
        return;
      }
      node = node.return; // 没有兄弟节点则找父节点的兄弟节点继续
    }
    node = node.sibling;
  }
}
// function appendAllChildren(parent, workInProgress) {
//   let node = workInProgress.child;
//   while (node) {
//     if (node.tag === HostComponent || node.tag === HostText) {
//       // 是文本节点或标签节点
//       appendInitialChild(parent, node.stateNode);
//     } else if (node.child !== null) {
//       // 不是文本或标签但是又有子元素,说明是函数式组件或类组件
//       node = node.child;
//       continue;
//     }
//     node = node.sibling;
//   }
// }
