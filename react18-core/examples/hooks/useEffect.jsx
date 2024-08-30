import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

function MyFunctionComponent() {
  const [a, seta] = useState(0);
  useEffect(() => {
    console.log("执行了useEffect");
    return () => {
      console.log("执行了destroy");
    };
  }, [a]);
  return <button onClick={() => seta(a + 1)}>{a}</button>;
}
const root = createRoot(document.getElementById("root"));
root.render(<MyFunctionComponent />);
