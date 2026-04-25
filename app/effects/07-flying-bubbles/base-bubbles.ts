import { MathUtils } from 'three'
import type { WorkerApi } from '@react-three/cannon'
import {
  BUBBLES_GROUP_Y_OFFSET,
  createBubbleScale,
  getBubbleSpeedFactor,
  type BaseBubbleData,
  type GetBubbleViewport,
} from './bubble-types'

type CreateBaseBubblesOptions = {
  count: number;
  depth: number;
  getViewport: GetBubbleViewport;
}

export function createBaseBubbles({ count, depth, getViewport }: CreateBaseBubblesOptions) {
  const base: BaseBubbleData[] = [];

  // 根据 count 和 depth，平均分布在不同深度的层里，每层随机散布一定范围内的位置。
  for (let index = 0; index < count; index += 1) {
    const z = MathUtils.lerp(0, depth, index / count);
    const { width, height } = getViewport(z);
    const scale = createBubbleScale();
    const yLimit = height * (index === 0 ? 4 : 1);
    const y = MathUtils.randFloatSpread(height * 2) + BUBBLES_GROUP_Y_OFFSET;
    base.push({
      scale,
      z,
      speedFactor: getBubbleSpeedFactor(scale),
      exitLimit: BUBBLES_GROUP_Y_OFFSET + yLimit,
      resetY: BUBBLES_GROUP_Y_OFFSET - yLimit,
      position: [index === 0 ? 0 : MathUtils.randFloatSpread(width * 1.2), y, -z],
    });
  }

  return base;
}

type ResetBaseBubbleOptions = {
  bubble: BaseBubbleData;
  body: WorkerApi;
  index: number;
  speed: number;
  getViewport: GetBubbleViewport;
}

// base 泡泡飞出顶部后回到底部继续循环，第一个泡泡始终保持在中线附近。
export function resetBaseBubble({
  bubble,
  body,
  index,
  speed,
  getViewport,
}: ResetBaseBubbleOptions) {
  const { width } = getViewport(bubble.z);
  const nextX = index === 0 ? 0 : MathUtils.randFloatSpread(width * 1.2);

  bubble.position[0] = nextX;
  bubble.position[1] = bubble.resetY;
  bubble.position[2] = -bubble.z;

  body.position.set(nextX, bubble.resetY, -bubble.z);
  body.velocity.set(MathUtils.randFloatSpread(0.45), speed * 0.2, MathUtils.randFloatSpread(0.25));
  body.angularVelocity.set(MathUtils.randFloatSpread(0.4), MathUtils.randFloatSpread(0.4), MathUtils.randFloatSpread(0.4));
  body.scaleOverride([bubble.scale, bubble.scale, bubble.scale]);
  body.wakeUp();
}
