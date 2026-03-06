# useEffect

## 1. useEffect 是干什么的

`useEffect` 用来处理**副作用**。

这里的“副作用”可以简单理解成：

- 不是“根据 state 计算 JSX”的渲染逻辑，不该用来决定页面长什么样
- 而是“渲染完成之后，还要额外做的事情”

比如：

- 打印日志
- 发请求
- 订阅事件
- 开启定时器
- 操作 DOM
- 同步本地存储

例如像上面说的订阅事件，是监听window对象的事件，JSX的事件监听并不能做到监听全局的window对象，只能监听React渲染出来的DOM元素的事件，所以就可以用useEffect去连接外部对象。

React 希望组件尽量保持“渲染归渲染，副作用归副作用”，所以提供了 `useEffect`。

---

## 2. 基本语法

```tsx
useEffect(setup, dependencies?)
```

可以展开理解成：

```tsx
useEffect(() => {
  // setup：执行副作用逻辑

  return () => {
    // cleanup：清理副作用逻辑（可选）
  }
}, [dependencies])
```

这里有两个重点：

- 第一个参数：副作用函数，也叫 `setup`
  - 选择性返回一个cleanup函数
  - 组件挂载时会执行setup函数
  - state状态变更时，会先执行cleanup函数，然后再执行setup函数
  - 组件卸载时会最后执行一次cleanup函数
- 第二个参数：依赖数组，决定什么时候重新执行
  - []: 只在初次挂载的时候执行一次setup函数
  - [a, b]: a, b改变的时候执行setup函数
  - 不传：每次渲染都会执行一次

---

### 1. setup参数

```tsx
() => {
  console.log('执行了', count, name)

  return () => {
    console.log('卸载了', count, name)
  }
}
```

它的含义是：

- React 在渲染完成后执行它
- 让你有机会做“渲染之外”的事情

这个函数里又可以 `return` 一个函数，这个被返回的函数就叫 **cleanup（清理函数）**。

---

**setup函数选择性返回cleanup函数**

`useEffect` 里 `return` 出去的函数：

作用是：

- 清理上一次 effect 留下的副作用
- 避免内存泄漏
- 避免重复订阅
- 避免旧定时器、旧事件处理器继续工作

最常见场景：

```tsx
useEffect(() => {
  const timer = setInterval(() => {
    console.log('tick')
  }, 1000)

  return () => {
    clearInterval(timer)
  }
}, [])
```

这里：
- `setup`：创建定时器
- `cleanup`：清除定时器

---

**执行顺序，“先 cleanup，再 setup”**

```tsx
useEffect(() => {
  console.log('setup', count)

  return () => {
    console.log('cleanup', count)
  }
}, [count])
```

当 `count` 变化时，不是直接运行新的 `setup`，而是按这个顺序：

count变两次时，控制台顺序大概是：

```txt
setup 0
cleanup 0
setup 1
cleanup 1
setup 2
```

如果组件最后卸载，还会再执行一次：

```txt
cleanup 2
```

---

### 4. 依赖数组到底是什么

依赖数组就是第二个参数：

```tsx
useEffect(() => {
  // ...
}, [count, name])
```

它表示：

> 这个 effect 用到了哪些“响应式值”，当这些值变化时，需要重新执行 effect。

“响应式值”通常包括：

- `props`
- `state`
- 组件函数体里定义的变量
- 某些函数引用

---

### 5. 三种依赖写法

#### 5.1 不传依赖数组

```tsx
useEffect(() => {
  console.log('effect')
})
```

含义：

- 每次渲染后都执行

---

#### 5.2 传空数组 `[]`

```tsx
useEffect(() => {
  console.log('只执行一次')
}, [])
```

含义：

- 挂载后执行一次
- 卸载时执行 cleanup（如果有）

适合：

- 初始化逻辑
- 只订阅一次
- 只创建一次定时器

但要注意：这里读取到的是**首次渲染时的值**。

---

#### 5.3 传具体依赖 `[count]`

```tsx
useEffect(() => {
  console.log('count 变了')
}, [count])
```

含义：

- 首次渲染后执行一次
- 以后只有 `count` 变化时才重新执行

---

### 6. 结合你当前代码理解

你现在是：

```tsx
useEffect(() => {
  console.log('执行了', count, name)

  return () => {
    console.log('卸载了', count, name)
  }
}, [count])
```

这段代码的实际含义是：

- 首次渲染后执行一次
- 以后每次 `count` 变化，都会：
  - 先执行上一次 cleanup
  - 再执行这一次 setup
- 组件卸载时，再执行最后一次 cleanup

### 那 `name` 为什么也能打印出来？

因为 effect 函数里使用了 `name`。

但依赖数组只有 `[count]`，所以：

- `count` 变化时 effect 会重新执行
- `name` 单独变化时 effect 不会重新执行

这就意味着：

**日志里打印的 `name`，是 effect 上一次运行时闭包捕获到的值。**

这也是为什么 React 通常建议：

> effect 里用到了哪些响应式值，就把它们放进依赖数组。

---

### 7. 为什么你会看到“执行了 -> 卸载了 -> 执行了”

这通常不是你代码错了，而是因为 React 开发环境开启了 `StrictMode`。

在开发模式里，React 会故意多做一次：

1. 执行 setup
2. 执行 cleanup
3. 再执行一次 setup

目的是帮助你检查：

- effect 是否幂等
- cleanup 是否写对
- 有没有副作用泄漏

所以你看到类似：

```txt
执行了 0
卸载了 0
执行了 0
```

这是开发模式的正常行为。

生产环境不会这样重复检查。

---

### 8. cleanup 最常见的几个应用场景

#### 8.1 事件监听

```tsx
useEffect(() => {
  const handler = () => console.log('resize')
  window.addEventListener('resize', handler)

  return () => {
    window.removeEventListener('resize', handler)
  }
}, [])
```

#### 8.2 定时器

```tsx
useEffect(() => {
  const timer = setInterval(() => {
    console.log('tick')
  }, 1000)

  return () => clearInterval(timer)
}, [])
```

#### 8.3 订阅 / 取消订阅

```tsx
useEffect(() => {
  const unsubscribe = store.subscribe(() => {
    console.log('数据变了')
  })

  return () => unsubscribe()
}, [])
```

---

### 9. useEffect 不是拿来干嘛都用的

不应该把所有逻辑都塞进 `useEffect`，最好是用来处理渲染之外的操作。

### 不需要用 useEffect 的情况

- 纯计算逻辑
- 根据 props/state 直接能算出来的值
- 点击按钮后立即处理的逻辑

例如：

```tsx
const fullName = firstName + lastName
```

这就不用写成：

```tsx
useEffect(() => {
  setFullName(firstName + lastName)
}, [firstName, lastName])
```

---

### 10. useEffect 的常见误区

#### 10.1 漏依赖

```tsx
useEffect(() => {
  console.log(count, name)
}, [count])
```

这里用了 `name` 却没写进依赖，可能导致逻辑拿到旧值。

---

#### 10.2 effect 里更新 effect 自己依赖的值

```tsx
useEffect(() => {
  setCount(count + 1)
}, [count])
```

这很容易造成无限循环。

---

#### 10.3 把可以直接计算的值放进 effect

很多值根本不需要 effect，同步计算即可。

---

#### 10.4 忘记 cleanup

- `setInterval`
- `addEventListener`
- 订阅外部数据源

如果不 cleanup，就容易泄漏。

---

### 11. 用“租房”类比理解 useEffect

这是最适合初学者的类比。

- `setup`：搬进房间，布置环境
- `cleanup`：搬走前打扫房间
- 依赖变化：相当于你要换房
  - 先把旧房收拾干净
  - 再去新房布置

所以：

- 挂载：第一次入住
- 更新：先搬走旧环境，再建立新环境
- 卸载：最后一次搬走并清理

---