import {
  HostRoot,
  IndeterminateComponent,
  HostComponent,
  HostText,
} from "./ReactWorkTag";
import { NoFlags } from "./ReactFiberFlags";
import { isString } from "../../shared/index";
import { NoLanes } from "./ReactFiberLane";
/**
 * 创建RootFiber
 */
export function createHostRootFiber() {
  return createFiber(HostRoot, null, null);
}
/**
 * 创建fiber节点
 */
export function createFiber(tag, pendingProps, key) {
  return new FiberNode(tag, pendingProps, key);
}

class FiberNode {
  constructor(tag, pendingProps, key) {
    this.tag = tag; // fiber节点类型:函数式组件,类组件,原生元素,根标签等
    this.key = key; // 同vnode.key
    this.type = null; // 同vnode.type

    this.stateNode = null; // 对fiber节点对应真实DOM,或类组件实例
    this.return = null; // 父fiber
    this.sibling = null; // 第一子fiber
    this.child = null; // 下一个兄弟fiber
    this.pendingProps = pendingProps; // 等待更新的props
    this.memoizedProps = null; // 正在使用的props
    this.memoizedState = null; // 正在使用state
    this.updateQueue = null; // 更新队列,存放将要更新的东西,比如props
    this.flags = NoFlags; // 更新节点时使用,标记该节点需要的操作:删除,更新,新增
    this.subtreeFlags = NoFlags; // 更新时使用,标记子节点需要的操作,如果子节点不需要更新,则可以直接跳过,相当于性能优化手段
    this.alternate = null; //双缓存策略实现的关键,指向另一株fiber树的rootFiber
    this.index = 0; // 该fiber节点所在层级中的位置索引
    this.deletions = null; // 存放需要删除的子节点
    this.lanes = NoLanes; // 节点中更新任务的优先级集合
  }
}

/**
 * 根据当前渲染树的fiber节点创建另一个fiber节点
 */
export function createWorkInProgress(currentRootFiber, pendingProps) {
  let workInProgress = currentRootFiber.alternate;
  if (workInProgress === null) {
    // 不存在,说明是初始化渲染,需要创建工作进程树
    workInProgress = createFiber(
      currentRootFiber.tag,
      pendingProps,
      currentRootFiber.key
    );
    workInProgress.stateNode = currentRootFiber.stateNode;
    workInProgress.alternate = currentRootFiber;
    currentRootFiber.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps;
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
  }
  workInProgress.type = currentRootFiber.type;
  workInProgress.memoizedProps = currentRootFiber.memoizedProps;
  workInProgress.memoizedState = currentRootFiber.memoizedState;
  workInProgress.updateQueue = currentRootFiber.updateQueue;
  workInProgress.sibling = currentRootFiber.sibling;
  workInProgress.child = currentRootFiber.child;
  workInProgress.index = currentRootFiber.index;

  return workInProgress;
}

/**
 * element类型虚拟DOM构建fiber,如{$$typeof,type,props,key}
 */
export function createFiberFromElement(element) {
  const { type, props: pendingProps, key } = element;
  let tag = IndeterminateComponent;
  if (isString(type)) {
    tag = HostComponent;
  }
  const newFiber = createFiber(tag, pendingProps, key);
  newFiber.type = type;
  return newFiber;
}

/**
 * 文本节点:"你好"
 */
export function createFiberFromText(element) {
  return createFiber(HostText, element, null);
}
