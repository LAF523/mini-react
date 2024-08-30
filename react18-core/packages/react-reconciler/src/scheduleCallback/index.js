/**
 * 暂时使用原生函数,在浏览器空闲时间执行更新
 */
export function scheduleCallback(task) {
  requestIdleCallback(task);
}
