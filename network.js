function multiply(W, x) {
    // W is a matrix of weights
    // x is a vector of inputs
    // return a vector of outputs
    let res = [];
    for (let i = 0; i < W.length; i++) {
        let sum = 0;
        for(let j = 0; j < x.length; j++){
            sum += W[i][j] * x[j];
        }
        res.push(sum);
    }
    return res;
}

function multiply_derive(W, x, dout) {
    // W is a matrix of weights
    // x is a vector of inputs
    // dout is a vector of derivatives of the output
    // return a vector of derivatives of the input and a matrix of derivatives of weights
    let dx = new Array(x.length).fill(0);  // 修改为一维数组
    let dW = [];
    
    // 计算dx (一维数组)
    for (let i = 0; i < x.length; i++) {
        for (let j = 0; j < W.length; j++) {
            dx[i] += W[j][i] * dout[j];
        }
    }
    
    // 计算dW (二维数组)
    for (let i = 0; i < W.length; i++) {
        let dWi = [];
        for (let j = 0; j < x.length; j++) {
            dWi.push(x[j] * dout[i]);
        }
        dW.push(dWi);
    }
    
    return [dx, dW];
}


function relu(x){
    // leaky relu
    // x is a vector of inputs
    let res = [];
    for(let i = 0; i < x.length; i++){
        res.push(Math.max(0.01*x[i], x[i]));
    }
    return res;
}

function relu_derive(x,dout){
    // leaky relu
    let res = [];
    for(let i = 0; i < x.length; i++){
        res.push(x[i] > 0 ? dout[i] : 0.01*dout[i]);
    }
    return res;
}

function softmax(x){
    let res = [];
    let _max = Math.max(...x);
    for(let i = 0; i < x.length; i++){
        res.push(Math.exp(x[i] - _max));
    }
    let _sum = res.reduce((a, b) => a + b, 0);
    for(let i = 0; i < res.length; i++){
        res[i] = res[i] / _sum;
    }
    return res;
}

function softmax_derive(x,out,dout){
    let res = [];
    for(let i = 0; i < x.length; i++){
        let _sum = 0;
        for(let j = 0; j < x.length; j++){
            _sum += dout[j] * (i == j ? (1 - out[i])*out[i] : -out[i]*out[j]);
        }
        res.push(_sum);
    }
    return res;
}

function update_weights(W,dW,lr){
    for(let i = 0; i < W.length; i++){
        for(let j = 0; j < W[i].length; j++){
            W[i][j] -= lr * dW[i][j];
        }
    }
    return W;
}

// 添加形状检查函数
function assert_shape(arr, expected_shape, name) {
    if (!Array.isArray(arr)) {
        console.error(`${name} is not an array`);
        return false;
    }
    
    if (expected_shape.length === 1) {
        if (arr.length !== expected_shape[0]) {
            console.error(`${name} shape mismatch: expected [${expected_shape}], got [${arr.length}]`);
            return false;
        }
    } else if (expected_shape.length === 2) {
        if (arr.length !== expected_shape[0]) {
            console.error(`${name} shape mismatch: expected [${expected_shape}], got [${arr.length}, ?]`);
            return false;
        }
        for (let i = 0; i < arr.length; i++) {
            if (!Array.isArray(arr[i]) || arr[i].length !== expected_shape[1]) {
                console.error(`${name} shape mismatch at row ${i}: expected [${expected_shape}], got [${arr.length}, ${Array.isArray(arr[i]) ? arr[i].length : '?'}]`);
                return false;
            }
        }
    }
    
    // console.log(`${name} shape check passed: [${expected_shape}]`);
    return true;
}

class Network{
    constructor(input_size, hidden_size, output_size){
        this.input_size = input_size;
        this.hidden_size = hidden_size;
        this.output_size = output_size;
        this.W1 = this.init_weights(input_size, hidden_size);
        this.W2 = this.init_weights(hidden_size, output_size);
        
        // 检查权重矩阵形状
        assert_shape(this.W1, [hidden_size, input_size], "W1");
        assert_shape(this.W2, [output_size, hidden_size], "W2");
    }

    init_weights(m,n){
        let W = [];
        for(let i = 0; i < n; i++){
            let row = [];
            for(let j = 0; j < m; j++){
                row.push(Math.random() - 0.5);
            }
            W.push(row);
        }
        return W;
    }
    forward(x){
        // 检查输入形状
        assert_shape(x, [this.input_size], "input x");
        
        let h = multiply(this.W1, x);
        // 检查h形状
        assert_shape(h, [this.hidden_size], "h");
        
        let h_relu = relu(h);
        // 检查h_relu形状
        assert_shape(h_relu, [this.hidden_size], "h_relu");
        
        let out = multiply(this.W2, h_relu);
        // 检查out形状
        assert_shape(out, [this.output_size], "out");
        
        let out_softmax = softmax(out);
        // 检查out_softmax形状
        assert_shape(out_softmax, [this.output_size], "out_softmax");
        
        return [h, h_relu, out, out_softmax];
    }
    grad(x,h,h_relu,out,out_softmax,dout){
        let softmax_dout = softmax_derive(out,out_softmax,dout);
        let [dh,dW2] = multiply_derive(this.W2,h_relu,softmax_dout);
        let dh_relu = relu_derive(h,dh);
        let [dx,dW1] = multiply_derive(this.W1,x,dh_relu);
        return [dW1,dW2];
    }

    backward(dW1,dW2, lr){
        this.W1 = update_weights(this.W1,dW1,lr);
        this.W2 = update_weights(this.W2,dW2,lr);
    }
}

class Network2{
    constructor(input_size, hidden_size, output_size){
        this.input_size = input_size;
        this.hidden_size = hidden_size;
        this.output_size = output_size;
        this.W1 = this.init_weights(input_size, hidden_size);
        this.W2 = this.init_weights(hidden_size, output_size);
        
        // 检查权重矩阵形状
        assert_shape(this.W1, [hidden_size, input_size], "W1");
        assert_shape(this.W2, [output_size, hidden_size], "W2");
    }

    init_weights(m,n){
        let W = [];
        for(let i = 0; i < n; i++){
            let row = [];
            for(let j = 0; j < m; j++){
                row.push(Math.random() - 0.5);
            }
            W.push(row);
        }
        return W;
    }
    forward(x){
        let h = multiply(this.W1, x);
        let h_relu = relu(h);
        let out = multiply(this.W2, h_relu);
        return [h, h_relu, out];
    }
    grad(x,h,h_relu,dout){
        let [dh,dW2] = multiply_derive(this.W2,h_relu,dout);
        let dh_relu = relu_derive(h,dh);
        let [dx,dW1] = multiply_derive(this.W1,x,dh_relu);
        return [dW1,dW2];
    }

    backward(dW1,dW2, lr){
        this.W1 = update_weights(this.W1,dW1,lr);
        this.W2 = update_weights(this.W2,dW2,lr);
    }
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

function test_network2(){
    let net = new Network2(3, 10, 1);
    let x = [1, 2, 3];
    let y = [1];
    let data = [
        {input: [1, 2, 3], output: [1]},
        {input: [2, 3, 4], output: [2]},
        {input: [3, 4, 5], output: [3]},
        {input: [4, 5, 6], output: [4]}
    ]
    for(let i = 0; i < 1000; i++){
        for(let j = 0; j < 4; j++){
            let [h, h_relu, out] = net.forward(data[j].input);
            let loss = mean_square_error(data[j].output,out);
            let dout = mean_square_error_derive(data[j].output,out);
            let [dW1,dW2] = net.grad(data[j].input,h,h_relu,dout);
            net.backward(dW1,dW2,0.01);
            console.log(loss);
        }
    }
}


function test_network(){
    let net = new Network(3, 4, 3);
    console.log("Network initialized with input_size=3, hidden_size=4, output_size=3");
    
    console.log("W1 shape should be [4, 3]:");
    assert_shape(net.W1, [4, 3], "W1");
    
    console.log("W2 shape should be [3, 4]:");
    assert_shape(net.W2, [3, 4], "W2");
    
    let x = [1, 2, 3];
    console.log("Input x shape should be [3]:");
    assert_shape(x, [3], "x");
    
    let [h, h_relu, out, out_softmax] = net.forward(x);
    
    console.log("h shape should be [4]:");
    assert_shape(h, [4], "h");
    
    console.log("h_relu shape should be [4]:");
    assert_shape(h_relu, [4], "h_relu");
    
    console.log("out shape should be [3]:");
    assert_shape(out, [3], "out");
    
    console.log("out_softmax shape should be [3]:");
    assert_shape(out_softmax, [3], "out_softmax");
    
    let dout = [1, 2, 3];
    console.log("dout shape should be [3]:");
    assert_shape(dout, [3], "dout");
    
    let [dW1, dW2] = net.grad(x, h, h_relu, out, out_softmax, dout);
    
    console.log("dW1 shape should be [4, 3]:");
    assert_shape(dW1, [4, 3], "dW1");
    
    console.log("dW2 shape should be [3, 4]:");
    assert_shape(dW2, [3, 4], "dW2");
    
    net.backward(dW1, dW2, 0.01);
    console.log("After backward pass:");
    
    console.log("W1 shape should be [4, 3]:");
    assert_shape(net.W1, [4, 3], "W1 after update");
    
    console.log("W2 shape should be [3, 4]:");
    assert_shape(net.W2, [3, 4], "W2 after update");
    console.log(net.W1);
    console.log(net.W2);
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

function test_xor(){
    let data = [
        {input: [0, 1], output: [1,0]},
        {input: [0.3, 0.3], output: [0,1]},
        {input: [1, 0], output: [1,0]},
        {input: [1, 1], output: [0,1]}
    ];
    let net = new Network(2, 8, 2);
    for(let j = 0; j < 500; j++){
        let total_dW1 = [];
        let total_dW2 = [];
        for(let i = 0; i < 4; i++){
            let [h, h_relu, out, out_softmax] = net.forward(data[i].input);
            let loss = cross_entropy(out_softmax,data[i].output);
            let dout = cross_entropy_derive(out_softmax,data[i].output);
            let [dW1,dW2] = net.grad(data[i].input,h,h_relu,out,out_softmax,dout);
            total_dW1.push(dW1);
            total_dW2.push(dW2);
            // net.backward(dW1,dW2,0.01);
            // console.log(dout);
            // console.log(dW1);
            // console.log(dW2);
            console.log(out_softmax,data[i].output);
            console.log(loss);
        }
        for(let i = 0; i < total_dW1.length; i++){
            net.backward(total_dW1[i],total_dW2[i],0.01);
        }
    }

}




function test_multiply() {
    console.log("\n----- 测试 multiply 函数 -----");
    
    // 测试用例1：基本矩阵乘法
    let W1 = [[1, 2], [3, 4]];
    let x1 = [1, 2];
    let expected1 = [5, 11]; // [1*1 + 2*2, 3*1 + 4*2]
    let result1 = multiply(W1, x1);
    
    console.log("测试用例1:");
    console.log("W =", W1);
    console.log("x =", x1);
    console.log("预期结果 =", expected1);
    console.log("实际结果 =", result1);
    console.log("测试结果:", arraysEqual(result1, expected1) ? "通过" : "失败");
    
    // 测试用例2：更大的矩阵
    let W2 = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
    let x2 = [2, 3, 4];
    let expected2 = [20, 47, 74]; // [1*2 + 2*3 + 3*4, 4*2 + 5*3 + 6*4, 7*2 + 8*3 + 9*4]
    let result2 = multiply(W2, x2);
    
    console.log("\n测试用例2:");
    console.log("W =", W2);
    console.log("x =", x2);
    console.log("预期结果 =", expected2);
    console.log("实际结果 =", result2);
    console.log("测试结果:", arraysEqual(result2, expected2) ? "通过" : "失败");
}

function test_multiply_derive() {
    console.log("\n----- 测试 multiply_derive 函数 -----");
    
    // 测试用例1
    let W = [[1, 2], [3, 4]];
    let x = [5, 6];
    let dout = [7, 8];
    
    let [dx, dW] = multiply_derive(W, x, dout);
    
    // 手动计算预期结果
    // dx[0] = W[0][0]*dout[0] + W[1][0]*dout[1] = 1*7 + 3*8 = 7 + 24 = 31
    // dx[1] = W[0][1]*dout[0] + W[1][1]*dout[1] = 2*7 + 4*8 = 14 + 32 = 46
    let expected_dx = [31, 46];
    
    // dW[0][0] = x[0]*dout[0] = 5*7 = 35
    // dW[0][1] = x[1]*dout[0] = 6*7 = 42
    // dW[1][0] = x[0]*dout[1] = 5*8 = 40
    // dW[1][1] = x[1]*dout[1] = 6*8 = 48
    let expected_dW = [[35, 42], [40, 48]];
    
    console.log("测试用例1:");
    console.log("W =", W);
    console.log("x =", x);
    console.log("dout =", dout);
    console.log("预期 dx =", expected_dx);
    console.log("实际 dx =", dx);
    console.log("dx 测试结果:", arraysEqual(dx, expected_dx) ? "通过" : "失败");
    
    console.log("预期 dW =", expected_dW);
    console.log("实际 dW =", dW);
    console.log("dW 测试结果:", arraysEqual2D(dW, expected_dW) ? "通过" : "失败");
}

function test_relu() {
    console.log("\n----- 测试 relu 函数 -----");
    
    // 测试用例
    let x = [-2, -1, 0, 1, 2];
    let expected = [0, 0, 0, 1, 2];
    let result = relu(x);
    
    console.log("x =", x);
    console.log("预期结果 =", expected);
    console.log("实际结果 =", result);
    console.log("测试结果:", arraysEqual(result, expected) ? "通过" : "失败");
}

function test_relu_derive() {
    console.log("\n----- 测试 relu_derive 函数 -----");
    
    // 测试用例
    let x = [-1, 0, 1, 2];
    let dout = [5, 6, 7, 8];
    let expected = [0, 0, 7, 8]; // 只有x>0的位置会保留dout的值
    let result = relu_derive(x, dout);
    
    console.log("x =", x);
    console.log("dout =", dout);
    console.log("预期结果 =", expected);
    console.log("实际结果 =", result);
    console.log("测试结果:", arraysEqual(result, expected) ? "通过" : "失败");
}

function test_softmax() {
    console.log("\n----- 测试 softmax 函数 -----");
    
    // 测试用例1：简单向量
    let x1 = [1, 2, 3];
    let result1 = softmax(x1);
    
    // 手动计算预期结果
    let sum1 = Math.exp(1) + Math.exp(2) + Math.exp(3);
    let expected1 = [Math.exp(1)/sum1, Math.exp(2)/sum1, Math.exp(3)/sum1];
    
    console.log("测试用例1:");
    console.log("x =", x1);
    console.log("预期结果 ≈", expected1.map(v => v.toFixed(6)));
    console.log("实际结果 ≈", result1.map(v => v.toFixed(6)));
    console.log("和为1检查:", Math.abs(result1.reduce((a, b) => a + b, 0) - 1) < 1e-10 ? "通过" : "失败");
    console.log("测试结果:", arraysApproxEqual(result1, expected1, 1e-10) ? "通过" : "失败");
    
    // 测试用例2：包含大数字（检查数值稳定性）
    let x2 = [100, 101, 102];
    let result2 = softmax(x2);
    
    console.log("\n测试用例2 (数值稳定性):");
    console.log("x =", x2);
    console.log("实际结果 ≈", result2.map(v => v.toFixed(6)));
    console.log("和为1检查:", Math.abs(result2.reduce((a, b) => a + b, 0) - 1) < 1e-10 ? "通过" : "失败");
    
    // 检查最大值对应的位置应该有最大的概率
    console.log("最大概率检查:", result2[2] > result2[1] && result2[1] > result2[0] ? "通过" : "失败");
}

function test_softmax_derive() {
    console.log("\n----- 测试 softmax_derive 函数 -----");
    
    // 测试用例
    let x = [1, 2, 3];
    let out = softmax(x);
    let dout = [0.1, 0.2, 0.3];
    let result = softmax_derive(x, out, dout);
    
    console.log("x =", x);
    console.log("softmax(x) =", out.map(v => v.toFixed(6)));
    console.log("dout =", dout);
    console.log("softmax_derive 结果 =", result.map(v => v.toFixed(6)));
    
    // 由于softmax导数计算复杂，这里主要检查输出形状和数值范围
    console.log("形状检查:", result.length === x.length ? "通过" : "失败");
}

function test_update_weights() {
    console.log("\n----- 测试 update_weights 函数 -----");
    
    // 测试用例
    let W = [[1, 2], [3, 4]];
    let dW = [[0.1, 0.2], [0.3, 0.4]];
    let lr = 0.5;
    
    // 手动计算预期结果
    // W[0][0] = 1 - 0.5 * 0.1 = 0.95
    // W[0][1] = 2 - 0.5 * 0.2 = 1.9
    // W[1][0] = 3 - 0.5 * 0.3 = 2.85
    // W[1][1] = 4 - 0.5 * 0.4 = 3.8
    let expected = [[0.95, 1.9], [2.85, 3.8]];
    
    let result = update_weights(W, dW, lr);
    
    console.log("W =", W);
    console.log("dW =", dW);
    console.log("学习率 =", lr);
    console.log("预期结果 =", expected);
    console.log("实际结果 =", result);
    console.log("测试结果:", arraysEqual2D(result, expected) ? "通过" : "失败");
}

// 辅助函数：检查两个数组是否相等
function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (Math.abs(a[i] - b[i]) > 1e-10) return false;
    }
    return true;
}

// 辅助函数：检查两个二维数组是否相等
function arraysEqual2D(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (!arraysEqual(a[i], b[i])) return false;
    }
    return true;
}

// 辅助函数：检查两个数组是否近似相等（用于浮点数比较）
function arraysApproxEqual(a, b, epsilon = 1e-10) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (Math.abs(a[i] - b[i]) > epsilon) return false;
    }
    return true;
}

// 单元测试函数
function run_all_tests() {
    console.log("======= 开始运行所有单元测试 =======");
    
    test_multiply();
    test_multiply_derive();
    test_relu();
    test_relu_derive();
    test_softmax();
    test_softmax_derive();
    test_update_weights();
    test_network();
    
    console.log("======= 所有单元测试完成 =======");
}

// 如果在Node.js环境中，直接运行测试
// 如果不是在Node.js环境中，这行代码不会有任何效果
if (typeof module !== 'undefined' && module.exports) {
    run_all_tests();
}