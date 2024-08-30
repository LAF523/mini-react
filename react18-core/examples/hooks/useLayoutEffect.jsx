import { useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";

function MyFunctionComponent() {
  const [a, seta] = useState(0);
  useLayoutEffect(() => {
    console.log("执行了useLayoutEffect");
    return () => {
      console.log("执行了destroy");
    };
  }, [a]);
  return <button onClick={() => seta(a + 1)}>{a}</button>;
}
const root = createRoot(document.getElementById("root"));
root.render(<MyFunctionComponent />);
