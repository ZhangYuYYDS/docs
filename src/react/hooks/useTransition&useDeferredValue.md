# useTransition 与 useDeferredValue

> 这两个都是控制React更新的优先级，先更新优先级高的，再更新优先级低的，只不过这俩的实现方法不同。

## useTransition

先说一下我对useTransition的理解，useTransition主要是将 **“更新的过程”** 进行延迟，优先级较低，React会优先处理紧急度高的更新，再空闲时处理这次更新。

比如一个输入框+大列表过滤，根据输入的内容筛选列表，可以将筛选的过程设置成一个“过渡”，优先级低，可以延后处理，这样子筛选的过程中继续输入的话，可以优先处理输入，输入是正常的；如果不设置的话，React会将输入框的变化和筛选的过程视作一次更新，会一次性完成这次更新，如果筛选没完成的话，可能再输入内容，输入框中也不会变。

用法：
`const [isPending, startTransition] = useTransition();`

- isPending(boolean)，告诉你是否存在待处理的 transition。
- startTransition(function) 函数，你可以使用此方法将状态更新标记为 transition。

简单例子：

```tsx
const [inputValue, setInputValue] = useState("");
const [searchQuery, setSearchQuery] = useState("");
const [isPending, startTransition] = useTransition();

const filteredList = useMemo(() => list.filter(item => item.name.includes(searchQuery)), [list, searchQuery]);

const changeHandle = () => {
  setInputValue(value); // 紧急更新：输入框立即响应
  startTransition(() => setSearchQuery(value)); // 过渡更新：筛选延后处理
};

return (
  <>
    <input value={inputValue} onChange={e => handleChange(e.target.value)} />
    {isPending && <span>搜索中...</span>}
    <List items={filteredList} />
  </>
);
```

## useDeferredValue

说一下我对useDeferredValue的理解，useDeferredValue主要是将与 **“值的更新”** 进行延迟，优先处理与原始值（query）相关的渲染，延迟处理值的更新和与更新值（deferredQuery）相关的渲染。比如有一个输入框+大列表过滤，输入框的更新与query关联起来，筛选的过程与deferredQuery关联起来，这样子当输入框中内容变化的时候，React 会先安排一次高优先级的更新，重画输入框那一小块的内容，此时可能deferredQuery还是旧值；当紧急更新处理完，React会在安排一次低优先级的更新，这次更新主要是将deferredQuery更新成何query一样的值，并且将和deferredQuery相关的UI也重新渲染。

用法：
`const deferredValue = useDeferredValue(value)`

- value: 延迟更新的值(支持任意类型)
- deferredValue: 延迟更新的值,在初始渲染期间，返回的延迟值将与您提供的值相同

简单例子：

```tsx
const [query, setQuery] = useState("");
const deferredQuery = useDeferredValue(query);

const filteredList = useMemo(() => list.filter(item => item.name.includes(deferredQuery)), [list, deferredQuery]);

return (
  <>
    <input value={query} onChange={e => setQuery(e.target.value)} />
    <List items={filteredList} />
  </>
);
```
