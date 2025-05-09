/**
 * Flappy Bird 渲染器
 * 负责游戏的可视化展示，与游戏逻辑分离
 */
class FlappyBirdRenderer {
  /**
   * 构造函数
   * @param {Object} options - 渲染选项
   */
  constructor(options = {}) {
    this.width = options.width || 288;
    this.height = options.height || 512;
    this.renderMode = options.renderMode || 'none';
    
    // 创建画布
    if (this.renderMode === 'human') {
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.ctx = this.canvas.getContext('2d', { alpha: false }); // 禁用 alpha 通道以提高性能
      
      // 优化渲染性能的设置
      this.ctx.imageSmoothingEnabled = false; // 禁用图像平滑处理
      
      // 添加到父元素
      const parentElement = options.parentElement || document.body;
      parentElement.appendChild(this.canvas);
      
      // 加载图像
      this.loadImages();
    }
    
    // 设置更高的帧率
    this.fps = options.fps || 60; // 默认提高到60fps
    
    // 减少渲染细节的标志
    this.lowDetailMode = options.lowDetailMode || false;
  }
  
  /**
   * 加载游戏图片资源
   * @private
   */
  loadImages() {
    // 加载背景图像
    this.bgImage = new Image();
    this.bgImage.src = 'assets/background.png';
    
    // 加载鸟图像
    this.birdImage = new Image();
    this.birdImage.src = 'assets/bird.png';
    
    // 加载管道图像
    this.pipeImage = new Image();
    this.pipeImage.src = 'assets/pipe.png';
    
    // 预加载图像以提高性能
    Promise.all([
      new Promise(resolve => this.bgImage.onload = resolve),
      new Promise(resolve => this.birdImage.onload = resolve),
      new Promise(resolve => this.pipeImage.onload = resolve)
    ]).then(() => {
      // 图像加载完成，可以开始渲染
      this.imagesLoaded = true;
      
      // 创建离屏缓冲区以提高性能
      this.createOffscreenBuffers();
    });
  }
  
  createOffscreenBuffers() {
    // 创建背景缓冲区
    this.bgBuffer = document.createElement('canvas');
    this.bgBuffer.width = this.width;
    this.bgBuffer.height = this.height;
    const bgCtx = this.bgBuffer.getContext('2d');
    bgCtx.drawImage(this.bgImage, 0, 0, this.width, this.height);
    
    // 创建管道缓冲区
    this.pipeBuffer = document.createElement('canvas');
    this.pipeBuffer.width = 52; // 管道宽度
    this.pipeBuffer.height = this.height;
    const pipeCtx = this.pipeBuffer.getContext('2d');
    pipeCtx.drawImage(this.pipeImage, 0, 0, 52, this.height);
  }
  
  /**
   * 渲染游戏状态
   * @param {Object} gameState - 游戏状态对象
   */
  render(gameState) {
    if (this.renderMode !== 'human' || !this.ctx || !this.imagesLoaded) {
      return;
    }
    
    // 清除画布 - 使用填充而不是clearRect以提高性能
    this.ctx.fillStyle = '#70c5ce';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // 在低细节模式下跳过背景渲染
    if (!this.lowDetailMode) {
      // 绘制背景
      if (this.bgBuffer) {
        this.ctx.drawImage(this.bgBuffer, 0, 0);
      } else {
        this.ctx.drawImage(this.bgImage, 0, 0, this.width, this.height);
      }
    }
    
    // 绘制管道
    for (const pipe of gameState.pipes) {
      if (this.pipeBuffer && !this.lowDetailMode) {
        // 使用缓冲的管道图像
        this.ctx.drawImage(
          this.pipeBuffer,
          0, 0, pipe.width, pipe.height,
          pipe.x, pipe.y, pipe.width, pipe.height
        );
      } else {
        // 简化的管道渲染 - 仅使用矩形
        this.ctx.fillStyle = '#558022';
        this.ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
      }
    }
    
    // 绘制鸟
    if (this.lowDetailMode) {
      // 简化的鸟渲染 - 使用圆形
      this.ctx.fillStyle = '#ff0000';
      this.ctx.beginPath();
      this.ctx.arc(
        gameState.bird.x + gameState.bird.width / 2,
        gameState.bird.y + gameState.bird.height / 2,
        gameState.bird.width / 2,
        0, 2 * Math.PI
      );
      this.ctx.fill();
    } else {
      // 正常鸟渲染
      this.ctx.drawImage(
        this.birdImage,
        gameState.bird.x, gameState.bird.y,
        gameState.bird.width, gameState.bird.height
      );
    }
    
    // 绘制分数
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Score: ${gameState.score}`, 10, 30);
    
    // 如果游戏结束，显示游戏结束消息
    if (gameState.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '36px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Game Over', this.width / 2, this.height / 2);
      this.ctx.font = '24px Arial';
      this.ctx.fillText(`Score: ${gameState.score}`, this.width / 2, this.height / 2 + 40);
      this.ctx.textAlign = 'left';
    }
  }
  
  /**
   * 设置渲染模式
   * @param {String} mode - 渲染模式
   */
  setRenderMode(mode) {
    this.renderMode = mode;
  }
  
  /**
   * 获取当前渲染模式
   * @returns {String} 渲染模式
   */
  getRenderMode() {
    return this.renderMode;
  }
  
  /**
   * 设置低细节模式
   * @param {Boolean} enabled - 是否启用低细节模式
   */
  setLowDetailMode(enabled) {
    this.lowDetailMode = enabled;
  }
  
  /**
   * 关闭渲染器
   */
  close() {
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}