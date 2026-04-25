import { MathUtils } from 'three'
import type { WorkerApi } from '@react-three/cannon'

export const SPAWN_BUBBLE_COUNT = 10;
export const SPAWN_BUBBLE_INTERVAL = 1;
export const SPAWN_BUBBLE_MAX_PER_TICK = 3;
export const SPAWN_BUBBLE_FADE_DURATION = 1.2;
export const BUBBLES_GROUP_Y_OFFSET = 2.5;
// 空闲的 spawn 泡泡会被移动到很远的位置，并关闭碰撞和显示。
export const HIDDEN_POSITION: [number, number, number] = [9999, 9999, 9999];

export type BubblePosition = [number, number, number];

export type BubbleBodyData = {
  scale: number;
  z: number;
  speedFactor: number;
  exitLimit: number;
  position: BubblePosition;
}

export type BaseBubbleData = BubbleBodyData & {
  resetY: number;
}

export type SpawnBubbleData = BubbleBodyData & {
  active: boolean;
  birthTime: number;
}

// base 是一直循环上升的主泡泡；spawn 是临时冒出的泡泡池。
export type BubbleData = {
  base: BaseBubbleData[];
  spawn: SpawnBubbleData[];
}

export type BubblesProps = {
  speed?: number;
  count?: number;
  depth?: number;
}

export type BubbleViewport = {
  width: number;
  height: number;
}

export type GetBubbleViewport = (z: number) => BubbleViewport;

// 大泡泡上升慢一点，小泡泡上升快一点，并加少量随机差异。
export function getBubbleSpeedFactor(scale: number) {
  return MathUtils.mapLinear(scale, 1, 3, 1.2, 0.6) * MathUtils.randFloat(1, 1.2);
}

export function createBubbleScale() {
  // 让尺寸更多落在接近 1 或 3 的两端，避免全部泡泡大小太平均。
  return MathUtils.lerp(1, 3, Math.random() < 0.4 ? Math.pow(Math.random(), 3) * 0.5 : 1 - Math.pow(Math.random(), 3) * 0.5);
}

// 克隆数据对象，保持引用不变但内部值可变，方便后续动画直接改 ref 里的数据。
export function cloneBubbleData<T extends BubbleBodyData>(bubble: T): T {
  return {
    ...bubble,
    position: [...bubble.position] as BubblePosition,
  };
}

type ApplyBubbleForceOptions = {
  bubble: BubbleBodyData;
  body: WorkerApi;
  forceMultiplier: number;
  speed: number;
  x: number;
  z: number;
}

// 施加上升力的同时，稍微把泡泡拉回自己的 x/z 目标范围，避免越飘越散。
export function applyBubbleForce({
  bubble,
  body,
  forceMultiplier,
  speed,
  x,
  z,
}: ApplyBubbleForceOptions) {
  body.applyForce(
    [
      -x * 0.01, // 横向位置越远，拉回的力越大，但整体力度很小，保持自然漂浮感。
      speed * bubble.speedFactor * forceMultiplier,
      (-bubble.z - z) * 0.18,
    ],
    [0, 0, 0]
  );
}
