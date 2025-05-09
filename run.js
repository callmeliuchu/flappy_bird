/**
 * Flappy Bird 环境运行脚本
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

class FlappyBirdRunner {
  constructor() {
    // 创建环境实例
    this.env = new FlappyBirdEnv({
      renderMode: 'human', // 使用 'human' 以便在浏览器中可视化
      useLidar: false
    });
    
    // 运行状态
    this.isRunning = false;
    this.frameCount = 0;
    this.frameInterval = 1000 / this.env.options.fps; // 基于环境的 FPS
    this.lastTime = 0;
    
    // 绑定方法
    this.run = this.run.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
  }
  
  /**
   * 开始运行
   */
  run() {
    if (this.isRunning) return;
    
    console.log('开始运行...');
    
    // 重置环境 (对应 env.reset() 和 state,_ = env.reset())
    const { observation, info } = this.env.reset();
    
    console.log('初始状态:', observation);
    
    this.isRunning = true;
    this.frameCount = 0;
    this.lastTime = performance.now();
    
    // 开始游戏循环
    requestAnimationFrame(this.gameLoop);
  }
  
  /**
   * 游戏循环
   */
  gameLoop(currentTime) {
    if (!this.isRunning) return;
    
    const deltaTime = currentTime - this.lastTime;
    
    if (deltaTime >= this.frameInterval) {
      this.lastTime = currentTime - (deltaTime % this.frameInterval);
      
      // 随机选择动作 (0: 不动, 1: 跳跃) - 对应 action = int(np.random.choice([0,1]))
      const action = Math.floor(Math.random() * 2);
      
      // 执行动作 - 对应 next_state, reward, done, truncated, _ = env.step(action)
      const { observation, reward, terminated, truncated, info } = this.env.step(action);
      
      // 输出动作和奖励 - 对应 print(action,reward)
      console.log(action, reward);
      
      this.frameCount++;
      
      // 检查是否结束 - 对应 while not done 循环条件
      if (terminated) {
        console.log('游戏结束! 总帧数:', this.frameCount, '最终分数:', info.score);
        this.isRunning = false;
        return;
      }
    }
    
    requestAnimationFrame(this.gameLoop);
  }
}

// 当文档加载完成后自动运行
document.addEventListener('DOMContentLoaded', () => {
  const runner = new FlappyBirdRunner();
  
  // 将实例暴露到全局，方便在控制台调试
  window.flappyRunner = runner;
  
  // 自动开始运行
  runner.run();
  
  console.log('Flappy Bird 运行已开始。在控制台中，您可以使用 window.flappyRunner 来访问运行实例。');
  console.log('如果需要重新开始，请在控制台中执行: window.flappyRunner.run()');
});
