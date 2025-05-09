/**
 * Flappy Bird Environment for JavaScript
 * 模仿 Gymnasium 接口的 Flappy Bird 环境
 * 专注于物理和游戏逻辑，渲染逻辑已分离到 render.js
 */
import FlappyBirdRenderer from './render.js';

class FlappyBirdEnv {
  constructor(options = {}) {
    // 默认配置
    this.options = {
      renderMode: options.renderMode || 'none', // 'none', 'human'
      useLidar: options.useLidar !== undefined ? options.useLidar : false,
      width: options.width || 288,
      height: options.height || 512,
      pipeGap: options.pipeGap || 100,
      gravity: options.gravity || 1,
      birdVelocity: options.birdVelocity || -10,
      pipeSpeed: options.pipeSpeed || 2,
      fps: options.fps || 30
    };

    // 游戏状态
    this.bird = {
      x: 50,
      y: this.options.height / 2,
      width: 34,
      height: 24,
      velocity: 0
    };

    this.pipes = [];
    this.score = 0;
    this.gameOver = false;
    this.frames = 0;
    
    // 创建渲染器
    this.renderer = new FlappyBirdRenderer({
      width: this.options.width,
      height: this.options.height,
      renderMode: this.options.renderMode,
      parentElement: options.parentElement || document.body
    });
  }
  
  /**
   * 重置环境
   * @returns {Object} 包含观察和信息的对象
   */
  reset() {
    // 重置游戏状态
    this.bird = {
      x: 50,
      y: this.options.height / 2,
      width: 34,
      height: 24,
      velocity: 0
    };
    
    this.pipes = [];
    this.score = 0;
    this.gameOver = false;
    this.frames = 0;
    
    // 添加初始管道
    this._addPipe();
    
    // 获取初始观察
    const observation = this._getObservation();
    const info = this._getInfo();
    
    // 渲染初始状态
    this._updateRenderer();
    
    return { observation, info };
  }
  
  /**
   * 执行动作
   * @param {Number} action - 0: 不动, 1: 跳跃, 2: 向下加速
   * @returns {Object} 包含观察、奖励、终止标志、截断标志和信息的对象
   */
  step(action) {
    this.frames += 1;
    
    // 默认施加重力
    this.bird.velocity += this.options.gravity;
    
    if (action === 1) { // 动作 1: 跳跃
      this.bird.velocity = this.options.birdVelocity; // 设置为向上的速度
    } else if (action === 2) { // 动作 2: 向下加速
      // 额外施加向下的力，使其下落更快或更快停止上升
      // 例如，额外增加 1.5 倍的重力效果
      this.bird.velocity += this.options.gravity * 1.5; 
    }
    
    this.bird.y += this.bird.velocity;
    
    // 每隔一定帧数添加新管道
    if (this.frames % 100 === 0) {
      this._addPipe();
    }
    
    // 更新管道位置
    this._updatePipes();
    
    // 检查碰撞
    const collision = this._checkCollision();
    
    // 计算奖励
    let reward = 0.1; // 存活奖励
    
    // 通过管道获得额外奖励
    for (const pipe of this.pipes) {
      if (pipe.x + pipe.width < this.bird.x && !pipe.passed) {
        pipe.passed = true;
        this.score += 1;
        reward += 1.0;
      }
    }
    
    // 如果碰撞，给予负奖励并结束游戏
    if (collision) {
      reward = -1.0;
      this.gameOver = true;
    }
    
    // 更新渲染器
    this._updateRenderer();
    
    // 获取观察和信息
    const observation = this._getObservation();
    const info = this._getInfo();
    
    return {
      observation,
      reward,
      terminated: this.gameOver,
      truncated: false,
      info
    };
  }
  
  /**
   * 添加新管道
   * @private
   */
  _addPipe() {
    const pipeWidth = 52;
    const minHeight = 50;
    const maxHeight = this.options.height - this.options.pipeGap - minHeight;
    const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    
    this.pipes.push({
      x: this.options.width,
      y: 0,
      width: pipeWidth,
      height: height,
      passed: false
    });
    
    this.pipes.push({
      x: this.options.width,
      y: height + this.options.pipeGap,
      width: pipeWidth,
      height: this.options.height - height - this.options.pipeGap,
      passed: false
    });
  }
  
  /**
   * 更新管道位置
   * @private
   */
  _updatePipes() {
    for (let i = 0; i < this.pipes.length; i++) {
      this.pipes[i].x -= this.options.pipeSpeed;
    }
    
    // 移除已经移出屏幕的管道
    this.pipes = this.pipes.filter(pipe => pipe.x + pipe.width > 0);
  }
  
  /**
   * 检查碰撞
   * @returns {Boolean} 是否发生碰撞
   * @private
   */
  _checkCollision() {
    // 检查是否撞到地面或天花板
    if (this.bird.y <= 0 || this.bird.y + this.bird.height >= this.options.height) {
      return true;
    }
    
    // 检查是否撞到管道
    for (const pipe of this.pipes) {
      if (
        this.bird.x < pipe.x + pipe.width &&
        this.bird.x + this.bird.width > pipe.x &&
        this.bird.y < pipe.y + pipe.height &&
        this.bird.y + this.bird.height > pipe.y
      ) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * 获取观察
   * @returns {Object} 观察对象
   * @private
   */
  _getObservation() {
    // 基本观察：鸟的位置、速度和最近管道的位置
    const observation = {
      birdY: this.bird.y / this.options.height, // 归一化的鸟的高度
      birdVelocity: this.bird.velocity / 10, // 归一化的鸟的速度
    };
    
    // 找到最近的管道（在鸟的右侧）
    const nextPipe = this.pipes.find(pipe => pipe.x + pipe.width > this.bird.x);
    
    if (nextPipe) {
      observation.pipeX = (nextPipe.x - this.bird.x) / this.options.width;
      observation.pipeTopY = nextPipe.height / this.options.height;
      observation.pipeBottomY = (nextPipe.y + nextPipe.height) / this.options.height;
    } else {
      observation.pipeX = 1.0;
      observation.pipeTopY = 0.5;
      observation.pipeBottomY = 0.5;
    }
    
    // 如果使用激光雷达，添加更多观察
    if (this.options.useLidar) {
      observation.lidarReadings = this._getLidarReadings();
    }
    
    return observation;
  }
  
  /**
   * 获取激光雷达读数（如果启用）
   * @returns {Array} 激光雷达读数数组
   * @private
   */
  _getLidarReadings() {
    const readings = [];
    const numRays = 8;
    const maxDistance = Math.sqrt(this.options.width * this.options.width + this.options.height * this.options.height);
    
    for (let i = 0; i < numRays; i++) {
      const angle = (i / numRays) * 2 * Math.PI;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      
      let distance = maxDistance;
      
      // 检查与管道的交点
      for (const pipe of this.pipes) {
        // 简化的射线-矩形相交检测
        // 这里只是一个简化版本，实际应用中可能需要更复杂的算法
        const rayDistance = this._rayRectIntersection(
          this.bird.x + this.bird.width / 2,
          this.bird.y + this.bird.height / 2,
          dx, dy, pipe.x, pipe.y, pipe.width, pipe.height
        );
        
        if (rayDistance < distance) {
          distance = rayDistance;
        }
      }
      
      // 归一化距离
      readings.push(distance / maxDistance);
    }
    
    return readings;
  }
  
  /**
   * 射线与矩形相交检测
   * @returns {Number} 相交距离，如果不相交则返回Infinity
   * @private
   */
  _rayRectIntersection(rayOriginX, rayOriginY, rayDirX, rayDirY, rectX, rectY, rectWidth, rectHeight) {
    // 简化的实现，实际应用中可能需要更精确的算法
    const minDistance = Infinity;
    
    // 这里应该有详细的射线-矩形相交检测算法
    // 为简化起见，返回一个估计值
    
    return minDistance;
  }
  
  /**
   * 获取额外信息
   * @returns {Object} 信息对象
   * @private
   */
  _getInfo() {
    return {
      score: this.score,
      frames: this.frames
    };
  }
  
  /**
   * 更新渲染器
   * @private
   */
  _updateRenderer() {
    // 只有在渲染模式为 'human' 时才渲染
    if (this.renderer.getRenderMode() === 'human') {
      // 创建游戏状态对象传递给渲染器
      const gameState = {
        bird: this.bird,
        pipes: this.pipes,
        score: this.score,
        gameOver: this.gameOver
      };
      
      // 调用渲染器的渲染方法
      this.renderer.render(gameState);
    }
  }
  
  /**
   * 关闭环境
   */
  close() {
    // 关闭渲染器
    this.renderer.close();
  }
}

// 导出环境
export default FlappyBirdEnv; 