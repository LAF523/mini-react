import { registerTwoPhaseEvent } from "./EventRegistry.js";

const simpleEventPluginEvents = ["click"];
export const topLevelEventsToReactNames = new Map(); // 存放原生事件名与react事件名的映射
export function registerSimpleEvents() {
  // 生成原生事件名和对应的react事件名
  for (let val of simpleEventPluginEvents) {
    const domEventName = val.toLowerCase();
    const reactEventName =
      "on" + val[0].toUpperCase() + val.slice(1).toLowerCase();
    topLevelEventsToReactNames.set(domEventName, reactEventName);
    registerTwoPhaseEvent(reactEventName, [domEventName]); // 注册为两个阶段的事件,冒泡阶段和捕获阶段
  }
}
