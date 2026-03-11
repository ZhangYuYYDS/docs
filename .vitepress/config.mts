import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Notes",
  srcDir: "src",
  lastUpdated: true,
  cleanUrls: true,
  outDir: "docs",
  base: "/docs/",
  head: [["link", { rel: "icon", type: "image/svg+xml", href: "https://api.iconify.design/dinkie-icons:cat-face-small.svg" }]],
  themeConfig: {
    logo: "https://api.iconify.design/openmoji:hacker-cat.svg",
    search: {
      provider: "local",
      options: {
        translations: {
          button: { buttonText: "Search", buttonAriaLabel: "Search" },
          modal: {
            noResultsText: "No results for",
            footer: { selectText: "to select", navigateText: "to navigate", closeText: "to close" },
          },
        },
      },
    },

    // ==================== 顶部导航栏 ====================
    nav: [{ text: "home", link: "/" }],

    // ==================== 多侧边栏配置 ====================
    sidebar: {
      "/javascript/": [
        {
          text: "Documentation",
        },
      ],
      "/typescript/": [
        {
          text: "Documentation",
        },
      ],
      "/react/": [
        {
          text: "Documentation",
          items: [
            {
              text: "Hooks",
              collapsed: false,
              items: [
                { text: "useState", link: "/react/hooks/useState" },
                { text: "useEffect", link: "/react/hooks/useEffect" },
                { text: "useTransition&useDeferredValue", link: "/react/hooks/useTransition&useDeferredValue" },
                { text: "useRef", link: "/react/hooks/useRef" },
                { text: "useMemo", link: "/react/hooks/useMemo" },
                { text: "useCallback", link: "/react/hooks/useCallback" },
                { text: "自定义 Hooks", link: "/react/hooks/custom-hooks" },
              ],
            },
            {
              text: "Component",
              collapsed: false,
              items: [
                { text: "组件通讯方式", link: "/react/components/commService" },
                { text: "受控组件与非受控组件", link: "/react/components/controlledComponent" },
              ],
            },
            {
              text: "router",
              collapsed: false,
              items: [
                { text: "模式", link: "/react/router/dataRouter" },
                { text: "路由", link: "/react/router/router" },
                { text: "传参", link: "/react/router/params" },
                { text: "懒加载", link: "/react/router/lazy" },
              ],
            },
          ],
        },
      ],
      "/vue/": [
        {
          text: "Documentation",
        },
      ],
    },

    // 社交链接
    socialLinks: [{ icon: "github", link: "https://github.com/ZhangYuYYDS/docs" }],

    // 页脚
    footer: {
      message: "好记性不如烂笔头",
      copyright: `Copyright © ${new Date().getFullYear()}`,
    },

    // 文档页脚导航文本
    docFooter: {
      prev: "Previous Page",
      next: "Next Page",
    },

    // 大纲配置
    outline: {
      label: "On this page",
      level: [2, 3],
    },

    // 最后更新时间
    lastUpdated: {
      text: "Last updated",
    },

    // 编辑链接
    editLink: {
      pattern: "https://github.com/ZhangYuYYDS/docs/:path",
      text: "Suggest changes to this page",
    },
    externalLinkIcon: true,
  },
});
