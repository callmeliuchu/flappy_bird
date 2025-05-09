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
    this.options = {
      width: options.width || 288,
      height: options.height || 512,
      renderMode: options.renderMode || 'none', // 'none', 'human'
      parentElement: options.parentElement || document.body,
      ...options
    };
    
    // 渲染相关
    this.canvas = null;
    this.ctx = null;
    
    // 资源加载
    this.images = {
      bird: null,
      background: null,
      pipe: null
    };
    
    // 如果需要渲染，则创建画布
    if (this.options.renderMode === 'human') {
      this._setupCanvas();
      this._loadImages();
    }
  }
  
  /**
   * 设置画布
   * @private
   */
  _setupCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
    this.ctx = this.canvas.getContext('2d');
    
    // 添加到指定元素或文档中
    this.options.parentElement.appendChild(this.canvas);
  }
  
  /**
   * 加载游戏图片资源
   * @private
   */
  _loadImages() {
    const birdImg = new Image();
    birdImg.src = 'assets/bird.png';
    this.images.bird = birdImg;
    
    const bgImg = new Image();
    bgImg.src = 'assets/background.png';
    this.images.background = bgImg;
    
    const pipeImg = new Image();
    pipeImg.src = 'assets/pipe.png';
    this.images.pipe = pipeImg;
  }
  
  /**
   * 渲染游戏状态
   * @param {Object} gameState - 游戏状态对象
   */
  render(gameState) {
    if (!this.ctx || this.options.renderMode !== 'human') return;
    
    const { bird, pipes, score, gameOver } = gameState;
    
    // 清除画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制背景
    this._renderBackground();
    
    // 绘制管道
    this._renderPipes(pipes);
    
    // 绘制鸟
    this._renderBird(bird);
    
    // 绘制分数
    this._renderScore(score);
    
    // 如果游戏结束，显示游戏结束信息
    if (gameOver) {
      this._renderGameOver(score);
    }
  }
  
  /**
   * 绘制背景
   * @private
   */
  _renderBackground() {
    if (this.images.background && this.images.background.complete && this.images.background.naturalHeight !== 0) {
      this.ctx.drawImage(this.images.background, 0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.fillStyle = '#70c5ce';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
  
  /**
   * 绘制管道
   * @param {Array} pipes - 管道数组
   * @private
   */
  _renderPipes(pipes) {
    for (const pipe of pipes) {
      if (this.images.pipe && this.images.pipe.complete && this.images.pipe.naturalHeight !== 0) {
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
  }
  
  /**
   * 绘制鸟
   * @param {Object} bird - 鸟对象
   * @private
   */
  _renderBird(bird) {
    if (this.images.bird && this.images.bird.complete && this.images.bird.naturalHeight !== 0) {
      this.ctx.drawImage(
        this.images.bird,
        bird.x,
        bird.y,
        bird.width,
        bird.height
      );
    } else {
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
    }
  }
  
  /**
   * 绘制分数
   * @param {Number} score - 当前分数
   * @private
   */
  _renderScore(score) {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '24px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${score}`, 10, 30);
  }
  
  /**
   * 绘制游戏结束信息
   * @param {Number} score - 最终分数
   * @private
   */
  _renderGameOver(score) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Score: ${score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
  }
  
  /**
   * 关闭渲染器
   */
  close() {
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    
    this.canvas = null;
    this.ctx = null;
  }
  
  /**
   * 获取当前渲染模式
   * @returns {String} 渲染模式
   */
  getRenderMode() {
    return this.options.renderMode;
  }
}