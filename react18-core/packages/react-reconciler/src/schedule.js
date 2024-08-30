import * as Scheduler from "../../scheduler/src/forks/Scheduler";
export const scheduleCallback = Scheduler.unstable_scheduleCallback;
export const shouldYield = Scheduler.unstable_shouldYield;
export const ImmediatePriority = Scheduler.unstable_ImmediatePriority;
export const UserBlockingPriority = Scheduler.unstable_UserBlockingPriority;
export const NormalPriority = Scheduler.unstable_NormalPriority;
export const IdlePriority = Scheduler.unstable_IdlePriority;

// 带有unstable前缀,表示不稳定的功能, 这里导入又导出是将不稳定的功能做一个隔离
