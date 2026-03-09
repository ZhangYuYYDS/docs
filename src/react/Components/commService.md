# 组件间通讯

## 1. Props & Callback

**核心思想**：

- 父组件通过props传给子组件。
- 子组件通过回调函数传给父组件
  - 可以传普通数据，字符串、对象之类的
  - 也可以将函数传过去，父组件中可以直接调用这个函数

```tsx
// Props&Callback
const ParentToChildChild = ({ name, onSend }: { name: string, onSend: (value: string | ChildAction) => void }) => {
   return (
      <>
         <p>子组件中 name: {name}</p>
         {/* 回调函数中传普通数据 */}
         <button onClick={() => onSend('李四')}>发送字符串给父组件</button>

         {/* 回调函数中传函数 */}
         <button onClick={() => onSend(() => {
            console.log('回调函数中传函数')
         })}>
            发送函数给父组件
         </button>
      </>
   )
}
const ParentToChildDemo = () => {
   const [name, setName] = useState('张三')
   const [childAction, setChildAction] = useState<ChildAction | null>(null)

   const handleSend = (value: string | ChildAction) => {
      if (typeof value === 'string') {
         setName(value)
         return
      }
      setChildAction(() => value)
   }
   return (
      <>
         <p>父组件中 name: {name}</p>
         <ParentToChildChild name={name} onSend={handleSend} />
         <button onClick={() => childAction?.()}>父组件执行子组件传来的函数</button>
      </>
   )
}
```

### 重点

- 单向数据流（父到子），子组件不要直接修改 props。
- 通用方法，兄弟间（不能直接通讯，但是可以将状态提升到最近的公共父组件）、跨层级···都可以通过这种方式通讯，只不过可能比较臃肿

---

## 2. 跨层通信（Context）

**核心思想**：祖先组件通过 Provider 提供数据，任意后代通过 `useContext` 消费；有点类似于Vue中的Provide/Inject

**基本用法**：

1. 先创建一个上下文，creatContext，入参就是要传递的状态
2. 用上下文包裹子组件，用`value`传递状态
3. 子组件中用useContext获取祖先组件传递的状态

```tsx
// 基础用法
import { createContext, useContext, useState } from 'react'

interface ThemeContextType {
  theme: string,
  toggleTheme: () => void
}

// 创建上下文
  const ThemeContext = createContext({
    theme:"light",
    toggleTheme: () => { },
  })

// 父组件
function Parent(){
  const [theme, setTheme] = useState<"light"|"dark">("light")

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const value: ThemeContextType = {
    theme,
    toggleTheme
  }

  return(
    <div>
      <ThemeContext.Provider value={value}>
        父组件系统主题: {theme}
        <Child/>
      </ThemeContext.Provider>
    </div>
  )
}

// 子组件
function Child(){
  // 获取父组件上下文
  const context = useContext(ThemeContext)

  return(
    <div>
      子组件系统主题: {context.theme}
      <button onClick={context.toggleTheme}>修改主题</button>
    </div>
  )
}

export default Parent
```

### 重点

- 可以使用多个&嵌套使用Context，子组件可以同时获得多个祖先中传递过来的状态
- Context读取规则是距离组件所在位置最近的Provider,有一种特殊情况，两个相同的Provider嵌套使用，会取离得最近的，不同的Provider不会有这个问题。
  - ```tsx
    <ThemeContext.Provider value="light">
      <ThemeContext.Provider value="dark">
        <Child />  // 这里拿到 dark（离得最近的 Provider）
      </ThemeContext.Provider>
    </ThemeContext.Provider>
    ```

## 3. 父组件控制子组件（`ref` + `useImperativeHandle`）

**核心思想**：子组件暴露少量命令式方法给父组件调用。

```tsx
type InputController = {
   focus: () => void
   clear: () => void
}

const ImperativeInput = ({ ref }: { ref: Ref<InputController> }) => {
   const [value, setValue] = useState('Hello Ref')
   const inputRef = useRef<HTMLInputElement>(null)

   useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      clear: () => setValue(''),
   }))

   return <input ref={inputRef} value={value} onChange={(e) => setValue(e.target.value)} />
}

const RefDemo = () => {
   const inputRef = useRef<InputController>(null)
   return (
      <>
         <p>父组件通过 ref 调用子组件暴露的方法</p>
         <ImperativeInput ref={inputRef}  />
         <div className="inline-actions">
            <button onClick={() => inputRef.current?.focus()}>聚焦</button>
            <button onClick={() => inputRef.current?.clear()}>清空</button>
         </div>
      </>
   )
}
```

### 重点

- useImperativeHandle传入第三个参数时的执行时机问题

---

## 4. Render Props 通信

**核心思想**：组件通过函数子节点把内部状态和行为“交给外部渲染”。

```tsx
const CounterRenderProps = ({
   children,
}: {
   children: (state: { count: number; inc: () => void; dec: () => void }) => ReactNode
}) => {
   const [count, setCount] = useState(0)
   return <>{children({ count, inc: () => setCount((v) => v + 1), dec: () => setCount((v) => v - 1) })}</>
}

const RenderPropsDemo = () => {
   return (
      <>
         <p>通过 render props，把“状态和行为”从组件内部暴露给外部 UI。</p>
         <CounterRenderProps>
            {({ count, inc, dec }) => (
               <div className="inline-actions">
                  <button onClick={dec}>-</button>
                  <span>count: {count}</span>
                  <button onClick={inc}>+</button>
               </div>
            )}
         </CounterRenderProps>
      </>
   )
}
```

---

## 5. 非父子通信（事件总线 Event Bus）

**核心思想**：通过发布/订阅模型发送和接收消息。

```tsx
type BusPayload = {
   from: string
   content: string
}

const simpleEventBus = (() => {
   const listeners = new Set<(payload: BusPayload) => void>()
   return {
      subscribe(listener: (payload: BusPayload) => void) {
         listeners.add(listener)
         return () => {
            listeners.delete(listener)
         }
      },
      emit(payload: BusPayload) {
         listeners.forEach((listener) => listener(payload))
      },
   }
})()

const EventBusSender = () => {
   return (
      <button
         onClick={() =>
            simpleEventBus.emit({
               from: 'Sender',
               content: '发送广播消息',
            })
         }
      >
         发送广播
      </button>
   )
}

const EventBusReceiver = () => {
   const [logs, setLogs] = useState<string[]>(['原始广播'])
   useEffect(() => {
      const unsubscribe = simpleEventBus.subscribe((payload) => {
         setLogs((prev) => [`${payload.from}: ${payload.content}`, ...prev])
      })
      return unsubscribe
   }, [])

   return (
      <ul>
         {logs.map((item) => <li key={item}>{item}</li>)}
      </ul>
   )
}
```

### 重点

- 订阅后要取消订阅（`useEffect` cleanup）。

---

## 6. 全局状态通信（外部 Store + `useSyncExternalStore`）

**核心思想**：把状态放到 React 外部，让多个组件订阅同一份状态。

```tsx
const countStore = (() => {
   let count = 0
   const listeners = new Set<() => void>()

   const notify = () => listeners.forEach((listener) => listener())

   return {
      // 获取当前状态
      getSnapshot: () => count,
      // 订阅数据源变化
      subscribe: (listener: () => void) => {
         listeners.add(listener)
         return () => {
            listeners.delete(listener)
         }
      },
      increase: () => {
         count += 1
         notify()
      },
      decrease: () => {
         count -= 1
         notify()
      },
   }
})()

const useGlobalCount = () => useSyncExternalStore(countStore.subscribe, countStore.getSnapshot)

const GlobalCounterA = () => {
   const count = useGlobalCount()
   return (
      <div>
         <span>组件A count: {count}</span>
         <button onClick={countStore.increase}>A +1</button>
      </div>
   )
}

const GlobalCounterB = () => {
   const count = useGlobalCount()
   return (
      <div>
         <span>组件B count: {count}</span>
         <button onClick={countStore.decrease}>B -1</button>
      </div>
   )
}

const ExternalStoreDemo = () => {
   return (
      <>
         <p>使用外部 Store（这里用 useSyncExternalStore）让多个组件共享状态。</p>
         <GlobalCounterA />
         <GlobalCounterB />
      </>
   )
}
```

### 重点

- `getSnapshot` ：当前状态。
- `subscribe`：订阅数据变化，React会自动创建两个组件对应的订阅回调函数，相当于喇叭的作用，每次状态变化的时候，都会去通知订阅者（`notify()`）去重新渲染，

---
