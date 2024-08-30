// 优先级调度核心逻辑
import {
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
} from "./SchedulerPriorities";

import { push, peek } from "./SchedulerMinHeap";
const maxSigned31BitInt = 1073741823; // 31位全1二进制
let taskIdCounter = 1; // 任务计数器,做任务id用
let taskQueue = []; // 任务列表,以最小堆的方式存放所有需要执行的任务
let scheduleHostCallback = null; // 存放当前执行的workLoop
let currentTask = null; // 当前执行的任务
let startTime = -1; // 每一次重新执行任务队列时执行第一个任务的开始时间,
const frameInterval = 5; // 确保每次执行任务队列时,如果执行到第n个任务时,当前时间和执行第一个任务的开始时间超过该值,则不执行第n个任务,让出控制权

let channel = new MessageChannel(); //消息通道,使不同上下文环境(线程,iframe)\相互通信,通过端口的postMessage和onMessage实现
let port1 = channel.port1; // 获取通信端口
let port2 = channel.port2; // 获取通信端口
port1.onMessage = performWorkUntilDeadline;

const IMMEDIATE_PRIORITY_TIMEOUT = -1;
const USER_BLOCKING_PRIORITY_TIMEOUT = 250;
const NORMAL_PRIORITY_TIMEOUT = 5000;
const LOW_PRIORITY_TIMEOUT = 10000;
const IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;
// 不同优先级超时时间映射表,从上到下优先级由高到低
const priorityLevelToTimeMap = {
  [ImmediatePriority]: IMMEDIATE_PRIORITY_TIMEOUT, // 紧急任务,需要立刻执行,如用户输入后需要立即更新UI
  [UserBlockingPriority]: USER_BLOCKING_PRIORITY_TIMEOUT, // 用户阻塞优先级,如点击按钮后需要更新UI
  [NormalPriority]: NORMAL_PRIORITY_TIMEOUT, // 正常优先级, 一般的UI更新操作,增删改查
  [LowPriority]: LOW_PRIORITY_TIMEOUT, // 低优先级,如记录日志等对用户体验影响很小的操作
  [IdlePriority]: IDLE_PRIORITY_TIMEOUT, // 空闲优先级,如数据预加载,缓存等任务
};
/**
 * @message: 调度回调函数
 * @param {ImmediatePriority | UserBlockingPriority | NormalPriority | LowPriority | IdlePriority} priorityLevel - 优先级
 * @param {*} callback 回调(fiber工作循环)
 */
export function scheduleCallback(priorityLevel, callback) {
  // 计算不同优先级任务的超时时间
  const currentTime = Date.now();
  const startTime = currentTime;
  const timeout =
    priorityLevelToTimeMap[priorityLevel] || NORMAL_PRIORITY_TIMEOUT; // 获取该任务等级对应的超时时间
  const expirationTime = startTime + timeout; // 计算出从现在开始,该任务在何时超时,后续逻辑中,对于超时任务更紧急执行

  const newTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: expirationTime,
  };
  push(taskQueue, newTask); // 加入最小堆
  requestHostCallback(workLoop); // 将任务加入宏任务队列进行执行
  return newTask;
}

/**
 * @message:请求主机回调
 * @param {*} workLoop 工作循环函数
 */
function requestHostCallback(workLoop) {
  scheduleHostCallback = workLoop;
  schedulePerformWorkUntilDeadline();
}
/**
 * @message: 通知开始执行工作
 *  */
function schedulePerformWorkUntilDeadline() {
  port2.postMessage(null);
}

/**
 * @message: 执行工作到截至时间,port2发送消息的时候触发
 */
function performWorkUntilDeadline() {
  if (scheduleHostCallback) {
    let hasMoreWork = true;
    try {
      hasMoreWork = scheduleHostCallback(); // 执行任务(即workLoop函数),返回true表示队列中还有任务
    } finally {
      if (hasMoreWork) {
        schedulePerformWorkUntilDeadline(); // 如果还有任务,继续触发执行
      } else {
        scheduleHostCallback = null;
      }
    }
  }
}
/**
 * 工作循环:执行任务队列中的任务,任务中断执行的核心逻辑
 * return boolean: 如果任务没有执行完则返回false,如果任务执行完成了返回true
 */
function workLoop() {
  let currentTime = (startTime = Date.now());
  currentTask = peek(taskQueue);
  while (currentTask) {
    // 在当前时间分片中执行任务
    if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
      // 任务已经超时并且需要交还控制权
      break;
    }
    const callback = currentTask.callback;
    if (typeof callback === "function") {
      currentTask.callback = null;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime; // 任务是否超时
      const continuationCallback = callback(didUserCallbackTimeout); // 任务没有执行完时,返回一个新函数,之后调度继续执行
      if (typeof continuationCallback === "function") {
        currentTask.callback = continuationCallback; // 保存未执行完的任务返回的剩余任务函数
        return true;
      }

      // 上个任务执行完了,删除掉
      if (currentTask === peek(taskQueue)) {
        pop(taskQueue);
      }
    } else {
      pop(taskQueue);
    }

    currentTask = peek(taskQueue);
  }
  if (currentTask) {
    return true; // 表示还有任务
  }
  return false; // 没有任务了
}

function shouldYieldToHost() {
  // 是否应该交还主线程的控制权
  const timeElapsed = Date.now() - startTime;
  if (timeElapsed < frameInterval) {
    return false;
  }
  return true;
}

export {
  scheduleCallback as unstable_scheduleCallback,
  shouldYieldToHost as unstable_shouldYield,
  ImmediatePriority as unstable_ImmediatePriority,
  UserBlockingPriority as unstable_UserBlockingPriority,
  NormalPriority as unstable_NormalPriority,
  LowPriority as unstable_LowPriority,
  IdlePriority as unstable_IdlePriority,
};
