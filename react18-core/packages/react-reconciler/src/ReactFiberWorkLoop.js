import { createWorkInProgress } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";
import { completeWork } from "./ReactFiberCompleteWork";
import {
  NoLanes,
  markRootUpdated,
  getNextLanes,
  getHighestPriorityLane,
  SyncLane,
} from "./ReactFiberLane";
import {
  getCurrentUpdatePriority,
  lanesToEventPriority,
  DiscreteEventPriority,
  ContinuousEventPriority,
  DefaultEventPriority,
  IdleEventPriority,
} from "./ReactEventPriorities";
import {
  scheduleCallback as Scheduler_scheduleCallback,
  shouldYield,
  ImmediatePriority as ImmediateSchedulerPriority,
  UserBlockingPriority as UserBlockingSchedulerPriority,
  NormalPriority as NormalSchedulerPriority,
  IdlePriority as IdleSchedulerPriority,
} from "./schedule";
import { getCurrentEventPriority } from "react-dom-bindings/src/client/ReactDOMHostConfig";
import {
  commitMutationEffectsOnFiber,
  commitPassiveUnmountEffects,
  commitPassiveMountEffects,
  commitLayoutEffects,
} from "./ReactFiberCommitWork";
import { finishQueueingConcurrentUpdates } from "./ReactFiberConcurrentUpdates";
import { NoFlags, MutationMask, Passive } from "./ReactFiberFlags";
import { flushSyncCallbacks } from "./ReactFiberSyncTaskQueue";

// 上一个工作fiber
let workInProgressRoot = null;
let workInProgressRenderLanes = NoLanes;

let rootDoesHavePassiveEffect = false; //是否需要执行effect
let rootWithPendingPassiveEffects = null;

let workInProgressRootRenderLanes;
const RootInProgress = 0;
const RootCompleted = 5;

// 全局变量,正在构建的工作进程树节点
let workInProgress;
/**
 * 开始调度更新
 */
export function scheduleUpdateOnFiber(FiberRoot, fiber, lane) {
  markRootUpdated(root, lane); // 更新根节点的优先级
  ensureRootIsScheduled(FiberRoot);
}

export function ensureRootIsScheduled(FiberRoot) {
  const nextLanes = getNextLanes(root, NoLanes);
  if (nextLanes === NoLanes) {
    return null;
  }

  let newCallbackPriority = getHighestPriorityLane(nextLanes);
  let newCallbackNode;
  if (newCallbackPriority === SyncLane) {
    // 同步渲染
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, FiberRoot)); // 将更新任务加到同步任务队列
    queueMicrotask(flushSyncCallbacks); // 清空队列的任务加到微任务队列
    newCallbackNode = null;
  } else {
    let schedulerPriorityLevel;
    // 根据lane优先级确定事件优先级,根据事件优先级确定调度优先级
    switch (lanesToEventPriority(nextLanes)) {
      case DiscreteEventPriority:
        schedulerPriorityLevel = ImmediateSchedulerPriority;
        break;
      case ContinuousEventPriority:
        schedulerPriorityLevel = UserBlockingSchedulerPriority;
        break;
      case DefaultEventPriority:
        schedulerPriorityLevel = NormalSchedulerPriority;
        break;
      case IdleEventPriority:
        schedulerPriorityLevel = IdleSchedulerPriority;
        break;
      default:
        schedulerPriorityLevel = NormalSchedulerPriority;
        break;
    }
    // 开始调度更新
    Scheduler_scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, FiberRoot)
    );
  }
}

// 开始同步渲染
function performSyncWorkOnRoot(FiberRoot) {
  const lanes = getNextLanes();
  renderRootSync(FiberRoot, lanes);
  FiberRoot.finishedWork = FiberRoot.current.alternate;
  commitWork(FiberRoot);
  return null;
}

/**
 * 开始并发渲染
 */
function performConcurrentWorkOnRoot(FiberRoot, didTimeout) {
  const originalCallbackNode = FiberRoot.callbackNode;
  const lanes = getNextLanes(root, NoLanes);
  if (lanes === NoLanes) {
    return null;
  }

  const shouldTimeSlice =
    !includesBlockingLane(FiberRoot, lanes) && !didTimeout; // 如果没有阻塞级别的任务或任务没有超时,则使用并发渲染
  const exitStatus = shouldTimeSlice
    ? renderRootConcurrent(FiberRoot, lanes)
    : renderRootSync(FiberRoot, lanes); // 如果需要事件分片,使用并发渲染,否则使用同步渲染

  // 渲染完成了
  if (exitStatus !== RootInProgress) {
    // 通过alternate拿到更新好的fiber树
    FiberRoot.finishedWork = FiberRoot.current.alternate;
    commitWork(FiberRoot); // 提交阶段,commitWork
  }

  // 渲染还没有完成
  if (root.callbackNode === originalCallbackNode) {
    // 返回一个函数,在调度系统中,发现返回的是一个函数,就知道任务还没执行完毕需要继续调度
    return performConcurrentWorkOnRoot.bind(null, FiberRoot);
  }
  return null;
}

// 并发渲染阶段逻辑
function renderRootConcurrent(FiberRoot, nextLanes) {
  if (
    workInProgress !== FiberRoot &&
    workInProgressRootRenderLanes !== nextLanes
  ) {
    prepareFreshStack(FiberRoot.lanes);
  }
  workLoopConcurrent();
  if (workInProgress !== null) {
    return RootInProgress;
  }
  return workInProgressRootExitStatus;
}

// 同步渲染阶段逻辑,包含beginWork,completeWork
function renderRootSync(FiberRoot, nextLanes) {
  if (
    root !== workInProgressRoot ||
    workInProgressRootRenderLanes !== renderLanes
  ) {
    // 初始化/复用工作进程树,FiberRoot的current的alternate就指向工作进程树了
    prepareFreshStack(root, renderLanes);
  }
  workLoopSync();
}
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
/**
 * 准备一个新的工作栈
 */
function prepareFreshStack(FiberRoot, renderLanes) {
  workInProgress = createWorkInProgress(FiberRoot.current, null);
  workInProgressRootRenderLanes = renderLanes;
  workInProgressRoot = root;
  finishQueueingConcurrentUpdates();
}

/**
 * 同步工作循环
 */
function workLoopSync() {
  while (workInProgress) {
    console.log(18);
    performUnitOfWork(workInProgress);
  }
}

/**
 * 执行一个工作单元,unitOfWork 工作单元
 */
function performUnitOfWork(unitOfWork) {
  const currentRootFiber = unitOfWork.alternate;
  const next = beginWork(
    currentRootFiber,
    unitOfWork,
    workInProgressRenderLanes
  ); // 虚拟DOM转换fiber,转换完成后返回子节点
  unitOfWork.memoizedProps = unitOfWork.pendingProps; // 经过beginWork,等待更新的props已经更新好了
  if (next === null) {
    // 交替执行的衔接点
    completeUnitOfWork(unitOfWork); // fiber转换真实DOM,此时unitOfWork对应的fiber节点,是fiber转换真实DOM的开始节点,一定满足以下条件
    // 是某个fiber节点的第一个子元素: 因为beginWork返回的是fiber节点的child属性值,指向第一个节点
    // 本身没有子节点.如果有子节点next一定不为null
  } else {
    workInProgress = next;
  }
}

// completeWork与beginWork交替执行的衔接点
function completeUnitOfWork(unitOfWork) {
  // 注意此时的unitOfWork是第一个满足本身没有子节点的fiber,需要生成真实DOM
  let _unitOfWork = unitOfWork;
  do {
    // 处理
    const curent = _unitOfWork.alternate;
    completeWork(curent, _unitOfWork);
    const siblingFiber = _unitOfWork.sibling;
    if (siblingFiber !== null) {
      workInProgress = siblingFiber; // 自身处理完后处理兄弟节点,从beginWork开始
      return;
    }

    // 没有子节点
    const returnFiber = _unitOfWork.return;
    _unitOfWork = returnFiber;
    workInProgress = returnFiber; // 为空时结束循环,进行提交
    console.log(19);
  } while (_unitOfWork !== null);
  if (workInProgressRootExitStatus === RootInProgress) {
    workInProgressRootExitStatus = RootCompleted;
  }
}
// 提交阶段
function commitWork(FiberRoot) {
  // 判断是否需要更新
  const { finishedWork } = FiberRoot;
  workInProgressRoot = null;
  workInProgressRenderLanes = null;
  if (
    (finishedWork.subtreeFlags & Passive) !== NoFlags ||
    (finishedWork.flags & Passive) !== NoFlags
  ) {
    // 需要执行副作用
    if (!rootDoesHavePassiveEffect) {
      rootDoesHavePassiveEffect = true;
      scheduleCallback(NormalSchedulerPriority, flushPassiveEffect);
    }
  }

  const subtreeHasEffect = finishedWork.subtreeFlags & MutationMask;
  const rootHasEffect = finishedWork.flags & MutationMask;
  // 进行更新
  if (rootHasEffect || subtreeHasEffect) {
    commitMutationEffectsOnFiber(finishedWork, FiberRoot);
    commitLayoutEffects(finishedWork, FiberRoot); // 触发useLayout
    if (rootDoesHavePassiveEffect) {
      rootDoesHavePassiveEffect = false;
      rootWithPendingPassiveEffects = FiberRoot;
    }
  }
  // 应用新的fibler树
  FiberRoot.current = finishedWork;
}

// 执行effect副作用
function flushPassiveEffect() {
  if (rootWithPendingPassiveEffects !== null) {
    const root = rootWithPendingPassiveEffects;
    commitPassiveUnmountEffects(root.current); // 执行destroy
    commitPassiveMountEffects(root, root.current); // 执行create
  }
}

export function requestUpdateLane() {
  const updateLane = getCurrentUpdatePriority();
  if (updateLane !== NoLanes) {
    return updateLane;
  }
  const eventLane = getCurrentEventPriority();
  return eventLane;
}
