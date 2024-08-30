import { createHostRootFiber } from "./ReactFiber";
import { initialUpdateQueue } from "./ReactFiberClassUpdateQueue";
import { NoLanes } from "./ReactFiberLane";
/**
 * FiberRoot
 */
class FiberRootNode {
  constructor(container) {
    this.containerInfo = container;
    this.pendingLanes = NoLanes; // 初始化优先级的值
  }
}
export function createFiberRoot(container) {
  // 创建FiberRoot
  const fiberRoot = new FiberRootNode(container);
  //创建RootFiber
  const uninitializedFiber = createHostRootFiber();
  //产生关联
  fiberRoot.current = uninitializedFiber;
  uninitializedFiber.stateNode = fiberRoot;

  // 初始化,空对象赋值给fiber节点的updateQueue
  initialUpdateQueue(uninitializedFiber);

  return fiberRoot;
}
