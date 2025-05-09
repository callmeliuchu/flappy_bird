/**
 * Flappy Bird Environment for JavaScript
 * 模仿 Gymnasium 接口的 Flappy Bird 环境
 */
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
    
    // 渲染相关
    this.canvas = null;
    this.ctx = null;
    
    // 如果需要渲染，则创建画布
    if (this.options.renderMode === 'human') {
      this._setupCanvas();
    }
    
    // 资源加载
    this.images = {
      bird: null,
      background: null,
      pipe: null
    };
    
    this._loadImages();
  }
  
  /**
   * 设置画布
   */
  _setupCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
    this.ctx = this.canvas.getContext('2d');
    
    // 添加到文档中
    document.body.appendChild(this.canvas);
  }
  
  /**
   * 加载游戏图片资源
   */
  _loadImages() {
    const birdImg = new Image();
    birdImg.src = 'assets/bird.png'; // 假设有这个资源路径
    this.images.bird = birdImg;
    
    const bgImg = new Image();
    bgImg.src = 'assets/background.png';
    this.images.background = bgImg;
    
    const pipeImg = new Image();
    pipeImg.src = 'assets/pipe.png';
    this.images.pipe = pipeImg;
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
    
    return { observation, info };
  }
  
  /**
   * 执行动作
   * @param {Number} action - 0: 不动, 1: 跳跃
   * @returns {Object} 包含观察、奖励、终止标志、截断标志和信息的对象
   */
  step(action) {
    this.frames += 1;
    
    // 更新鸟的位置
    this.bird.velocity += this.options.gravity;
    
    if (action === 1) {
      this.bird.velocity = this.options.birdVelocity;
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
    
    // 如果启用了渲染，则渲染游戏
    if (this.options.renderMode === 'human') {
      this._render();
    }
    
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
   * @returns {Array} 观察数组
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
   */
  _getInfo() {
    return {
      score: this.score,
      frames: this.frames
    };
  }
  
  /**
   * 渲染游戏
   */
  _render() {
    if (!this.ctx) return;
    
    // 清除画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制背景
    if (this.images.background) {
      this.ctx.drawImage(this.images.background, 0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.fillStyle = '#70c5ce';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // 绘制管道
    for (const pipe of this.pipes) {
      if (this.images.pipe) {
        // 上管道（翻转）
        if (pipe.y === 0) {
          this.ctx.save();
          this.ctx.translate(pipe.x + pipe.width / 2, pipe.y + pipe.height / 2);
          this.ctx.rotate(Math.PI);
          this.ctx.drawImage(
            this.images.pipe,
            -pipe.width / 2,
            -pipe.height / 2,
            pipe.width,
            pipe.height
          );
          this.ctx.restore();
        } else {
          // 下管道
          this.ctx.drawImage(this.images.pipe, pipe.x, pipe.y, pipe.width, pipe.height);
        }
      } else {
        this.ctx.fillStyle = '#558022';
        this.ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
      }
    }
    
    // 绘制鸟
    if (this.images.bird) {
      this.ctx.drawImage(
        this.images.bird,
        this.bird.x,
        this.bird.y,
        this.bird.width,
        this.bird.height
      );
    } else {
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillRect(this.bird.x, this.bird.y, this.bird.width, this.bird.height);
    }
    
    // 绘制分数
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 10, 30);
    
    // 如果游戏结束，显示游戏结束信息
    if (this.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '36px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.font = '24px Arial';
      this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
  }
  
  /**
   * 关闭环境
   */
  close() {
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    
    this.canvas = null;
    this.ctx = null;
  }
}

// 导出环境
export default FlappyBirdEnv; 