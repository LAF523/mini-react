import { createFiberRoot } from "./ReactFiberRoot";
import { createUpdate, enqueueUpdate } from "./ReactFiberClassUpdateQueue";
import { scheduleUpdateOnFiber, requestUpdateLane } from "./ReactFiberWorkLoop";

export function createContainer(container) {
  const root = createFiberRoot(container);
  return root;
}

export function updateContainer(vnode, FiberRoot) {
  const current = FiberRoot.current; // 获取FiberRoot当前的RootFiber
  const lane = requestUpdateLane(current); // 获取优先级
  const update = createUpdate(lane); // 创建更新对象
  update.payload = { element: vnode }; // 存放需要更新的vDOM,后续根据vDOM创建fiber节点建立fiber树
  const root = enqueueUpdate(current, update, lane); // 将更新添加到RootFiber节点的队列中,并返回FiberRoot

  // 调度fiber树的更新
  scheduleUpdateOnFiber(root, current, lane);
}
