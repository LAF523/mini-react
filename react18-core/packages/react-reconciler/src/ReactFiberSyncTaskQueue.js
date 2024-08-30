// 同步渲染逻辑
import {
  DiscreteEventPriority,
  getCurrentUpdatePriority,
  setCurrentUpdatePriority,
} from "./ReactEventPriorities";

let syncQueue = null; // 同步任务队列
let isFlushingSyncQueue = false; // 是否正在执行同步队列中的任务

// 将渲染函数存储在队列中
export function scheduleSyncCallback(callback) {
  if (syncQueue === null) {
    syncQueue = [callback];
  } else {
    syncQueue.push(callback);
  }
}

/**
 * 执行并清空同步回调队列
 */
export function flushSyncCallbacks() {
  if (!isFlushingSyncQueue && syncQueue !== null) {
    isFlushingSyncQueue = true;
    let i = 0;

    // 存储当前的更新优先级
    let previousUpdatePriority = getCurrentUpdatePriority();
    try {
      const isSync = true;
      const queue = syncQueue;
      // 把优先级设置为同步优先级
      setCurrentUpdatePriority(DiscreteEventPriority);

      // 开始执行任务
      for (let i = 0; i < queue.length; i++) {
        let callback = queue[i];
        do {
          callback = callback(isSync);
        } while (callback);
      }
      syncQueue = null;
    } finally {
      // 任务执行完毕,恢复优先级指之前的状态
      setCurrentUpdatePriority(previousUpdatePriority);
      isFlushingSyncQueue = false;
    }
  }
}
