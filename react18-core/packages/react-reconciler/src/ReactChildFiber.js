import { isObject, isArray } from "../../shared/index";
import { REACT_ELEMENT_TYPE } from "../../shared/ReactSymbol";
import {
  createFiberFromElement,
  createFiberFromText,
  createWorkInProgress,
} from "./ReactFiber";
import { Placement, ChildDeletion } from "./ReactFiberFlags";
import { HostText } from "./ReactWorkTag";

export const mountChildFibers = createChildReconciler(false); // 初次挂载用这个
export const reconclieChildFibers = createChildReconciler(true); // 后续更新用这个
function createChildReconciler(shouldTrackSideEffects) {
  // nextChildrn可能是单个节点,数组
  const reconcileChidrenFibers = (
    workInProgress,
    currentFirstFiber,
    nextChildren
  ) => {
    if (isObject(nextChildren)) {
      switch (nextChildren.$$typeof) {
        case REACT_ELEMENT_TYPE:
          let newFiber = reconcileSingleElement(
            workInProgress,
            currentFirstFiber,
            nextChildren
          );
          // TODO:可能出错
          newFiber = placeSingleChild(newFiber);
          return newFiber;
        default:
          break;
      }
    }
    if (isArray(nextChildren)) {
      return reconcileChildrenArray(
        workInProgress,
        currentFirstFiber,
        nextChildren
      );
    }
    return null;
  };
  return reconcileChidrenFibers;

  // 多个节点不仅需要创建fiber,还要构建fiber子节点之间和父子节点之间的关系
  function reconcileChildrenArray(
    workInProgress,
    currentFirstFiber,
    nextChildren
  ) {
    let firstFiberChild = null;
    let preFiberChild = null;
    let index = 0;

    // 第一套方案:同序比较
    let oldFiber = currentFirstFiber;
    let nextOldFiber = null;
    let lastPlaceIndex = 0; //记录当前最后一个不移动的fiber,用来判断之后的fiber是否需要移动

    for (; oldFiber !== null && index < nextChildren.length; index++) {
      nextOldFiber = oldFiber.sibling;
      const newFiber = updateSlot(
        workInProgress,
        oldFiber,
        nextChildren[index]
      );
      if (newFiber === null) {
        break;
      }
      if (shouldTrackSideEffects) {
        if (oldFiber && newFiber.alternate === null) {
          // 说明newFiber不是复用的fiber,复用的fiber的alternate不为空
          deleteFiber(workInProgress, oldFiber);
        }
      }

      lastPlaceIndex = placeChild(newFiber, lastPlaceIndex, index); // 判断节点是否需要移动,是,打上标记

      // 构建子节点之间的关系
      if (preFiberChild === null) {
        firstFiberChild = newFiber;
      } else {
        preFiberChild.sibling = newFiber;
      }
      preFiberChild = newFiber;

      oldFiber = nextOldFiber; // 保持和vnodeArray遍历同序
    }
    // 新节点比较完毕
    if (index === nextChildren.length) {
      deleteRemainingChildren(returnFiber, oldFiber);
      return firstFiberChild;
    }

    // 第二套方案
    if (oldFiber === null) {
      //说明,oldFiber已经遍历完毕了,剩下的vnode需要直接创建
      for (; index < nextChildren.length; index++) {
        let newFiber = createChildFiber(workInProgress, nextChildren[index]); // 创建fiber并指构建父子节点间关系
        if (newFiber === null) continue;
        newFiber.index = index; // 记录位置
        newFiber = placeSingleChild(newFiber); // 赋值flags,
        // 构建子节点间的关系
        if (firstFiberChild === null) {
          firstFiberChild = newFiber;
        } else {
          preFiberChild.sibling = newFiber; // 构建子节点之间的关系
        }
        preFiberChild = newFiber;
      }
    }

    // 第三套方案,到这里oldFiber和vnode都没比较完
    // 1.构建oldFiber的key与oldFiber映射
    const oldFiberKeyToOldFiberMap = mapRemainingChildren(oldFiber);
    for (; index < nextChildren.length; index++) {
      const newFiber = updateFormMap(
        oldFiberKeyToOldFiberMap,
        workInProgress,
        index,
        nextChildren[index]
      );
      if (newFiber) {
        if (shouldTrackSideEffects) {
          // 删除旧fiber
          if (newFiber.alternate !== null) {
            // 说明复用了该节点,从map中删除
            const key = newFiber.key || index;
            oldFiberKeyToOldFiberMap.delete(key);
          }
        }
      }

      lastPlaceIndex = placeChild(newFiber, lastPlaceIndex, index);

      // 构建子节点间的关系
      if (firstFiberChild === null) {
        firstFiberChild = newFiber;
      } else {
        preFiberChild.sibling = newFiber; // 构建子节点之间的关系
      }
      preFiberChild = newFiber;
    }

    return firstFiberChild; // 返回的是第一个子节点,所以第一个子节点没有后续子节点时将不再继续构建,即使其兄弟节点还有子节点
  }
  // 根据keyMap处理节点,是可以复用呢还是创建呢
  function updateFormMap(keyMap, workInProgress, index, nextChildren) {
    const isText =
      (typeof nextChildren === "string" && nextChildren !== "") ||
      typeof nextChildren === "number";
    if (isText) {
      const oldFiber = keyMap.get(index);
      return updateTextNode(workInProgress, oldFiber, String(nextChildren));
    }
    const isVnode = typeof nextChildren === "object" && nextChildren !== null;
    if (isVnode) {
      switch (nextChildren.$$typeof) {
        case REACT_ELEMENT_TYPE:
          const key = nextChildren.key || index;
          const oldFiber = keyMap.get(key);
          return updateElement(workInProgress, oldFiber, nextChildren);
      }
    }
  }

  // 创建或复用textFiber
  function updateTextNode(workInProgress, oldFiber, newChild) {
    if (!oldFiber || oldFiber.tag !== HostText) {
      // 创建新的textFiber
      const created = createFiberFromText(newChild);
      created.return = workInProgress;
      return created;
    } else {
      // 复用旧的fiber
      const clone = useFiber(oldFiber, newChild);
      clone.return = workInProgress;
      return clone;
    }
  }

  // 构建key与fiber的map
  function mapRemainingChildren(oldFiber) {
    const map = new Map();
    let fiber = oldFiber;
    while (fiber !== null) {
      console.log(3);
      const key = fiber.key || fiber.index;
      map.set(key, fiber);
      fiber = fiber.sibling;
    }
    return map;
  }

  function createChildFiber(workInProgress, newChild) {
    let newFiber = null;
    const isText =
      (typeof newChild === "string" && newChild !== "") ||
      typeof newChild === "number";
    if (isText) {
      newFiber = createFiberFromText(newChild);
      newFiber.return = workInProgress;
    } else if (isObject(newChild)) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          newFiber = createFiberFromElement(newChild);
          newFiber.return = workInProgress;
        default:
          break;
      }
    }
    return newFiber;
  }

  // 判断oldFiber与newVnode的key
  function updateSlot(workInProgress, oldFiber, newVnode) {
    const key = oldFiber === null ? null : oldFiber.key;
    if (newVnode !== null && typeof newVnode === "object") {
      switch (newVnode.$$typeof) {
        case REACT_ELEMENT_TYPE:
          if (newVnode.key === key) {
            return updateElement(workInProgress, oldFiber, newVnode); // 判断type,复用fiber,更新fiber属性
          }
          break;
        default:
          return null;
      }
    }
    return null;
  }

  //根据vnode复用/创建fiber, 判断类型,可复用: 更新props,不可复用:根据element生成fiber
  function updateElement(workInProgress, oldFiber, newVnode) {
    const elementType = newVnode.type;
    let fiber = null;
    if (oldFiber !== null && oldFiber.type === elementType) {
      // 类型相同可以复用
      fiber = useFiber(oldFiber, newVnode.props);
    } else {
      // 无法复用,生成新的fiber
      fiber = createFiberFromElement(newVnode);
    }
    fiber.return = workInProgress;
    return fiber;
  }

  /**
   * 将新虚拟DOM转换为fiber,diff
   * */
  function reconcileSingleElement(
    workInProgress,
    currentFirstFiber,
    nextChildren
  ) {
    // 转换之前,先diff:单个新虚拟DOM节点
    let oldFiber = currentFirstFiber;
    while (oldFiber !== null) {
      console.log(4);
      const isSameKey = currentFirstFiber.key === nextChildren.key;
      if (isSameKey) {
        const isSameType = currentFirstFiber.type === nextChildren.type;
        if (isSameType) {
          // 删除其他兄弟节点
          deleteRemainingChildren(workInProgress, oldFiber.sibling);
          // 复用当前fiber节点,传递新的props
          const existing = useFiber(oldFiber, nextChildren.props); // 复用老fiber属性到新的fiber中
          existing.return = workInProgress;
          return existing;
        } else {
          // 删除当前节点及兄弟节点
          deleteRemainingChildren(workInProgress, oldFiber);
        }
      } else {
        // 删除当前fiber
        deleteFiber(workInProgress, oldFiber);
      }
      oldFiber = oldFiber.sibling;
    }

    const created = createFiberFromElement(nextChildren);
    created.return = workInProgress;
    return created;
  }

  // 根据老fiber复制出更新后的fiber
  function useFiber(oldFiber, newProps) {
    const clone = createWorkInProgress(oldFiber, newProps);
    clone.index = 0;
    clone.sibling = null;
    return clone;
  }

  // 将fiber节点添加到父fiber删除队列
  function deleteFiber(workInProgress, oldFiber) {
    if (!shouldTrackSideEffects) {
      return;
    }
    if (workInProgress.deletions === null) {
      workInProgress.deletions = [oldFiber];
      workInProgress.flags |= ChildDeletion;
    } else {
      workInProgress.deletions.push(oldFiber);
    }
  }

  // 将当前fiber节点及其兄弟节点添加到父fiber删除队列
  function deleteRemainingChildren(workInProgress, oldFiber) {
    if (!shouldTrackSideEffects) {
      return;
    }
    let fiber = oldFiber;
    while (fiber !== null) {
      console.log(5);
      deleteFiber(workInProgress, fiber);
      fiber = fiber.sibling;
    }
    return null;
  }

  // 添加flags
  function placeSingleChild(fiber) {
    if (shouldTrackSideEffects) {
      fiber.flags |= Placement; // 需要插入
    }
    return fiber;
  }
  // 给需要移动的节点打上标记
  function placeChild(newFiber, lastPlaceIndex, index) {
    if (!shouldTrackSideEffects) {
      return lastPlaceIndex;
    }
    newFiber.index = index;

    const current = newFiber.alternate;
    if (current) {
      // 是复用的
      if (index < lastPlaceIndex) {
        newFiber.flags |= Placement;
        return lastPlaceIndex;
      } else {
        return index;
      }
    } else {
      newFiber.flags |= Placement;
      return lastPlaceIndex;
    }
  }
}
