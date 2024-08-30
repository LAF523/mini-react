import { markUpdateLaneFromFiberToRoot } from "./ReactFiberConcurrentUpdates";
import { NoLanes, mergeLanes, isSubsetOfLanes } from "./ReactFiberLane";
import { enqueueConcurrentClassUpdate } from "./ReactFiberConcurrentUpdates";

export const UpdateState = 0;

export function initialUpdateQueue(fiber) {
  const queue = {
    baseState: fiber.memoizedState, // 保存之前的更新值
    shared: { pending: null }, // 创建一个新的更新队列,pending是一个特殊的循环链表
    firstBaseUpdate: null, // 链表中,上次更新由于优先级低,没有更新的第一个更新对象
    lastBaseUpdate: null, // 链表中,上次更新由于优先级低,没有更新的最后一个更新对象
  };
  fiber.updateQueue = queue;
}

/**
 * 创建更新对象,lane:更新优先级
 */
export function createUpdate(lane) {
  const update = { tag: UpdateState, lane, next: null };
  return update;
}

/**
 * 构建链表结构,并使fiber节点的updateQueue始终指向链表末尾节点
 */
export function enqueueUpdate(fiber, update, lane) {
  const updateQueue = fiber.updateQueue;
  const sharedQueue = updateQueue.shared;

  return enqueueConcurrentClassUpdate(fiber, sharedQueue, update, lane);

  // const pending = updateQueue.shared.pending;
  // if (pending === null) {
  //   // 第一次
  //   update.next = update;
  // } else {
  //   // 形成一个单向循环链表,
  //   pending.next = update; // 存疑?
  //   update.next = pending;
  // }
  // updateQueue.shared.pending = update; // 始终指向循环链表的最后一个节点,

  // return markUpdateLaneFromFiberToRoot(fiber); // 根据fiber节点获取FiberRoot
}
/**
 * @message: 处理更新队列
 * @param {*} workInProgress 正在处理的fiber
 * @param {*} nextProps 新的props
 * @param {*} renderLanes 渲染车道
 */
export function processUpdateQueue(workInProgress, nextProps, renderLanes) {
  const queue = workInProgress.updateQueue;
  let firstBaseUpdate = queue.firstBaseUpdate;
  let lastBaseUpdate = queue.lastBaseUpdate;
  const pendingQueue = queue.shared.pending;

  if (pendingQueue !== null) {
    queue.shared.pending = null;
    const lastPendingUpdate = pendingQueue; // 指向的是环形更新链表的最后一个对象
    const firstPendingUpdate = lastPendingUpdate.next; // 环形更新链表最后一个元素指向第一个更新对象
    lastPendingUpdate.next = null; // 剪开环形链表

    // 把上次剩下的更新,加入新的更新中
    if (lastBaseUpdate === null) {
      // 上次更新没有剩下的更新对象
      firstBaseUpdate = firstPendingUpdate;
    } else {
      // 上次剩下的有
      lastBaseUpdate.next = firstPendingUpdate;
    }
    lastBaseUpdate = lastPendingUpdate;

    if (firstBaseUpdate !== null) {
      // 说明有更新任务
      let newState = queue.baseState;
      let newLanes = NoLanes;
      let newBaseState = null;
      let newFirstBaseUpdate = null;
      let newLastBaseUpdate = null;
      let update = firstBaseUpdate;

      do {
        const updateLane = update.lane;
        // 新任务的优先级不在渲染车道中
        if (!isSubsetOfLanes(renderLanes, updateLane)) {
          // 构建链表,并使newFirstBaseUpdate指向第一个,newLastBaseUpdate指向最后一个
          const clone = {
            id: update.id,
            lane: updateLane,
            payload: update.payload,
          };
          if (newLastBaseUpdate === null) {
            newFirstBaseUpdate = newLastBaseUpdate = clone;
            newBaseState = newState;
          } else {
            newLastBaseUpdate = newLastBaseUpdate.next = clone;
          }

          newLanes = mergeLanes(newLanes, updateLane); // 合并任务中的优先级
        } else {
          // 该更新对象的优先级在车道中,
          if (newLastBaseUpdate !== null) {
            const clone = {
              id: update.id,
              lane: 0,
              payload: update.payload,
            };
            newLastBaseUpdate = newLastBaseUpdate.next = clone;
          }
          newState = getStateFromUpdate(update, newState); // 合并state
        }
        update = update.next;
      } while (update);
      if (!newLastBaseUpdate) {
        newBaseState = newState;
      }
      queue.baseState = newBaseState;
      queue.firstBaseUpdate = newFirstBaseUpdate;
      queue.lastBaseUpdate = newLastBaseUpdate;
      workInProgress.lanes = newLanes;
      workInProgress.memoizedState = newState;
    }
  }
}

function getStateFromUpdate(update, preState) {
  const { payload } = update;
  // 相当于更新了虚拟DOM的各个属性
  return Object.assign({}, preState, payload);
}
