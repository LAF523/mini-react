// Lane优先级映射表,优先级越高,数值越低

import { allowConcurrentByDefault } from "shared/ReactFeatureFlags";

/** 总车道数量 */
export const TotalLanes = 31;
/** 无车道 */
export const NoLanes = 0b0000000000000000000000000000000;
/** 无车道 */
export const NoLane = 0b0000000000000000000000000000000;
/** 同步车道 */
export const SyncLane = 0b0000000000000000000000000000001;
/** 输入连续水合车道 */
export const InputContinuousHydrationLane = 0b0000000000000000000000000000010;
/** 输入连续车道 */
export const InputContinuousLane = 0b0000000000000000000000000000100;
/** 默认水合车道 */
export const DefaultHydrationLane = 0b0000000000000000000000000001000;
/** 默认车道 */
export const DefaultLane = 0b0000000000000000000000000010000;
/** 选择性水合车道 */
export const SelectiveHydrationLane = 0b0001000000000000000000000000000;
/** 空闲水合车道 */
export const IdleHydrationLane = 0b0010000000000000000000000000000;
/** 空闲车道 */
export const IdleLane = 0b0100000000000000000000000000000;
/** 屏幕外车道 */
export const OffscreenLane = 0b1000000000000000000000000000000;
/** 非空闲车道 */
const NonIdleLanes = 0b0001111111111111111111111111111;

/**
 * @message: 标记根节点更新
 */
export function markRootUpdated(root, updateLan) {
  root.pendingLanes |= updateLan;
}

/**
 * @message: 获取下一个车道
 */
export function getNextLanes(root) {
  const pendingLanes = root.pendingLanes;
  if (pendingLanes === NoLanes) {
    return NoLanes;
  }
  const nextLanes = getHighestPriorityLanes(pendingLanes);
  return nextLanes;
}

/**
 * @message: 获取最高优先级车道
 *
 *  */
export function getHighestPriorityLanes(lanes) {
  return getHighestPriorityLane();
}

/**
 * @message: 获取最高优先级车道
 * 通过按位与上负值,可以获取到二进制中最左边一位的数值
 */
export function getHighestPriorityLane(lanes) {
  return lanes & -lanes;
}

/**
 * @message:是否包括非空闲优先级的工作
 */
export function includesNonIdleWork(lanes) {
  return (lanes & NonIdleLanes) !== NoLanes;
}

/**
 * @message: 是否包含阻塞车道
 */
export function includesBlockingLane(root, lanes) {
  if (allowConcurrentByDefault) {
    return false;
  }
  const SyncDefaultLanes = InputContinuousLane | DefaultLane;
  return (lanes & SyncDefaultLanes) !== NoLane;
}

/**
 * @message: 是否为车道的子级
 */
export function isSubsetOfLanes(set, subset) {
  return (set & subset) === subset;
}

/**
 * @message: 合并车道
 */
export function mergeLanes(a, b) {
  return a | b;
}
