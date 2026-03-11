# 路由懒加载

就是按需加载组件，不要一次性加载全部的路由，造成性能问题。

## 为什么需要懒加载

- **减小首屏体积**：未访问的路由不打包进主 bundle
- **加快首屏**：主包更小，解析和执行更快
- **按需加载**：进入某路由时才加载对应 chunk

---

## 基本用法

在路由配置中为 `lazy` 传入一个返回动态 `import()` 的异步函数：

```jsx
import { createBrowserRouter, RouterProvider } from "react-router";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      {
        path: "index",
        Component: Index,
        lazy: async () => {
          await sleep(2000);
          const { default: Component } = await import("../pages/Index");
          return { Component };
        },
      },
    ],
  },
]);
```

---

## 性能优化

使用懒加载打包后，会把懒加载的组件打包成一个独立的文件，从而减小主包的大小。
