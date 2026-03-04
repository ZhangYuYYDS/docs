---
layout: page
---

<style>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 40px;
}

.home h1 {
  font-size: 6.5rem;
  font-weight: 900;
  line-height: 1.1;
  background: linear-gradient(0deg, #f9d423 0%, #ff4e50 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 60px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 160px);
  gap: 24px;
}

.grid a {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border-radius: 24px;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
  transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.grid a:hover {
  transform: translateY(-8px) scale(1.02);
  border-color: rgba(255, 78, 80, 0.4);
  box-shadow: 0 20px 50px rgba(255, 78, 80, 0.12);
}

.grid img {
  width: 52px;
  height: 52px;
  transition: transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.grid a:hover img {
  transform: scale(1.2);
}

@media (max-width: 760px) {
  .grid { grid-template-columns: repeat(2, 140px); gap: 16px; }
  .home h1 { font-size: 4rem; margin-bottom: 40px; }
}
</style>

<div class="home">
  <h1>NOTES</h1>
  <div class="grid">
    <a href="/docs/vue/">
      <img src="https://api.iconify.design/logos:vue.svg" />
    </a>
    <a href="/docs/react/">
      <img src="https://api.iconify.design/logos:react.svg" />
    </a>
    <a href="/docs/javascript/">
      <img src="https://api.iconify.design/logos:javascript.svg" />
    </a>
    <a>
      <img src="https://api.iconify.design/token-branded:popcat.svg" />
    </a>
  </div> 
</div>
