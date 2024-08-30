// 捕获
export function addEventCaptureListener(target, eventName, listener) {
  target.addEventListener(eventName, listener, true);
}
// 冒泡
export function addEventBubbleListener(target, eventName, listener) {
  target.addEventListener(eventName, listener, false);
}
