import { createRoot } from "react-dom/client";
let element = (
  <div onClick={() => console.log("wrap")}>
    <div
      onClick={(e) => {
        console.log("ppppp");
        e.stopPropagation();
      }}
    >
      createRoot
    </div>
    <div>createRoot的实现原理</div>
    <div>
      <h1>reateRoot的实现原理2</h1>
    </div>
  </div>
);
const root = createRoot(document.getElementById("root"));
root.render(element);
