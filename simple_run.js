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

// 删除 import 语句
// import FlappyBirdEnv from './env.js';
// import {Network,Network2} from './network.js';

// 确保 FlappyBirdEnv 已经在全局作用域中定义
if (typeof FlappyBirdEnv === 'undefined') {
    console.error('FlappyBirdEnv 未定义！请确保 env.js 已正确加载。');
}

// 创建环境实例 (renderMode 设为 'none' 以避免渲染)
const env = new FlappyBirdEnv({ renderMode: 'none' });



function sampleAction(probs) {
    // 生成一个0到1之间的随机数
    const r = Math.random();
    
    // 计算累积概率并找到第一个累积概率大于等于r的索引
    let cumulativeProb = 0;
    for (let i = 0; i < probs.length; i++) {
        cumulativeProb += probs[i];
        if (r <= cumulativeProb) {
            return i;
        }
    }
    
    // 如果由于浮点数精度问题没有返回，则返回最后一个索引
    return probs.length - 1;
}

// let n_states = 8;
// let n_actions = 4;

function discount_rewards(rewards,gamma){
    let res = [];
    let adding = 0;
    for(let i=rewards.length-1;i>=0;i--){
        adding = rewards[i] + gamma * adding;
        res.push(adding);
    }
    res = res.reverse();
    // mean std
    let mean = res.reduce((a,b)=>a+b,0)/res.length;
    let std = Math.sqrt(res.reduce((a,b)=>a+Math.pow(b-mean,2),0)/res.length);
    res = res.map(x=>x/(std+1e-15));
    return res; 
}


function mean_square_error(y,y_hat){
    let res = 0;
    for(let i = 0; i < y.length; i++){
        res += (y[i] - y_hat[i]) ** 2;
    }
    return res / y.length;
}

function mean_square_error_derive(y,y_hat){
    let res = [];
    for(let i = 0; i < y.length; i++){
        res.push(2 * (-y[i] + y_hat[i]));
    }
    return res;
}


function cross_entropy(probs,ys){
    let res = 0;
    for(let i = 0; i < probs.length; i++){
        res -= Math.log(Math.max(probs[i], 1e-15)) * ys[i];
    }
    return res;
}

function cross_entropy_derive(probs,ys){
    let res = [];
    for(let i = 0; i < probs.length; i++){
        res.push(-ys[i] /(probs[i]+1e-15));
    }
    return res;
}

class Agent{
    constructor(n_states,n_actions){
        this.policy_net = new Network(n_states, 200, n_actions);
        this.value_net = new Network2(n_states, 200, 1);

        this.n_states = n_states;
        this.n_actions = n_actions;
        this.random_eplisio = 0.0;
        this.update_count = 0;
    }
    get_max_prob_action(state){
        let state_arr = [];
        for(let i=0;i<this.n_states;i++){
            if(i == state){
                state_arr.push(1);
            }else{
                state_arr.push(0);
            }
        }
        let [h, h_relu, out, out_softmax] = this.policy_net.forward(state_arr); // 4
        let max_prob = Math.max(...out_softmax);
        let max_prob_action = out_softmax.indexOf(max_prob);
        return max_prob_action;
    }
    get_action(state){
        let [h, h_relu, out, out_softmax] = this.policy_net.forward(state); // 4
        // console.log(state_arr,out_softmax);
        // 采样动作，javascript没有np.random.choice，根据probs 概率采样，概率大的采样概率大
        let action;
        if(Math.random() < this.random_eplisio){
            action = Math.floor(Math.random() * (this.n_actions));
            // console.log('随机动作',action);
        }else{
            action = sampleAction(out_softmax);
            // console.log('抽样动作',action);
        }
        return [state, h, h_relu, out, out_softmax,action];
    }
    update(rewards,agent_outputs){
        // let dW1,dW2 = this.policy_net.grad(states,actions,rewards,probs);
        // this.policy_net.backward(dW1,dW2,lr);
        rewards = discount_rewards(rewards,0.99);
        this.update_count++;

        let values_dw = [];
        for(let i=0;i<rewards.length;i++){
            let reward = rewards[i]; // 1
            let [state_arr, h, h_relu, out, out_softmax,action] = agent_outputs[i]; // [h, h_relu, out, out_softmax,action]
            let [value_h, value_h_relu, value_out] = this.value_net.forward(state_arr); // 1
            let mse = mean_square_error([reward],value_out);
            // console.log('mse',mse,reward,value_out);
            let value_dout = mean_square_error_derive([reward],value_out);
            let [value_dW1,value_dW2] = this.value_net.grad(state_arr,value_h,value_h_relu,value_dout);
            values_dw.push([value_dW1,value_dW2]);
            
            let rs =  [];
            for(let k=0;k<this.n_actions;k++){
                if(k == action){
                    rs.push(reward-value_out[0]);
                }else{
                    rs.push(0);
                }
            }

            let entropy = cross_entropy(out_softmax,rs);
            console.log('entropy',entropy);
            let dout = cross_entropy_derive(out_softmax,rs);
            // console.log(dout);
            // console.log(out_softmax);
            // console.log(rs);
            let [dW1,dW2] = this.policy_net.grad(state_arr,h,h_relu,out,out_softmax,dout);
            // console.log('dw1',dW1)
            // console.log('dw2',dW2)
            this.policy_net.backward(dW1,dW2,0.01/rewards.length);
        }
        for(let e=0;e<4;e++){
            for(let i=0;i<values_dw.length;i++){
                this.value_net.backward(values_dw[i][0],values_dw[i][1],0.01/rewards.length);
            }
        }




        // if(this.update_count < maxEpochs * 0.2){
        //     this.random_eplisio = 0.5;
        // }else{
        //     this.random_eplisio = Math.max(this.random_eplisio * 0.995,0.05);
        // }
        // this.random_eplisio = 0.0;
        // console.log('random_eplisio',this.random_eplisio);

        }
}



// 重置环境 (对应 env.reset() 和 state,_ = env.reset())
env.reset();
const { observation } = env.reset();

console.log('初始状态:', observation);

let agent = new Agent(5, 2);

for(let epoch=0;epoch<10000;epoch++){
    let rewards = [];
    let agent_outputs = [];
    let {observation:state,info} = env.reset();
    // {birdY: 0.1640625, birdVelocity: -1, pipeX: 0.6527777777777778, pipeTopY: 0.669921875, pipeBottomY: 0.669921875}
    console.log('state',state);
    let total_reward = 0;
    while(1){
        state = [state.birdY,state.birdVelocity,state.pipeX,state.pipeTopY,state.pipeBottomY];
        let [state1, h, h_relu, out, out_softmax,action] = agent.get_action(state);
        let { observation: nextState, reward, terminated, truncated } = env.step(action);
        total_reward += reward;
        rewards.push(reward);
        agent_outputs.push([state1, h, h_relu, out, out_softmax,action]);
        state = nextState;
        if(terminated || truncated){
            break;
        }
    }
    agent.update(rewards,agent_outputs);
    console.log('rewards1111',total_reward);
}


// // 模拟游戏循环 (对应 while not done:)
// function runSimulation() {
//   let done = false;
//   let steps = 0;
//   const maxSteps = 1000; // 防止无限循环
  
//   while (!done && steps < maxSteps) {
//     // 随机选择动作 (0 或 1) - 对应 action = int(np.random.choice([0,1]))
//     const action = Math.floor(Math.random() * 2);
    
//     // 执行动作 - 对应 next_state, reward, done, truncated, _ = env.step(action)
//     const { observation: nextState, reward, terminated, truncated } = env.step(action);
    
//     // 输出动作和奖励 - 对应 print(action,reward)
//     console.log(action, reward, nextState);
    
//     // 更新循环条件
//     done = terminated;
//     steps++;
//   }
  
//   console.log('模拟结束，总步数:', steps);
// }

// // 运行模拟
// runSimulation(); 