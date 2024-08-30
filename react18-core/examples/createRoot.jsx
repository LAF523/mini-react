import { createRoot } from "react-dom/client";
let element = (
  <div>
    <div>createRoot</div>
    <div>createRoot的实现原理</div>
    <div>
      <h1>reateRoot的实现原理2</h1>
    </div>
  </div>
);
const FunctionComponent = () => {
  return (
    <div>
      <div>createRoot</div>
      <div>createRoot的实现原理</div>
      <div>
        <h1>reateRoot的实现原理2</h1>
      </div>
    </div>
  );
};
const root = createRoot(document.getElementById("root"));
root.render(<FunctionComponent />);
console.log("createRoot.jsx", element);

import { registerEvents } from "../packages/react-dom-bindings/src/events/plugins/SimpleEventPlugin.js";
registerEvents();
