/**
 * 简单的 Flappy Bird 环境测试脚本
 * 直接模拟 Python 代码:
 * 
 * env.reset()
 * state,_ = env.reset()
 * done = False
 * while not done:
 *     action = int(np.random.choice([0,1]))
 *     next_state, reward, done, truncated, _ = env.step(action)
 *     print(action,reward)
 */

import FlappyBirdEnv from './env.js';

// 创建环境实例 (renderMode 设为 'none' 以避免渲染)
const env = new FlappyBirdEnv({ renderMode: 'none' });

// 重置环境 (对应 env.reset() 和 state,_ = env.reset())
env.reset();
const { observation } = env.reset();

console.log('初始状态:', observation);

// 模拟游戏循环 (对应 while not done:)
function runSimulation() {
  let done = false;
  let steps = 0;
  const maxSteps = 1000; // 防止无限循环
  
  while (!done && steps < maxSteps) {
    // 随机选择动作 (0 或 1) - 对应 action = int(np.random.choice([0,1]))
    const action = Math.floor(Math.random() * 2);
    
    // 执行动作 - 对应 next_state, reward, done, truncated, _ = env.step(action)
    const { observation: nextState, reward, terminated, truncated } = env.step(action);
    
    // 输出动作和奖励 - 对应 print(action,reward)
    console.log(action, reward);
    
    // 更新循环条件
    done = terminated;
    steps++;
  }
  
  console.log('模拟结束，总步数:', steps);
}

// 运行模拟
runSimulation(); 