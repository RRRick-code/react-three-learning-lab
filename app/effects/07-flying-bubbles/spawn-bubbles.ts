import { MathUtils } from 'three'
import type { WorkerApi } from '@react-three/cannon'
import {
  HIDDEN_POSITION,
  SPAWN_BUBBLE_COUNT,
  SPAWN_BUBBLE_FADE_DURATION,
  getBubbleSpeedFactor,
  type GetBubbleViewport,
  type SpawnBubbleData,
} from './bubble-types'

export function createSpawnBubbles() {
  const spawn: SpawnBubbleData[] = [];

  // spawn 泡泡初始时都放在池里，等生成时再激活并移动到合适位置。
  for (let index = 0; index < SPAWN_BUBBLE_COUNT; index += 1) {
    const scale = MathUtils.randFloat(1, 1.2);
    spawn.push({
      scale,
      z: 0,
      speedFactor: getBubbleSpeedFactor(scale),
      active: false,
      birthTime: 0,
      exitLimit: 0,
      position: [...HIDDEN_POSITION],
    });
  }

  return spawn;
}

export function pickOpenSpawnIndices(spawn: SpawnBubbleData[], maxCount: number) {
  const openSpawnIndices: number[] = [];

  for (let index = 0; index < spawn.length; index += 1) {
    if (!spawn[index].active) {
      openSpawnIndices.push(index);
    }
  }

  const spawnCount = MathUtils.randInt(0, Math.min(maxCount, openSpawnIndices.length));
  const pickedIndices: number[] = [];

  for (let i = 0; i < spawnCount; i += 1) {
    const openSlotIndex = MathUtils.randInt(0, openSpawnIndices.length - 1);
    const [index] = openSpawnIndices.splice(openSlotIndex, 1);
    pickedIndices.push(index);
  }

  return pickedIndices;
}

type ActivateSpawnBubbleOptions = {
  bubble: SpawnBubbleData;
  body: WorkerApi;
  elapsedTime: number;
  depth: number;
  speed: number;
  getViewport: GetBubbleViewport;
}

// spawn 泡泡生成时的初始化设置。
export function activateSpawnBubble({
  bubble,
  body,
  elapsedTime,
  depth,
  speed,
  getViewport,
}: ActivateSpawnBubbleOptions) {
  const z = MathUtils.randFloat(0, depth * 0.45);
  const { width, height } = getViewport(z);
  const x = MathUtils.randFloatSpread(width * 0.7);
  const y = MathUtils.randFloat(-height * 0.5, 0);

  bubble.active = true;
  bubble.birthTime = elapsedTime;
  bubble.z = z;
  bubble.exitLimit = height * 2;
  bubble.speedFactor = getBubbleSpeedFactor(bubble.scale);
  bubble.position[0] = x;
  bubble.position[1] = y;
  bubble.position[2] = -z;

  body.position.set(x, y, -z);
  body.velocity.set(MathUtils.randFloatSpread(0.35), speed * 0.25, MathUtils.randFloatSpread(0.2));
  body.angularVelocity.set(MathUtils.randFloatSpread(0.3), MathUtils.randFloatSpread(0.3), MathUtils.randFloatSpread(0.3));
  body.collisionResponse.set(true);
  body.collisionFilterMask.set(-1);
  body.scaleOverride([0, 0, 0]);
  body.wakeUp();
}

// spawn 泡泡飞出顶部后回收到池里，暂停物理并隐藏。
export function deactivateSpawnBubble(bubble: SpawnBubbleData, body: WorkerApi) {
  bubble.active = false;
  bubble.position[0] = HIDDEN_POSITION[0];
  bubble.position[1] = HIDDEN_POSITION[1];
  bubble.position[2] = HIDDEN_POSITION[2];

  body.position.set(...HIDDEN_POSITION);
  body.velocity.set(0, 0, 0);
  body.angularVelocity.set(0, 0, 0);
  body.collisionResponse.set(false);
  body.collisionFilterMask.set(0);
  body.scaleOverride([0, 0, 0]);
  body.sleep();
}

// spawn 泡泡从无到有的淡入动画，配合上升力一起营造更自然的生成效果。
export function updateSpawnScale(bubble: SpawnBubbleData, body: WorkerApi, elapsedTime: number) {
  const fade = MathUtils.clamp((elapsedTime - bubble.birthTime) / SPAWN_BUBBLE_FADE_DURATION, 0, 1);
  const visualScale = bubble.scale * fade;
  body.scaleOverride([visualScale, visualScale, visualScale]); // 物理碰撞体的实际尺寸不变，保持稳定的碰撞表现。
}
