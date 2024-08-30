import { HostRoot, HostComponent, HostText } from "./ReactWorkTag";
import {
  MutationMask,
  Placement,
  Update,
  Passive,
  LayoutMask,
} from "./ReactFiberFlags";
import { FunctionComponent } from "./ReactWorkTag";
import {
  insertBefore,
  appendChild,
  commitUpdate,
} from "../../react-dom-bindings/src/client/ReactDOMHostConfig";
import {
  HasEffect as HookHasEffect,
  Passive as HookPassive,
  Layout as HookLayout,
} from "./ReactHookEffectTags";
const isHost = (v) => v.tag === HostRoot || v.tag === HostComponent;

export function commitMutationEffectsOnFiber(finishedWork, FiberRoot) {
  const current = finishedWork.alternate;
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case FunctionComponent:
      debugger;
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      if (flags & Update) {
        commitHookEffectListUnmount(HookHasEffect | HookLayout, finishedWork);
      }
      break;
    case HostRoot:
    case HostComponent:
    case HostText:
      recursivelyTraverseMutationEffects(FiberRoot, finishedWork); // 递归处理子节点
      commitReconciliationEffects(finishedWork);
      if (flags & Update) {
        const instance = finishedWork.stateNode;
        if (instance !== null) {
          const newProps = finishedWork.memoizedProps;
          const oldProps = current !== null ? current.memoizedProps : newProps;
          const type = finishedWork.type;
          const updatePayload = finishedWork.updateQueue;
          finishedWork.updateQueue = null;
          if (updatePayload) {
            commitUpdate(
              instance,
              updatePayload,
              type,
              oldProps,
              newProps,
              finishedWork
            );
          }
        }
      }
      break;
  }
}

// 递归遍历所有子节点并在每个fiber上应用mutation副作用
function recursivelyTraverseMutationEffects(FiberRoot, finishedWork) {
  if (finishedWork.subtreeFlags & MutationMask) {
    let { child } = finishedWork;
    while (child !== null) {
      console.log(7);

      commitMutationEffectsOnFiber(child, FiberRoot);
      child = child.sibling;
    }
  }
}
// 应用fiber节点的调和副作用
function commitReconciliationEffects(finishedWork) {
  const { flags } = finishedWork;
  if (flags & Placement) {
    // 需要插入
    commitPlacement(finishedWork);
    finishedWork.flags &= ~Placement;
  }
}

/**
 * 查找提交位置并将节点插入
 */
function commitPlacement(finishedWork) {
  const parentFiber = getHostParentFiber(finishedWork); // 挂载到父节点,所以需要先找到可以挂载的父节点,只有DOM时Host(非函数式组件非类组件)才符合要求
  let parentDOM;
  switch (parentFiber.tag) {
    case HostRoot:
      parentDOM = parentFiber.stateNode.containerInfo;
      break;
    case HostComponent:
      parentDOM = parentFiber.stateNode;
      break;
  }
  // 查找锚点
  const before = getHostSibling(finishedWork);
  insertOrAppendPlacementNode(finishedWork, before, parentDOM);
}

function insertOrAppendPlacementNode(finishedWork, before, parent) {
  if (isHost(finishedWork)) {
    // 是原生标签
    const dom = finishedWork.stateNode;
    if (before) {
      insertBefore(parent, dom, before);
    } else {
      appendChild(parent, dom);
    }
  } else {
    // 是组件
    const { child } = finishedWork;
    if (child !== null) {
      insertOrAppendPlacementNode(child, before, parent);
      let { sibling } = child;
      while (sibling !== null) {
        console.log(8);

        insertOrAppendPlacementNode(child, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
}

/**
 * 获取宿主兄弟节点
 */
function getHostSibling(finishedWork) {
  let node = finishedWork;
  siblings: while (true) {
    console.log(9);
    while (node.sibling === null) {
      console.log(10);

      // 如果没有兄弟节点,则往父节点找,直到父节点的兄弟节点不为null
      if (node.return === null || isHost(node.return)) {
        return null;
      }
      node = node.return;
    }
    node = node.sibling;
    while (node.tag !== HostComponent && node.tag !== HostText) {
      console.log(11);
      // 如果兄弟节点是组件,需要插入则找兄弟的兄弟,否则找组件的子fiber
      if (node.flags & Placement) {
        continue siblings;
      } else {
        node = node.child;
      }
    }
    if (!(node.falgs & Placement)) {
      return node.stateNode;
    }
  }
}

// 循环查找带有原生DOM父fiber
function getHostParentFiber(finishedWork) {
  let parent = finishedWork.return;
  while (parent !== null) {
    console.log(12);

    if (isHost(parent)) {
      return parent;
    }
    parent = parent.return;
  }
}

// 执行useEffect副作用中的销毁函数
export function commitPassiveUnmountEffects(finishedWork) {
  commitPassiveUnmountOnFiber(finishedWork);
}
function commitPassiveUnmountOnFiber(finishedWork) {
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case HostRoot:
      recursivelyTraversePassiveUnmountEffects(finishedWork);
      break;
    case FunctionComponent:
      recursivelyTraversePassiveUnmountEffects(finishedWork);
      if (flags & Passive) {
        commitHookPassiveUnmountEffects(
          finishedWork,
          HookHasEffect | HookPassive
        );
      }
      break;
  }
}
function recursivelyTraversePassiveUnmountEffects(parentFiber) {
  if (!parentFiber) {
    return;
  }
  let child = parentFiber.cihld;
  while (child) {
    commitPassiveUnmountOnFiber(child); // 递归执行子节点所有effect
    child = child.sibling;
  }
}
function commitHookPassiveUnmountEffects(finishedWork, hookFlags) {
  commitHookEffectListUnmount(hookFlags, finishedWork);
}
function commitHookEffectListUnmount(flags, finishedWork) {
  // 真正执行的地方
  const updateQueue = finishedWork.updateQueue;
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect.tag && flags) === flags) {
        const destroy = effect.destroy;
        destroy && destroy();
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}

// 执行useEffect副作用
export function commitPassiveMountEffects(root, finishedWork) {
  commitPassiveMountOnFiber(root, finishedWork);
}
function commitPassiveMountOnFiber(finishedRoot, finishedWork) {
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case HostRoot:
      recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork);
      break;
    case FunctionComponent:
      recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork);
      if (flags & Passive) {
        commitHookPassiveMountEffects(
          finishedWork,
          HookHasEffect | HookPassive
        );
      }
      break;
  }
}
function recursivelyTraversePassiveMountEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & Passive) {
    let child = parentFiber.cihld;
    while (child) {
      commitPassiveMountOnFiber(root, child); // 递归执行子节点上所有副作用
      child = child.sibling;
    }
  }
}
function commitHookPassiveMountEffects(finishedWork, hookFlags) {
  commitHookEffectListMount(hookFlags, finishedWork);
}
function commitHookEffectListMount(flags, finishedWork) {
  const updateQueue = finishedWork.updateQueue;
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect.tag & flags) === flags) {
        const create = effect.create;
        effect.destroy = create(); // 执行副作用并获取销毁函数
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}

// 触发useLayoutEffect
export function commitLayoutEffects(finishedWork, root) {
  const current = finishedWork.alternate;
  commitLayoutEffectOnFiber(root, current, finishedWork);
}
function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork) {
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case HostRoot: {
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      break;
    }
    case FunctionComponent: {
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      if (flags & LayoutMask) {
        commitHookLayoutEffects(finishedWork, HookHasEffect | HookLayout);
      }
      break;
    }
  }
}
function recursivelyTraverseLayoutEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & LayoutMask) {
    let child = parentFiber.child;
    while (child !== null) {
      const current = child.alternate;
      commitLayoutEffectOnFiber(root, current, child);
      child = child.sibling;
    }
  }
}
function commitHookLayoutEffects(finishedWork, hookFlags) {
  commitHookEffectListMount(hookFlags, finishedWork);
}
