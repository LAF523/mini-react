//处理hooks,和函数式组件
import ReactSharedInternals from "shared/ReactSharedInternals";
import { enqueueConcurrentHookUpdate } from "./ReactFiberConcurrentUpdates";
import { scheduleUpdateOnFiber, requestUpdateLane } from "./ReactFiberWorkLoop";
import { NoLane, NoLanes } from "./ReactFiberLane";
import {
  HasEffect as HookHasEffect,
  Passive as HookPassive,
  Layout as HookLayout,
} from "./ReactHookEffectTags";
import {
  Passive as PassiveEffect,
  Update as UpdateEffect,
} from "./ReactFiberFlags";
const { ReactCurrentDispatcher } = ReactSharedInternals;
// 当前正在渲染的fiber节点已经正在进行的hook
let currentlyRenderingFiber = null;
let workInProgressHook = null;
let currentHook = null;
const HooksDispatcherOnMount = {
  useReducer: mountedReducer,
  useState: mountUseState,
  useEffect: mountUseEffect,
  useLayoutEffect: mountLayoutEffect,
};
const HooksDispatcherOnUpdate = {
  useReducer: updateReducer,
  useState: updateUseState,
  useEffect: updateUseEffect,
  useLayoutEffect: updateLayoutEffect,
};

export function renderWithHooks(current, workInProgress, Component, props) {
  debugger;
  currentlyRenderingFiber = workInProgress;
  workInProgress.updateQueue = null;
  if (current !== null && current.memoizedState !== null) {
    // 有新状态,需要更新
    ReactCurrentDispatcher.current = HooksDispatcherOnUpdate;
  } else {
    // 没有新状态,说明是第一次执行,所以初始化hook
    ReactCurrentDispatcher.current = HooksDispatcherOnMount;
  }
  const vnode = Component(props);
  // hooks执行完毕,置空
  currentlyRenderingFiber = null;
  workInProgressHook = null;
  currentHook = null;
  return vnode;
}

// 初始化uselayoutEffect
function mountLayoutEffect(create, deps) {
  return mountEffectImpl(UpdateEffect, HookLayout, create, deps);
}
// 更新useLayoutEffect
function updateLayoutEffect(create, deps) {
  return updateEffectImpl(UpdateEffect, HookLayout, create, deps);
}

// 初始化useEffect
function mountUseEffect(create, deps) {
  debugger;
  return mountEffectImpl(HookHasEffect, HookPassive, create, deps);
}
function mountEffectImpl(fiberFlags, hookFlags, create, nextDeps = null) {
  const hook = mountWorkInProgress();
  currentlyRenderingFiber.flags |= fiberFlags;
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    undefined,
    nextDeps
  );
}
function pushEffect(tag, create, destroy, deps) {
  const effect = {
    tag,
    create,
    destroy,
    deps,
  };
  let componentUpdateQueue = currentlyRenderingFiber.updateQueue;
  if (componentUpdateQueue === null) {
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    currentlyRenderingFiber.updateQueue = componentUpdateQueue;
    componentUpdateQueue.lastEffect = effect.next = effect; // 构建第一个链表efect
  } else {
    const lastEffect = componentUpdateQueue.lastEffect;
    if (lastEffect === null) {
      componentUpdateQueue.lastEffect = effect.next = effect; // 构建第二个链表lastEffect
    } else {
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }
  return effect;
}
function createFunctionComponentUpdateQueue() {
  return {
    lastEffect: null,
  };
}
// useEffect更新
function updateUseEffect(create, deps) {
  debugger;
  return updateEffectImpl(PassiveEffect, HookPassive, create, deps);
}
function updateEffectImpl(fiberFlags, hookFlags, create, nextDeps = null) {
  const hook = updateWorkInProgressHook();
  let destroy;
  if (currentHook !== null) {
    const prevEffect = currentHook.memoizedState;
    destroy = prevEffect.destroy;
    if (nextDeps !== null) {
      const prevDeps = prevEffect.deps;
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // 检测依赖项有没有变化
        hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps);
        return;
      }
    }
  }
  currentlyRenderingFiber.flags |= fiberFlags;
  hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps);
}
// 依赖数组是否变化
function areHookInputsEqual(nextDeps, prevDeps) {
  if (prevDeps === null) {
    return null;
  }
  for (let i = 0; i < nextDeps.length && i < prevDeps.length; i++) {
    const next = nextDeps[i];
    const prev = prevDeps[i];
    if (Object.is(next, prev)) {
      continue;
    }
    return false;
  }
  return true;
}

// useState初始挂载
function mountUseState(initialArg) {
  // 创建hook对象
  const hook = mountWorkInProgress();
  hook.memoizedState = initialArg;
  hook.queue = {
    pending: null,
    lastRenderState: initialArg,
    lastRenderReducer: baseStateReducer,
  };
  hook.queue.dispatch = dispatchStateAction.bind(
    null,
    currentlyRenderingFiber,
    hook.queue
  );
  return [hook.memoizedState, hook.queue.dispatch];
}
function updateUseState() {
  return updateReducer(baseStateReducer);
}
// setState时触发,创建update对象,构建update环形链表
function dispatchStateAction(fiber, queue, action) {
  const lane = requestUpdateLane();
  const update = {
    lane,
    action,
    hasEagerState: false,
    eagerState: null,
    next: null,
  };
  const alternate = fiber.alternate;
  if (
    fiber.lanes === NoLanes &&
    (alternate === null || alternate.lanes == NoLanes)
  ) {
    const { lastRenderState, lastRenderReducer } = queue;
    const eagerState = lastRenderReducer(lastRenderState, action);
    update.hasEagerState = true;
    update.eagerState = eagerState;
    if (Object.is(lastRenderState, eagerState)) {
      return; // 没变化不用更新
    }
  }

  // 入队
  const root = enqueueConcurrentHookUpdate(fiber, queue, update);
  scheduleUpdateOnFiber(root); // 调度fiber开始更新
}
function baseStateReducer(state, action) {
  if (typeof action === "function") {
    return action(state);
  } else {
    return action;
  }
}

// useState初始化逻辑,挂载到链表上
function mountedReducer(reducer, initialArg) {
  const hook = mountWorkInProgress();
  hook.memoizedState = initialArg;
  hook.queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: reducer,
    lastRenderedState: initialArg,
  };
  const dispatch = dispatchReducerAction.bind(
    null,
    currentlyRenderingFiber,
    hook.queue
  );
  hook.queue.dispatch = dispatch;
  return [hook.memoizedState, dispatch];
}
function mountWorkInProgress() {
  // 构建链表
  const hook = {
    memoizedState: null, // hook的状态值
    queue: null, // 一些变化,可能影响memoizedState
    next: null, // 指向下一个hook
  };
  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    workInProgressHook = workInProgressHook.next = hook; // 添加链表节点并移动指针
  }
  // 形成这样结构: useReducer1 -> useState1->useState2...
  return workInProgressHook;
}

// 处理用户的reducer action的派发
function dispatchReducerAction(fiber, queue, action) {
  debugger;
  const update = {
    action,
    next: null,
  };
  const root = enqueueConcurrentHookUpdate(fiber, queue, update);
  scheduleUpdateOnFiber(root); // 调度fiber开始更新
}

function updateReducer(reducer) {
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;
  const current = currentHook;
  let pendingQueue = queue.pending;
  let newState = current.memoizedState;
  if (pendingQueue !== null) {
    // 说明有需要更新的
    queue.pending = null;
    const firstUpdate = pendingQueue.next;
    let update = firstUpdate;
    do {
      const action = update.action;
      newState = reducer(newState, action); // 真正重新执行hook的地方
      update = update.next;
      console.log(20);
    } while (update !== null && update !== firstUpdate);
  }
  hook.memoizedState = newState;
  return [hook.memoizedState, queue.dispatch];
}

function updateWorkInProgressHook() {
  if (currentHook === null) {
    const current = currentlyRenderingFiber.alternate;
    currentHook = current.memoizedState;
  } else {
    currentHook = currentHook.next;
  }
  // 复用旧hook的状态
  const newHook = {
    memoizedState: currentHook.memoizedState,
    queue: currentHook.queue,
    next: null,
  };
  // 构建链表
  if (workInProgressHook === null) {
    workInProgressHook = currentlyRenderingFiber.memoizedState = newHook;
  } else {
    workInProgressHook = workInProgressHook.next = newHook;
  }
  return workInProgressHook;
}
