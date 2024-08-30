import { HostRoot } from "./ReactWorkTag";

const concurrentQueue = []; // 存放hook的队列
let concurrentQueuesIndex = 0; // 队列的下标

/**
 * 查找根节点
 */
export function markUpdateLaneFromFiberToRoot(fiber) {
  let node = fiber;
  let parent = fiber.return;
  while (parent !== null) {
    console.log(16);
    node = parent;
    parent = parent.return;
  }

  if (node.tag === HostRoot) {
    return node.stateNode;
  }
  return null;
}

// 入队+返回根节点
export function enqueueConcurrentHookUpdate(fiber, queue, update) {
  enqueueUpdate(fiber, queue, update); // 入队
  return markUpdateLaneFromFiberToRoot(fiber); // 返回根节点
}
// 入队
function enqueueUpdate(fiber, queue, update, lane) {
  concurrentQueue[concurrentQueuesIndex++] = fiber; //使用该hook的函数式组件对应的fiber对象
  concurrentQueue[concurrentQueuesIndex++] = queue; //hook对象的更新队列
  concurrentQueue[concurrentQueuesIndex++] = update; // 保存了action
  concurrentQueue[concurrentQueuesIndex++] = lane; // 优先级
}

export function finishQueueingConcurrentUpdates() {
  const endIndex = concurrentQueuesIndex;
  concurrentQueuesIndex = 0;
  let i = 0;
  while (i < endIndex) {
    console.log(17);
    const fiber = concurrentQueue[i++];
    const queue = concurrentQueue[i++]; // hook对象的更新队列
    const update = concurrentQueue[i++]; // 保存了action
    const lane = concurrentQueue[i++]; // 保存了优先级

    if (queue !== null && update !== null) {
      // 使多个update构成环形链表,pending指向最后一个链表节点
      const pending = queue.pending;
      if (pending === null) {
        update.next = update;
      } else {
        update.next = pending.next;
        pending.next = update;
      }
      queue.pending = update;
    }
  }
}

/**
 * 将组件更新加入并发队列
 * @param {Object} fiber - fiber对象
 * @param {Object} queue - 更新队列
 * @param {Object} update - 更新对象
 * @param {number} lane - 车道信息
 * @returns {Object|null} 更新的fiber的根，如果不存在则返回null
 */
export function enqueueConcurrentClassUpdate(fiber, queue, update, lane) {
  enqueueUpdate(fiber, queue, update, lane);
  return getRootForUpdatedFiber(fiber);
}

/**
 * 获取更新的fiber的根节点
 * @private
 * @param {Object} sourceFiber - 源fiber节点
 * @returns {Object|null} fiber的根节点，如果不存在则返回null
 */
function getRootForUpdatedFiber(sourceFiber) {
  let node = sourceFiber;
  let parent = node.return;
  while (parent !== null) {
    node = parent;
    parent = node.return;
  }
  return node.tag === HostRoot ? node.stateNode : null;
}
