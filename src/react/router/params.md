# 路由传参方式

React Router 支持多种传参方式，按数据是否体现在 URL 上可分为：**URL 参数**（可分享、可刷新）和**非 URL 参数**（临时传递）。

---

## 概览

| 方式           | 体现位置            | 适用场景             | 刷新/分享         |
| -------------- | ------------------- | -------------------- | ----------------- |
| 动态路径参数   | `/users/:id`        | 资源 ID、必传标识    | ✅                |
| 查询参数       | `?page=1&sort=desc` | 筛选、分页、可选状态 | ✅                |
| Location State | `history.state`     | 临时传递、详情回传   | ❌                |
| Loader 数据    | 路由层数据流        | 进入页面前加载数据   | ✅（loader 重跑） |

---

## 一、Params

参数嵌入在 URL 路径中，如 `/users/123`。

### 传递

```jsx
import { Link, useNavigate } from "react-router-dom";

1. Link
<Link to="/users/123">用户 123</Link>;

2. useNavigate
const navigate = useNavigate();
navigate("/users/123");
```

### 获取

1. useParams获取

```jsx
import { useParams } from "react-router";

function UserDetail() {
  const { id } = useParams();
  return <h1>{id}</h1>;
}
```

2. 在 Loader 中获取

```jsx
{
  path: "/users/:id",
  Component: UserDetail,
  loader: async ({ params }) => {
    const user = await fetchUser(params.id);
    return user;
  },
}
```

**特点**：可刷新、可分享。

---

## 二、Query

参数在 URL 的 `?` 后面，如 `?page=2&sort=date`。

### 获取

```jsx
import { useSearchParams } from "react-router";

function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = searchParams.get("page") || "1";
  const sort = searchParams.get("sort") || "default";

  return (
    <div>
      <p>当前页: {page}</p>
      <p>排序方式：{sort}</p>
    </div>
  );
}
```

### 传递（Link / navigate）

```jsx
1. Link
<Link to="/products?page=2&sort=price">商品列表</Link>;

2. navigate
const navigate = useNavigate();
navigate("/products?page=2&sort=price");
```

**特点**：可分享、可刷新。

---

## 三、State

通过 `navigate` 的 `state` 传递数据，不体现在 URL 上，存储在 `history.state` 中。

### 传递

```jsx
import { useNavigate } from "react-router";

function UserList() {
  const navigate = useNavigate();

  // navigate传递参数
  const handleClick = user => {
    navigate("/users/123", {
      state: { from: "list", prevData: user },
    });
  };

2. Link传递参数
  <Link to="/users/123" state={{ from: "list", prevData: user }}>
    Link传递state
  </Link>;
}
```

### 获取

```jsx
import { useLocation } from "react-router";

const location = useLocation();
const state = location.state; // { from: "list", prevData: user }
```

**注意**：刷新会丢失

---

## 四、Loader 传参（Data Router）

在 Data Router 中，`loader` 在渲染前执行，返回数据供 `useLoaderData()` 使用。参数来源可以是 `params`、`request` 等。

### 结合 params

```jsx
{
  path: "/users/:id",
  loader: async ({ params }) => {
    const res = await fetch(`/api/users/${params.id}`);
    return res.json();
  },
  Component: UserDetail,
}

function UserDetail() {
  const user = useLoaderData();
  return <h1>{user.name}</h1>;
}
```

### 结合 searchParams

```jsx
{
  path: "/products",
  loader: async ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get("page") || "1";
    const sort = url.searchParams.get("sort") || "date";
    const products = await fetchProducts({ page, sort });
    return products;
  },
  Component: ProductList,

  function ProductList(){
    const products = useLoaderData()
     return <h1>{products.name}</h1>;
  }
}
```

**特点**：数据在路由层加载，组件只负责展示

---

## 六、如何选择

| 场景                              | 推荐方式               |
| --------------------------------- | ---------------------- |
| 资源 ID、slug、必传标识           | 动态路径参数 `:id`     |
| 分页、筛选、排序、tab             | 查询参数 `?page=1`     |
| 从列表点到详情，顺带传来源/上下文 | Location State         |
| 进入页面前加载数据                | Loader + params/search |

**原则**：需要分享、刷新保留、可收藏的，用 URL（params 或 search）；临时传递、页面内部上下文，用 state 或 loader。
