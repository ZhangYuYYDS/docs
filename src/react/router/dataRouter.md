# React Router 两种写法

React Router v6.4+ 提供两种路由模式：**数据路由（Data Router）** 和 **声明模式（Declarative）**。Data Router 是官方推荐的新写法，支持 loader、action、错误边界等能力；声明模式是传统写法，适合简单场景。

---

## Data Router（数据路由）

Data Router 使用 `createBrowserRouter` + `RouterProvider`，在**渲染前**就能加载数据、处理表单提交，并支持路由级错误边界。

### 基本结构

```jsx
// main.jsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  { path: "/", Component: Home },
  { path: "/about", Component: About },
]);

function App() {
  return <RouterProvider router={router} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
```

### 路由配置对象

每个路由可以配置：

| 属性           | 说明                              |
| -------------- | --------------------------------- |
| `path`         | 路径                              |
| `Component`    | 渲染的组件（传引用，v7 推荐）     |
| `element`      | 渲染的 JSX（与 Component 二选一） |
| `loader`       | 进入路由前加载数据                |
| `action`       | 处理表单提交等数据变更            |
| `errorElement` | 该路由及其子路由的错误边界        |
| `children`     | 嵌套子路由                        |

### loader：进入路由前加载数据

`loader` 在组件渲染前执行，返回的数据可通过 `useLoaderData()` 获取。

```jsx
import { createBrowserRouter, RouterProvider, useLoaderData } from "react-router-dom";

async function userLoader({ params }) {
  const res = await fetch(`/api/users/${params.id}`);
  if (!res.ok) throw new Response("Not Found", { status: 404 });
  return res.json();
}

function UserDetail() {
  const user = useLoaderData();
  return <h1>{user.name}</h1>;
}

const router = createBrowserRouter([
  {
    path: "/users/:id",
    Component: UserDetail,
    loader: userLoader,
  },
]);
```

### action：处理表单提交

`action` 处理 POST/PUT/DELETE 等数据变更，完成后会自动重新执行相关 loader，保持 UI 与数据同步。

```jsx
import { createBrowserRouter, RouterProvider, Form, useActionData } from "react-router-dom";

async function projectAction({ request, params }) {
  const formData = await request.formData();
  const title = formData.get("title");
  await api.updateProject(params.projectId, { title });
  return { success: true, title };
}

function Project() {
  const actionData = useActionData();
  return (
    <div>
      <Form method="post">
        <input type="text" name="title" />
        <button type="submit">保存</button>
      </Form>
      {actionData?.success && <p>已更新：{actionData.title}</p>}
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/projects/:projectId",
    Component: Project,
    action: projectAction,
  },
]);
```

### errorElement：路由级错误边界

`errorElement` 捕获该路由及子路由的 loader/action 错误和组件渲染错误。

```jsx
import { useRouteError } from "react-router-dom";

function ErrorFallback() {
  const error = useRouteError();
  return (
    <div>
      <h2>出错了</h2>
      <p>{error?.message || error?.statusText}</p>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    errorElement: <ErrorFallback />,
    children: [{ path: "users/:id", Component: UserDetail, loader: userLoader }],
  },
]);
```

### 嵌套路由与 Outlet

父路由用 `Outlet` 渲染子路由：

```jsx
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <div>
      <nav>
        <Link to="/">首页</Link>
        <Link to="/users">用户</Link>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "users", Component: UserList },
      { path: "users/:id", Component: UserDetail, loader: userLoader },
    ],
  },
]);
```

### useFetcher：不跳转页面的数据提交

`useFetcher` 可以在不触发导航的情况下调用 action，适合「就地提交、就地刷新」的场景（如点赞、切换状态）。

```jsx
import { useFetcher } from "react-router-dom";

function Task({ task }) {
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";

  return (
    <fetcher.Form method="post" action={`/tasks/${task.id}/toggle`}>
      <input type="hidden" name="done" value={!task.done} />
      <button type="submit" disabled={busy}>
        {busy ? "处理中..." : task.done ? "已完成" : "未完成"}
      </button>
    </fetcher.Form>
  );
}
```

### 完整示例

```jsx
// main.jsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    errorElement: <ErrorFallback />,
    children: [
      { index: true, Component: Home },
      {
        path: "users/:id",
        Component: UserDetail,
        loader: async ({ params }) => {
          const res = await fetch(`/api/users/${params.id}`);
          if (!res.ok) throw new Response("Not Found", { status: 404 });
          return res.json();
        },
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(<RouterProvider router={router} />);
```

---

## 声明模式（Declarative）

声明模式使用 `BrowserRouter` + `Routes` + `Route`，在组件树中声明式定义路由，写法简单，适合不需要 loader/action 的项目。

### 基本结构

```jsx
// main.jsx
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
```

```jsx
// App.jsx
import { Routes, Route, Link } from "react-router-dom";

function App() {
  return (
    <div>
      <nav>
        <Link to="/">首页</Link>
        <Link to="/about">关于</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </div>
  );
}
```

### 嵌套路由

```jsx
<Routes>
  <Route path="/" element={<Layout />}>
    <Route index element={<Home />} />
    <Route path="about" element={<About />} />
    <Route path="users/:id" element={<UserDetail />} />
  </Route>
</Routes>
```

父组件中通过 `<Outlet />` 渲染子路由。

### 与 Data Router 的对比

| 特性     | Data Router                              | 声明模式                          |
| -------- | ---------------------------------------- | --------------------------------- |
| 入口     | `createBrowserRouter` + `RouterProvider` | `BrowserRouter` 包裹              |
| 路由定义 | 配置对象数组                             | `<Routes>` + `<Route>`            |
| 数据加载 | `loader` 在渲染前执行                    | 需在组件内 `useEffect` 等自行处理 |
| 表单提交 | `action` 自动 revalidate                 | 需自行处理并更新状态              |
| 错误边界 | `errorElement` 按路由配置                | 需自行用 Error Boundary           |
| 适用场景 | 数据驱动、表单多、需要 SSR               | 简单 SPA、轻量路由                |

---

## 如何选择

- **需要 loader/action、错误边界、与后端强耦合**：用 Data Router。
- **只有简单页面跳转、无复杂数据流**：用声明模式即可。
