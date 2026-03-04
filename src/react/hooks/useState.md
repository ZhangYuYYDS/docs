# useState

## 为什么要有 `useState`？

因为react不像vue，有proxy拦截变量变化去驱动视图变化；如果不使用useState的时候，就算变量发生了变化，也仅仅是在内存中发生了变化，在UI上一点没变，因为react不知道该更新UI了；就算react只要变量变化的时候要更新UI，不使用useState也不行，因为react组件本质上就是一个函数，每次重新渲染的时候，要重新执行这个函数，变量会被重置成初始值，也不会体现变化的，所以这个时候需要将变量的状态存储起来的东西，能够将变量的状态存起来，等到下一次重新渲染的时候，在将上一次变量的状态拿出来使用。

如果在 React 组件里只使用普通变量，会有两个核心问题：

1. **变量变化不会触发 UI 更新**  
   普通变量就算在内存里变了，React 也不知道组件需要重新渲染。
2. **重新渲染后变量会被重置**  
   React 组件本质是函数，每次渲染都会重新执行函数，普通变量会回到初始值。

所以需要一个机制，把状态保存起来，并在状态变化时通知 React 重新渲染，这就是 `useState`。

`useState` 的三个核心作用：

- **持久化存储**：把状态存到 React 内部，不会因为函数重新执行而丢失。
- **返回最新值**：组件重新渲染时，`useState` 会返回当前最新状态。
- **触发重渲染**：调用 `setState` 后，React 会将组件标记为需要更新并安排重新渲染。

### 总结

`useState` 存在的原因是：  
React 组件是普通函数，普通变量既无法跨渲染保存值，也无法触发重新渲染。  
`useState` 同时解决了这两个问题。

## useState 用法
### 只能在组件的顶层或者自己的Hook中调用。

这是为什么？因为React在组件内部使用一个链表去存储所有的hook，hook的调用顺序作为索引，每次调用一个hook，指针就+1；所以应该在第一次渲染完成的时候就会初始化完成这个链表，比如如果if中有一个hook，假如在第一次渲染的时候if条件为false，没有初始化进链表中，在第二次渲染的时候if条件为true，链表的索引去取值的时候就会发生错位：
```markdown
function App() {
  const [count, setCount] = useState(0)      // 槽位 0
  
  if (count > 0) {
    const [name, setName] = useState("React") // ⚠️ 有时候是槽位 1，有时候不存在
  }
  
  useEffect(() => { ... })                    // ⚠️ 有时候是槽位 2，有时候是槽位 1
}

过程：
第一次渲染（count = 0）：
  cursor=0 → useState(0)      → 槽位 0 = count
  ⏭️ if 条件为 false，跳过
  cursor=1 → useEffect(...)   → 槽位 1 = effect
  
  hooks = [0, effect]
          索引0  索引1

第二次渲染（count = 1）：
  cursor=0 → useState(0)      → 槽位 0 = count  ✅ 正确
  ✅ if 条件为 true，进入
  cursor=1 → useState("React")→ 槽位 1 = ???    💥 这里拿到的是 effect！
  cursor=2 → useEffect(...)   → 槽位 2 = ???    💥 越界了！

顺序乱了！ React 用索引 1 去取值，以为是 name 的状态，但实际上槽位 1 存的是 useEffect 的数据。整个 Hook 链全部错位，程序崩溃。
```

### useState使用：
```jsx
const [state, setState] = useState(initialState)
```
1. `initialState`: 你希望 state 初始化的值。它可以是任何类型的值，但对于函数有特殊的行为。
2. `state`:在首次渲染时，它将与你传递的 initialState 相匹配。
3. `set`函数：让你将 state 更新为不同的值并触发重新渲染。

```jsx
import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>当前计数：{count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(0)}>重置</button>
    </div>
  )
}
```

无非就是数字、字符串、布尔值、**数组**、**对象**

- 针对**数组**和**对象**，要保持不能改变原数组和原对象的原则，所以可以先复制再改变 
- 为什么不能改变？
  - 数组和对象是引用类型，内存中存的是地址，地址指向数组，原地修改数组/对象的话，引用没变，可能无法按照预期更新。
:::warning
调用 `set` 函数**不会**改变已经执行的代码中当前的 state：
```jsx
function handleClick() {
  setName('Robin');
  console.log(name); // Still "Taylor"!
}
```
`set` 函数做的事情是，标记组件更新，**安排**重新渲染，所以name只有在下一次渲染是时候才是Robin
:::

:::warning
连续调用 `set` 函数：
1. **传值**
```jsx
function handleClick() {
    setCount(count + 1)
    console.log("first", count) // 0 
    setCount(count + 1)
    console.log("second", count) // 0
    setCount(count + 1)
    console.log("third", count) // 0
    // 最终页面上展示的count值是1
}
```
对于**连续传值**的情况，React会将这种行为标记为重复的操作，React会选择覆盖，直接取最后一次的结果。

1. **传函数**
```jsx
function handleClick() {
    setCount((prev) => prev + 1)
    console.log("first", count) // 0 
    setCount((prev) => prev + 1)
    console.log("second", count) // 0
    setCount((prev) => prev + 1)
    console.log("third", count) // 0
    // 最终页面上展示的count值是3
}
```
对于连续传函数的情况，React会在内部形成一个队列，在下一次渲染期间进行链式调用
:::


