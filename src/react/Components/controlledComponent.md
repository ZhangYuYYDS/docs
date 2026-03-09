# 受控组件与非受控组件

## 1. 什么是受控组件

受控组件指的是：

- 表单元素的值由 React `state` 控制
- 输入框显示什么，取决于 `value={state}`
- 用户输入后，通过 `onChange` 更新 state

典型写法：

```tsx
const [username, setUsername] = useState('')

<input
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>
```

可以把它理解成：

> DOM 负责接收用户输入，但真正的数据源是 React state。

## 2. 什么是非受控组件

非受控组件指的是：

- 表单元素的值主要由 DOM 自己保存
- React 不在每次输入时同步 state
- 需要时通过 `ref` 去读取 DOM 当前值

典型写法：

```tsx
const inputRef = useRef<HTMLInputElement>(null)

<input ref={inputRef} defaultValue="" />
```

读取值时：

```tsx
const value = inputRef.current?.value
```

可以把它理解成：

> 数据源更多在 DOM 那边，React 是“需要时再来拿”。

## 3. 两者最核心的区别

### 受控组件

- React state 是单一数据源
- 输入值始终和 state 同步
- 更容易做实时校验、条件渲染、联动

### 非受控组件

- DOM 自己保存输入值
- React 不一定知道你每次输入了什么
- 通常在提交、点击按钮、失焦时再统一读取

## 4. 示例

### 受控组件
```tsx
const ControlledFormDemo = () => {
  const [form, setForm] = useState({
    username: '',
    password: '',
  })

  const usernameLength = form.username.length
  const passwordLength = form.password.length
  const isDisabled = !form.username.trim() || form.password.length < 6

  const handleChange = (field: 'username' | 'password', value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <section>
      <div>
        <label>
          用户名
          <input
            value={form.username}
            onChange={(e) => handleChange('username', e.target.value)}
            placeholder="请输入用户名"
          />
        </label>
        <label>
          密码
          <input
            type="password"
            value={form.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder="至少 6 位"
          />
        </label>
      </div>
      <div>
        <p>当前 state: {JSON.stringify(form)}</p>
        <p>用户名长度: {usernameLength}</p>
        <p>密码长度: {passwordLength}</p>
        <p>按钮状态: {isDisabled ? '禁用' : '可提交'}</p>
      </div>
    </section>
  )
}
```

- `username` 和 `password` 都放在 `form` state 中
- 每次输入时触发 `onChange`
- `setForm` 更新后，React 重新渲染
- 页面上的“当前 state、长度、按钮是否可提交”都会立即同步变化

这类代码的核心特征就是：

```tsx
value={form.username}
onChange={(e) => handleChange('username', e.target.value)}
```

说明“输入框的值由 React state 控制”。

### 非受控组件

```tsx
const UncontrolledFormDemo = () => {
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [submittedData, setSubmittedData] = useState({
    username: '未提交',
    password: '未提交',
  })
  const handleSubmit = () => {
    setSubmittedData({
      username: usernameRef.current?.value || '',
      password: passwordRef.current?.value || '',
    })
  }
  return (
    <section>
      <div>
        <label>
          用户名
          <input ref={usernameRef} defaultValue="用户名默认值" placeholder="请输入用户名" />
        </label>
        <label>
          密码
          <input
            ref={passwordRef}
            type="password"
            defaultValue="密码默认值"
            placeholder="请输入密码"
          />
        </label>
      </div>
      <div>
        <button onClick={handleSubmit}>读取当前输入值</button>
      </div>
      <div>
        <p>读取结果:</p>
        <p>username: {submittedData.username}</p>
        <p>password: {submittedData.password}</p>
      </div>
    </section>
  )
}
```

- 输入框没有绑定 `value`
- 只挂了 `ref`
- React 不跟踪每次输入
- 点击“读取当前输入值”时，才通过 `ref.current?.value` 拿数据

这类代码的核心特征就是：

```tsx
<input ref={usernameRef} defaultValue="" />
```

以及：

```tsx
usernameRef.current?.value
```

说明“值主要在 DOM 里，React 是后来读取”。

## 5. 什么时候更适合用受控组件

受控组件适合这些场景：

- 需要实时校验输入内容
- 需要根据输入立即更新界面
- 需要做禁用按钮、提示文案、字数统计
- 需要多个字段联动
- 需要把表单值和其他 state 一起管理

例如：

- 用户名为空时按钮禁用
- 密码长度不够时立即提示
- 输入时同步搜索建议

受控组件最大的优点是：

**数据流清晰，React 能完整知道当前表单状态。**

## 6. 什么时候更适合用非受控组件

非受控组件适合这些场景：

- 简单表单，不需要每次输入都同步 React state
- 只在提交时读取一次结果
- 与原生 DOM API 或第三方库集成
- 文件上传这类天然更偏 DOM 的场景

例如：

- 一个简单搜索框，只在点“搜索”时读取
- `input type="file"` 文件选择
- 某些表单库内部已经帮你管理 DOM

非受控组件的优点是：

**写法轻一点，不必每次键入都触发 state 更新。**

## 7. 文件上传为什么通常是非受控

像这种：

```tsx
<input type="file" />
```

文件输入在浏览器里比较特殊，通常不会像普通文本框那样完全交给 React 用 `value` 控制。  
这类场景一般会通过 `ref` 或事件对象来读取文件，因此更接近非受控思路。

## 8. 总结
> 受控组件是指表单值由 React state 控制，通常通过 `value + onChange` 实现；非受控组件是指表单值主要由 DOM 自己管理，React 通过 `ref` 在需要时读取。  
> 受控组件适合实时校验和 UI 联动，非受控组件适合简单表单、第三方库集成和文件上传等场景。
