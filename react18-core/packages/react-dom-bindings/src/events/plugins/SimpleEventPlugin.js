import { registerSimpleEvents } from "../DOMEventProperties";
import { SyntheticMouseEvent } from "../SyntheticEvent";
import { IS_CAPTURE_PHASE } from "../EventSystemFlags";
import { accumulateSinglePhaseListeners } from "../DOMPluginEventSystem";
import { topLevelEventsToReactNames } from "../DOMEventProperties";

// 收集特定事件,加入调度队列
function extractEvents(
  dispatchQueue,
  eventName,
  targetFiber,
  nativeEvent,
  nativeEventTarget,
  flags,
  container
) {
  let SyntheticEventCtor; // 合成事件对象构造函数
  switch (eventName) {
    case "click":
      SyntheticEventCtor = SyntheticMouseEvent;
      break;
    default:
      break;
  }

  // 确定事件触发阶段,是否为捕获阶段
  const isCapturePhase = (flags & IS_CAPTURE_PHASE) !== 0;
  const reactName = topLevelEventsToReactNames.get(eventName);
  const listeners = accumulateSinglePhaseListeners(
    // 获取本身及父节点中所有事件监听器
    targetFiber,
    reactName,
    nativeEvent.type,
    isCapturePhase
  );

  // 如果收集到了监听器
  if (listeners.length) {
    const event = new SyntheticEventCtor( // 创建合成事件对象
      reactName,
      eventName,
      null,
      nativeEvent,
      nativeEventTarget
    );
    dispatchQueue.push({ event, listeners });
  }
}

export { registerSimpleEvents as registerEvents, extractEvents };
