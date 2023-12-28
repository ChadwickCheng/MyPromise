function MyPromise(executor){
  // 给实例添加属性
  this.PromiseState = 'pendding'
  this.PromiseResult = null
  // 保存then回调函数
  this.callbacks = {}
  // save this
  const self = this
  // resolve
  function res(data){
    if(self.PromiseState!=='pendding') return // 状态只能改变一次
    // 改变状态promiseState 设置结果值promiseResult
    // 实例时默认调用者是window，需要修改this指向
    self.PromiseState = 'fulfilled'
    self.PromiseResult = data
    // 调用then成功的回调函数
    if(self.callbacks.onResolved){
      self.callbacks.onResolved(data)
    }
  }
  // reject
  function rej(data){
    if(self.PromiseState!=='pendding') return 
    self.PromiseState = 'rejected'
    self.PromiseResult = data
    // 调用then失败的回调函数
    if(self.callbacks.onRejected){
      self.callbacks.onRejected(data)
    }
  }
  try{
    // 执行器函数在内部同步调用
    executor(res,rej);
  }catch(e){
    // 修改promise对象状态为失败
    rej(e)
  }
}

// add then method to myPromise
MyPromise.prototype.then = function(onResolved,onRejected){
  // 调用回调函数
  if(this.PromiseState === 'fulfilled'){
    onResolved(this.PromiseResult)
  }
  if(this.PromiseState === 'rejected'){
    onRejected(this.PromiseResult)
  }
  // 允许promise内异步调用改变状态
  if(this.PromiseState === 'pendding'){
    // 保存回调函数 如果只是
    this.callbacks = {
      onResolved,
      onRejected
    }
  }
}