export const allNativeEvents = new Set(); // 存储所有的原生事件名称

export function registerTwoPhaseEvent(reactName, dependencies) {
  registerDirectEvent(reactName, dependencies); // 注册冒泡阶段的事件
  registerDirectEvent(reactName + "Capture", dependencies); // 注册捕获阶段的事件
}

function registerDirectEvent(reactName, dependencies) {
  dependencies.forEach((name) => {
    allNativeEvents.add(name);
  });
}
