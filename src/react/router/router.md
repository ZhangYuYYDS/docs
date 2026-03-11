# 路由种类

React Router 支持多种路由类型，组合使用可构建复杂的页面结构。本文以 Data Router 写法为例。

---

## 嵌套路由（Nested Routes）

嵌套路由通过 `children` 建立父子关系，子路由在父组件的 `<Outlet />` 位置渲染。

```
/dashboard          → 父路由
/dashboard/analytics → 子路由
/dashboard/settings → 子路由
```

```jsx
const router = createBrowserRouter([
  {
    path: "/dashboard",
    Component: DashboardLayout,
    children: [
      { path: "analytics", Component: Analytics },
      { path: "settings", Component: Settings },
    ],
  },
]);

function DashboardLayout() {
  return (
    <div>
      <nav>
        <Link to="/dashboard/analytics">分析</Link>
        <Link to="/dashboard/settings">设置</Link>
      </nav>
      <Outlet />
    </div>
  );
}
```

父组件**必须**包含 `<Outlet />`，否则子路由内容不会渲染。

---

## 布局路由（Layout Routes）

布局路由是「只提供外壳、不单独对应页面」的父路由，通常 `path` 与子路由共享，或作为根布局。

常见用法：根布局包裹整个应用，侧边栏、顶栏等持久 UI 不变，内容区由子路由切换。

```jsx
const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      { path: "about", Component: About },
      {
        path: "dashboard",
        Component: DashboardLayout,
        children: [
          { index: true, Component: DashboardHome },
          { path: "profile", Component: Profile },
        ],
      },
    ],
  },
]);

function RootLayout() {
  return (
    <div>
      <header>站点顶栏</header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

布局路由与嵌套路由本质相同，区别在于语义：布局路由强调「共享 UI 外壳」，嵌套路由强调「URL 层级」。

---

## 前缀路由（Pathless Layout Routes）

1. 只有Component,没有path

前缀路由提供共享布局，但**不向 URL 添加路径段**。父路由不写 `path`，子路由的路径直接挂在父路由的父级下。

典型场景：登录、注册等认证页共用一套布局（如简洁顶栏），但 URL 保持 `/login`、`/register`，而不是 `/auth/login`。

```jsx
const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      {
        // 无 path，不添加 URL 段
        Component: AuthLayout,
        children: [
          { path: "login", Component: Login },
          { path: "register", Component: Register },
        ],
      },
      {
        path: "dashboard",
        Component: DashboardLayout,
        children: [{ index: true, Component: DashboardHome }],
      },
    ],
  },
]);
```

| URL          | 渲染组件                        | 说明                           |
| ------------ | ------------------------------- | ------------------------------ |
| `/`          | Home                            | 根索引                         |
| `/login`     | AuthLayout → Login              | 无路径布局包裹，URL 无 `/auth` |
| `/register`  | AuthLayout → Register           | 同上                           |
| `/dashboard` | DashboardLayout → DashboardHome | 有 path，URL 含 `/dashboard`   |

与普通布局路由的区别：普通布局路由的 `path: "dashboard"` 会让子路由变成 `/dashboard/xxx`；无路径布局不设 `path`，子路由直接是 `/login`、`/register`。

---

2. 只有path,没有component

只设置 `path` 而不设置 `Component`，用于给一组路由添加统一的路径前缀。

典型场景：需要 `/projects`、`/projects/123`、`/projects/123/edit` 这类 URL，但不需要 ProjectsLayout 包裹，子页面直接挂在根布局下。

```jsx
const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      {
        // 只有 path，无 Component
        path: "projects",
        children: [
          { index: true, Component: ProjectsHome },
          { path: ":pid", Component: Project },
          { path: ":pid/edit", Component: EditProject },
        ],
      },
    ],
  },
]);
```

| URL                  | 渲染组件     | 说明                                  |
| -------------------- | ------------ | ------------------------------------- |
| `/`                  | Home         | 根索引                                |
| `/projects`          | ProjectsHome | 子路由直接渲染在 RootLayout 的 Outlet |
| `/projects/123`      | Project      | 同上，无中间布局层                    |
| `/projects/123/edit` | EditProject  | 同上                                  |

与布局路由的区别：布局路由有 `Component`，会多一层 UI；仅路径路由无 `Component`，只贡献 URL 段，子路由「穿透」到祖父级的 Outlet。

---

## 索引路由（Index Routes）

索引路由用 `index: true` 表示，当用户访问**父路径本身**时渲染，不增加额外 URL 段。

| 路径                 | 渲染的组件                |
| -------------------- | ------------------------- |
| `/`                  | Home（索引路由）          |
| `/dashboard`         | DashboardHome（索引路由） |
| `/dashboard/profile` | Profile                   |

```jsx
const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      {
        path: "dashboard",
        Component: DashboardLayout,
        children: [
          { index: true, Component: DashboardHome },
          { path: "profile", Component: Profile },
        ],
      },
    ],
  },
]);
```

不写索引路由时，访问 `/` 或 `/dashboard` 可能只看到布局、内容区空白；索引路由解决这个问题。

---

## 动态路由（Dynamic Routes）

用 `:param` 声明路径参数，在组件内通过 `useParams()` 获取。

```
/users/123       → params.id = "123"
/posts/abc-xyz   → params.slug = "abc-xyz"
```

```jsx
const router = createBrowserRouter([
  {
    path: "/users/:id",
    Component: UserDetail,
    loader: async ({ params }) => {
      const res = await fetch(`/api/users/${params.id}`);
      return res.json();
    },
  },
  {
    path: "/posts/:category/:slug",
    Component: PostDetail,
  },
]);

function UserDetail() {
  const { id } = useParams();
  const user = useLoaderData();
  return <h1>{user.name}</h1>;
}

function PostDetail() {
  const { category, slug } = useParams();
  return (
    <div>
      分类: {category}, 文章: {slug}
    </div>
  );
}
```

---

## 通配路由（Splat Routes）

用 `*` 匹配任意剩余路径，常用于 404 兜底。

```jsx
const router = createBrowserRouter([
  { path: "/", Component: Home },
  { path: "/about", Component: About },
  { path: "*", Component: NotFound },
]);

function NotFound() {
  return <h1>页面不存在</h1>;
}
```

通配路由应放在**最后**，否则会抢掉其他路由的匹配。

---

## 多级嵌套示例

```jsx
const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      {
        path: "projects",
        Component: ProjectLayout,
        children: [
          { index: true, Component: ProjectList },
          {
            path: ":projectId",
            Component: ProjectDetail,
            children: [
              { index: true, Component: ProjectOverview },
              { path: "tasks/:taskId", Component: TaskDetail },
            ],
          },
        ],
      },
      { path: "*", Component: NotFound },
    ],
  },
]);
```

对应 URL 示例：

| URL                     | 渲染组件        |
| ----------------------- | --------------- |
| `/`                     | Home            |
| `/projects`             | ProjectList     |
| `/projects/abc`         | ProjectOverview |
| `/projects/abc/tasks/1` | TaskDetail      |

---

## 总结

| 类型     | 配置                           | 含义                                         |
| -------- | ------------------------------ | -------------------------------------------- |
| 嵌套路由 | `children`                     | 子路由在父组件的 `<Outlet />` 位置渲染       |
| 布局路由 | 带 `children` 的父路由         | 提供共享 UI 外壳                             |
| 前缀路由 | 父路由无 `path`                | 提供布局但不向 URL 添加路径段（如 `/login`） |
|          | 父路由有 `path` 无 `Component` | 只贡献 URL 段，但不提供布局                  |
| 索引路由 | `index: true`                  | 访问父路径时渲染的默认子路由                 |
| 动态路由 | `path: ":id"`                  | 路径参数，用 `useParams()` 获取              |
| 通配路由 | `path: "*"`                    | 匹配任意路径，用于 404                       |
