/**
 * Flappy Bird 环境测试脚本
 * 模拟 Python 代码:
 * env.reset()
 * state,_ = env.reset()
 * done = False
 * while not done:
 *     action = int(np.random.choice([0,1]))
 *     next_state, reward, done, truncated, _ = env.step(action)
 *     print(action,reward)
 */

import FlappyBirdEnv from './env.js';

// 创建测试类
class FlappyBirdTester {
  constructor() {
    // 创建环境实例
    this.env = new FlappyBirdEnv({
      renderMode: 'human', // 使用 'human' 以便在浏览器中可视化
      useLidar: false
    });
    
    // 测试状态
    this.testRunning = false;
    this.frameCount = 0;
    this.totalReward = 0;
    this.actionCounts = { 0: 0, 1: 0, 2: 0 }; // 记录每种动作的次数
    
    // 测试配置
    this.testConfig = {
      frameInterval: 1000 / this.env.options.fps, // 基于环境的 FPS
      randomActionProb: 0.3, // 随机选择动作的概率 (0-1)
      actionSpace: [0, 1] // 可选动作: 0=不动, 1=跳跃
    };
    
    // 绑定方法
    this.runTest = this.runTest.bind(this);
    this.testLoop = this.testLoop.bind(this);
    this.stopTest = this.stopTest.bind(this);
    
    // 创建控制界面
    this.setupUI();
  }
  
  /**
   * 设置用户界面
   */
  setupUI() {
    // 创建控制面板
    const controlPanel = document.createElement('div');
    controlPanel.style.position = 'fixed';
    controlPanel.style.top = '10px';
    controlPanel.style.right = '10px';
    controlPanel.style.padding = '10px';
    controlPanel.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    controlPanel.style.borderRadius = '5px';
    controlPanel.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
    controlPanel.style.zIndex = '1000';
    
    // 添加标题
    const title = document.createElement('h3');
    title.textContent = 'Flappy Bird 测试';
    title.style.margin = '0 0 10px 0';
    controlPanel.appendChild(title);
    
    // 添加开始/停止按钮
    const startStopButton = document.createElement('button');
    startStopButton.textContent = '开始测试';
    startStopButton.style.padding = '5px 10px';
    startStopButton.style.marginRight = '5px';
    startStopButton.addEventListener('click', () => {
      if (this.testRunning) {
        this.stopTest();
        startStopButton.textContent = '开始测试';
      } else {
        this.runTest();
        startStopButton.textContent = '停止测试';
      }
    });
    controlPanel.appendChild(startStopButton);
    
    // 添加状态显示
    const statusDiv = document.createElement('div');
    statusDiv.id = 'test-status';
    statusDiv.style.marginTop = '10px';
    statusDiv.style.fontSize = '14px';
    statusDiv.innerHTML = '状态: 就绪<br>帧数: 0<br>总奖励: 0';
    controlPanel.appendChild(statusDiv);
    
    // 添加日志区域
    const logDiv = document.createElement('div');
    logDiv.id = 'test-log';
    logDiv.style.marginTop = '10px';
    logDiv.style.maxHeight = '200px';
    logDiv.style.overflowY = 'auto';
    logDiv.style.border = '1px solid #ccc';
    logDiv.style.padding = '5px';
    logDiv.style.fontSize = '12px';
    logDiv.style.fontFamily = 'monospace';
    controlPanel.appendChild(logDiv);
    
    // 添加到文档
    document.body.appendChild(controlPanel);
  }
  
  /**
   * 更新UI状态
   */
  updateUI() {
    const statusDiv = document.getElementById('test-status');
    if (statusDiv) {
      statusDiv.innerHTML = `
        状态: ${this.testRunning ? '运行中' : '已停止'}<br>
        帧数: ${this.frameCount}<br>
        总奖励: ${this.totalReward.toFixed(2)}<br>
        动作统计: 不动=${this.actionCounts[0]}, 跳跃=${this.actionCounts[1]}
      `;
    }
  }
  
  /**
   * 添加日志
   */
  log(message) {
    console.log(message); // 输出到浏览器控制台
    
    // 同时更新UI日志
    const logDiv = document.getElementById('test-log');
    if (logDiv) {
      const logEntry = document.createElement('div');
      logEntry.textContent = message;
      logDiv.appendChild(logEntry);
      logDiv.scrollTop = logDiv.scrollHeight; // 滚动到底部
    }
  }
  
  /**
   * 开始测试
   */
  runTest() {
    if (this.testRunning) return;
    
    this.log('开始测试...');
    
    // 重置环境和测试状态
    const { observation, info } = this.env.reset();
    this.frameCount = 0;
    this.totalReward = 0;
    this.actionCounts = { 0: 0, 1: 0, 2: 0 };
    
    this.log(`初始状态: ${JSON.stringify(observation)}`);
    this.testRunning = true;
    
    // 开始测试循环
    this.lastTime = performance.now();
    requestAnimationFrame(this.testLoop);
  }
  
  /**
   * 测试循环
   */
  testLoop(currentTime) {
    if (!this.testRunning) return;
    
    const deltaTime = currentTime - this.lastTime;
    
    if (deltaTime >= this.testConfig.frameInterval) {
      this.lastTime = currentTime - (deltaTime % this.testConfig.frameInterval);
      
      // 随机选择动作 (0: 不动, 1: 跳跃)
      const actionIndex = Math.floor(Math.random() * this.testConfig.actionSpace.length);
      const action = this.testConfig.actionSpace[actionIndex];
      
      // 执行动作
      const { observation, reward, terminated, truncated, info } = this.env.step(action);
      
      // 更新统计
      this.frameCount++;
      this.totalReward += reward;
      this.actionCounts[action]++;
      
      // 记录日志
      this.log(`帧 ${this.frameCount}: 动作=${action}, 奖励=${reward.toFixed(2)}, 分数=${info.score}`);
      
      // 更新UI
      this.updateUI();
      
      // 检查是否结束
      if (terminated) {
        this.log(`测试结束! 总帧数: ${this.frameCount}, 总奖励: ${this.totalReward.toFixed(2)}, 最终分数: ${info.score}`);
        this.testRunning = false;
        return;
      }
    }
    
    requestAnimationFrame(this.testLoop);
  }
  
  /**
   * 停止测试
   */
  stopTest() {
    if (!this.testRunning) return;
    
    this.log('测试已手动停止');
    this.testRunning = false;
    this.updateUI();
  }
}

// 当文档加载完成后创建测试实例
document.addEventListener('DOMContentLoaded', () => {
  const tester = new FlappyBirdTester();
  
  // 将测试实例暴露到全局，方便在控制台调试
  window.flappyTester = tester;
  
  console.log('Flappy Bird 测试已准备就绪。在控制台中，您可以使用 window.flappyTester 来访问测试实例。');
});

// 导出测试类
export default FlappyBirdTester; 