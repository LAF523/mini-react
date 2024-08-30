// 事件优先级映射表,
import {
  NoLane,
  SyncLane,
  InputContinuousLane,
  DefaultLane,
  IdleLane,
  getHighestPriorityLane,
  includesNonIdleWork,
} from "./ReactFiberLane";

/** 离散事件优先级，与SyncLane相关联,指一瞬间一瞬间的事件,如点击事件 */
export const DiscreteEventPriority = SyncLane;
/** 连续事件优先级，与InputContinuousLane相关联,指连续发生的事件,如鼠标拖拽事件 */
export const ContinuousEventPriority = InputContinuousLane;
/** 默认事件优先级，与DefaultLane相关联 */
export const DefaultEventPriority = DefaultLane;
/** 空闲事件优先级，与IdleLane相关联 */
export const IdleEventPriority = IdleLane;

/** 当前更新优先级值 */
let currentUpdatePriority = NoLane;

/**
 * @message: 获取当前更新优先级
 */
export function getCurrentUpdatePriority() {
  return currentUpdatePriority;
}

/**
 * @message:设置当前更新优先级
 */
export function setCurrentUpdatePriority() {
  currentUpdatePriority = newPriority;
}

/**
 * @message: 比较事件优先级和车道
 * @param {*} eventPriority 事件优先级
 * @param {*} lane 车道
 * 事件优先级高则返回true
 */
export function isHigherEventPriority(eventPriority, lane) {
  return eventPriority !== 0 && eventPriority < lane;
}

/**
 * @message: lane优先级转换为事件优先级
 */
export function lanesToEventPriority(lanes) {
  let lane = getHighestPriorityLane(lanes);
  // 如果车道优先级大于离散事件优先级,则返回离散事件优先级
  if (isHigherEventPriority(lane, DiscreteEventPriority)) {
    return DiscreteEventPriority;
  }

  // 如果车道优先级大于连续事件优先级,则返回连续事件优先级
  if (isHigherEventPriority(lane, ContinuousEventPriority)) {
    return ContinuousEventPriority;
  }

  // 如果车道中包含空闲车道优先级,则返回默认事件优先级
  if (includesNonIdleWork(lane)) {
    return DefaultEventPriority;
  }
  // 都不是,返回空闲事件优先级
  return IdleEventPriority;
}
