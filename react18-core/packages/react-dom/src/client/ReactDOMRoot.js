import {
  createContainer,
  updateContainer,
} from "react-reconciler/src/ReactFiberReconciler";
import { listenToAllSupportedEvents } from "../../../react-dom-bindings/src/events/DOMPluginEventSystem";
import { listenerAllEvents } from "../../../react-dom-bindings/src/events/eventBySelf";

export class ReactDOMRoot {
  constructor(root) {
    this._internalRoot = root; // FiberRoot
  }

  render(children) {
    const root = this._internalRoot;
    updateContainer(children, root); //整个渲染过程的入口
  }
}

export function createRoot(container) {
  const root = createContainer(container);
  listenToAllSupportedEvents(container);
  return new ReactDOMRoot(root);
}
