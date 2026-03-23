# Vue2 & Vue3响应式原理

## 为什么？

本质是为了实现数据驱动视图，当数据变化时，视图可以自动更新，不需要开发者手动去操作DOM。
如果没有响应式机制的话，数据改变的时候都要要手动去更新页面，不仅代码复杂，还容易造成数据和页面不一致的情况，有了响应式机制之后，开发者只需要关系数据变成了什么，不要关心数据怎么更新，降低了开发的复杂度，也提高了代码的可维护性。

## 怎么做

### Vue2

Vue2通过是`Object.defineProperty`对数据进行劫持，实现响应式。
核心流程是：

1. 数据劫持
   - 初始化时遍历data中所有属性
   - 使用defineProperty给每一个属性添加getter和setter
2. 收集依赖
   - 当属性被访问时，收集当前依赖（Watcher）
3. 派发更新
   - 当属性被修改时，通知依赖执行更新（dep.notify()）

#### 三个角色：

1. **角色1: Observer（观察者）—— 劫持数据**

```js
class Observer {
  constructor(data) {
    this.walk(data);
  }
  walk(obj) {
    Object.keys(obj).forEach(key => {
      defineReactive(obj, key, obj[key]);
    });
  }
}

function defineReactive(obj, key, val) {
  const dep = new Dep(); // 每个属性都有自己的依赖管理器

  // 针对嵌套对象做递归劫持
  if (typeof val === "object" && val !== null) {
    new Observer(val);
  }

  Object.defineProperty(obj, key, {
    get() {
      // 依赖收集：谁在读我，就把谁记下来
      if (Dep.target) {
        dep.addSub(Dep.target);
      }
      return val;
    },
    set(newVal) {
      if (newVal === val) return;
      // 将newVal存到闭包中
      val = newVal;
      // 新值如果是对象，也要劫持
      if (typeof newVal === "object") new Observer(newVal);
      // 通知所有依赖更新
      dep.notify();
    },
  });
}
```

2. **角色2: Dep（依赖管理器）—— 收集和通知**

```js
class Dep {
  constructor() {
    this.subs = []; // 存放所有 watcher
  }
  addSub(watcher) {
    this.subs.push(watcher);
  }
  notify() {
    this.subs.forEach(watcher => watcher.update());
  }
}
Dep.target = null;
```

3. **角色3: Watcher（订阅者）—— 组件挂载/computes/watch**

```js
class Watcher {
  constructor(vm, getter, cb) {
    // 挂载场景下，getter相当于render函数，生成vNode的时候会访问data中的属性
    this.getter = getter;
    this.cb = cb;
    this.value = this.get(); // 初始化时触发 getter，完成依赖收集
  }
  get() {
    Dep.target = this; // 把自己挂到全局
    // 访问属性，触发defineProperty 的 get → 被收集
    const value = this.getter(); // 读取数据 → 触发
    Dep.target = null; // 收集完毕，摘掉
    return value;
  }
  update() {
    // 获取到闭包中的val值，在setter的时候将新值存到val中了
    const newVal = this.get();
    this.cb(newVal); // 执行回调（重新渲染/执行watch回调等）
  }
}
```

完整流程：

1. 初始化
   new Vue({ data: { msg: 'hello' } })
   → Observer 遍历 data，给每个属性加 getter/setter
   → 每个属性创建一个 Dep

2. 挂载/渲染
   模板编译 → 创建渲染 Watcher
   → Watcher 执行 render 函数
   → render 中读取 this.msg
   → 触发 msg 的 getter
   → Dep 收集这个 Watcher

3. 更新
   this.msg = 'world'
   → 触发 msg 的 setter
   → setter 中调用 dep.notify()
   → 通知渲染 Watcher 执行 update
   → 重新渲染组件

#### 局限性

```js
// 1. 新增属性检测不到
this.obj.newKey = "value"; // 不触发更新
Vue.set(this.obj, "newKey", "value"); // 需要用 $set

// 2. 删除属性检测不到
delete this.obj.key; // 不触发更新
Vue.delete(this.obj, "key"); // 需要用 $delete

// 3. 数组索引赋值检测不到
this.arr[0] = "new"; // 不触发更新
this.$set(this.arr, 0, "new"); // 需要用 $set
```

对象的检测不到新增和删除，是因为`defineProperty`是在初始化的时候遍历一次已有属性做劫持，新增的时候没有这个setter，不会触发更新；删除只是删除属性，不会触发任何setter；

数组检测不到不是`defineProperty`的原因，因为我试了有的方法和索引都能劫持到，本质是因为Vue2没有对数组的每一个索引做getter/setter，主要是考虑到性能原因，比如数组可能很长的情况下，给每一个索引都加getter/setter成本会高。

#### 数组方法

Vue2重写了数组的push, pop, shift, unshift, splice, sort, reverse这七个方法

```js
// Vue 2 重写数组的 7 个方法
const arrayProto = Array.prototype; // 保存原生 Array 原型，后面要调用原始方法
const arrayMethods = Object.create(arrayProto); // 以 arrayProto 为原型创建新对象，未重写的方法（如 concat）仍从原型链上找到

["push", "pop", "shift", "unshift", "splice", "sort", "reverse"].forEach(method => {
  const original = arrayProto[method]; // 保存原始方法引用，如 Array.prototype.push
  Object.defineProperty(arrayMethods, method, {
    value(...args) {
      // 获取数组调用方法之后的结果
      const result = original.apply(this, args);

      const ob = this.__ob__;
      // 本次新增的元素需要做响应式
      let inserted;
      if (method === "push" || method === "unshift") inserted = args;
      if (method === "splice") inserted = args.slice(2);
      if (inserted) ob.observeArray(inserted);

      // 本质是拿到闭包中的新的值，即result
      ob.dep.notify(); // 手动通知依赖更新（原生方法不会触发 setter）
      return result; // 返回原始方法的返回值，如 push 返回新 length
    },
  });
});
```

### Vue3

Vue 3 通过 `Proxy` 代理整个对象，能拦截属性的读取、赋值、新增、删除等操作，并用 `track`/`trigger` + `effect` 做依赖管理。

核心流程：

1. 数据代理
   - 用 `Proxy` 包装对象，在 `get` 时收集依赖，在 `set` 时触发更新
2. 依赖收集
   - 读取属性时执行 `track(target, key)`，把当前 effect 加入依赖集合
3. 派发更新
   - 修改属性时执行 `trigger(target, key)`，执行依赖集合里的 effect

#### 核心实现

**1. reactive（Proxy）—— 代理对象**

```js
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key) {
      track(target, key); // 读取时收集依赖
      const value = target[key];
      // 嵌套对象：访问时才创建 Proxy（惰性代理）
      if (typeof value === "object" && value !== null) {
        return reactive(value);
      }
      return value;
    },
    set(target, key, newVal) {
      target[key] = newVal;
      trigger(target, key); // 修改时触发更新
      return true;
    },
    deleteProperty(target, key) {
      delete target[key];
      trigger(target, key); // 删除也能触发
      return true;
    },
  });
}
```

**2. track / trigger —— 依赖管理（替代 Vue2 的 Dep）**

```js
// 存储结构：WeakMap<target, Map<key, Set<effect>>>
const targetMap = new WeakMap();
let activeEffect = null; // 当前正在运行的 effect，替代 Dep.target

function track(target, key) {
  if (!activeEffect) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) targetMap.set(target, (depsMap = new Map()));
  let dep = depsMap.get(key);
  if (!dep) depsMap.set(key, (dep = new Set()));
  dep.add(activeEffect); // 收集当前 effect
}

function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const dep = depsMap.get(key);
  if (dep) dep.forEach(effect => effect());
}
```

**3. effect —— 副作用函数（替代 Vue2 的 Watcher）**

```js
function effect(fn) {
  const effectFn = () => {
    activeEffect = effectFn; // 正在执行的effect
    fn(); // 执行时读取响应式数据 → 触发 get → track 收集
    activeEffect = null; // 收集完，清空
  };
  effectFn();
}

// 使用
effect(() => {
  console.log(state.msg); // 读取 → track
});
state.msg = "world"; // 写入 → trigger → effect 重新执行
```

**4. ref —— 基本类型的响应式**

```js
function ref(value) {
  const refObj = {
    get value() {
      track(refObj, "value"); // 读 .value 时收集依赖
      return value; // 返回闭包里的值
    },
    set value(newVal) {
      value = newVal; // 更新闭包
      trigger(refObj, "value"); // 写 .value 时触发更新
    },
  };
  return refObj;
}
```

**为什么需要 ref？** Proxy 只能代理对象（`typeof obj === 'object'`），基本类型没有属性可拦截，所以用 `{ value: 原始值 }` 包一层，在 `.value` 的 getter/setter 里做 track/trigger。

#### 完整流程

1. 初始化
   `reactive({ msg: 'hello' })`
   → 返回 Proxy，不遍历属性

2. 挂载/渲染
   `effect(render)` 执行
   → `activeEffect = render`
   → render 读取 state.msg
   → 触发 get → track 收集 effect

3. 更新
   `state.msg = 'world'`
   → 触发 set → trigger
   → 执行依赖里的 effect（render）
   → 重新渲染

4. 新增/删除属性
   `state.newKey = 'x'` 或 `delete state.key`
   → 也能被 Proxy 拦截并 trigger

#### 与 Vue2 对比

| 方面      | Vue2                      | Vue3                       |
| --------- | ------------------------- | -------------------------- |
| 劫持方式  | defineProperty 逐个属性   | Proxy 代理整个对象         |
| 依赖存储  | 每个属性一个 Dep          | WeakMap + Map + Set        |
| 当前依赖  | Dep.target 全局变量       | activeEffect 闭包          |
| 新增/删除 | 检测不到，需 $set/$delete | 可拦截                     |
| 数组      | 重写 7 个方法             | 无需重写，Proxy 可拦截     |
| 嵌套对象  | 初始化时递归劫持          | 访问时再创建 Proxy（惰性） |

## 总结

### Vue2

Vue2实现响应式主要是通过`Object.defineProperty`实现的，通过遍历对象的属性，逐个添加getter和setter，getter负责收集依赖，setter负责通知更新。这样就有局限性了，只能拦截已存在的属性，无法感知对象属性的新增和删除；针对数组无法感知数组的索引赋值和length变化，所以Vue2重写了数组的方法，并且提供了`$set`和`$delete`方法作为补丁。

`Object.defineProperty`本身是能够感知到数组的索引赋值和部分数组方法，但是Vue2考虑到性能问题，直接跳过数组了

### Vue3

Vue 3 改用 Proxy 代理整个对象，能拦截所有操作——读取、赋值、新增、删除、in 判断、for...in 遍历全都能捕获，数组的任何方法也天然支持，不再需要任何 hack。同时 Vue 3 采用惰性代理策略，嵌套对象只在被访问时才创建 Proxy，而非初始化时递归全部劫持，性能更优。依赖管理也从 Dep/Watcher 模式升级为基于 WeakMap 的 track/trigger + effect 体系，更轻量、更精确。

一句话总结：Vue 2 是"提前逐个盯住每个属性"，Vue 3 是"在对象门口设了一道全能关卡"。
