---
title: Soft Shadow
sourceFiles:
  - page.tsx
primarySource: page.tsx
---

# Soft Shadow

这个案例用 `@react-three/drei` 的 `SoftShadows` 做软阴影实验，重点观察阴影边缘柔化后的层次变化。

## 观察点

- `size` 决定软阴影范围。
- `focus` 会影响阴影过渡的集中程度。
- `samples` 越高，结果越平滑，但成本也越高。

## 代码阅读建议

先看 `useControls` 是怎样把参数暴露给 Leva 的，再看灯光和 `SoftShadows` 如何一起影响最终画面。
