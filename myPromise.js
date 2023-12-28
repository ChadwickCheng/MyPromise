function MyPromise(executor){
  // 给实例添加属性
  this.PromiseState = 'pendding'
  this.PromiseResult = null
  // 保存then回调函数
  this.callbacks = []
  // save this
  const self = this
  // resolve
  function res(data){
    if(self.PromiseState!=='pendding') return // 状态只能改变一次
    // 改变状态promiseState 设置结果值promiseResult
    // 实例时默认调用者是window，需要修改this指向
    self.PromiseState = 'fulfilled'
    self.PromiseResult = data
    setTimeout(()=>{
      // 调用then成功的回调函数
      self.callbacks.forEach(item=>{
        item.onResolved(data)
      })
    })
  }
  // reject
  function rej(data){
    if(self.PromiseState!=='pendding') return 
    self.PromiseState = 'rejected'
    self.PromiseResult = data
    setTimeout(()=>{
      // 调用then失败的回调函数
      self.callbacks.forEach(item=>{
        item.onRejected(data)
      })
    })
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
  /*
  then返回一个新的promise对象
  1. 内部返回非promise，then返回的promise状态为成功，值为返回值
  2. 内部返回promise，then返回的promise状态为返回的promise状态，值为返回的promise的res或rej的值
  */
  const self = this
  if(typeof onRejected !== 'function'){
    onRejected = reason=>{
      throw reason
    }
  }// 异常穿透原理
  if(typeof onResolved !== 'function'){
    onResolved = value=>value
  }// 值传递原理，如果没有传递回调函数，就将值传递下去
  return new MyPromise((res,rej)=>{
    // 封装函数
    function callback(type){
      try{
        // 得到回调函数的返回值
        let result = type(self.PromiseResult)
        if(result instanceof MyPromise){
          result.then(v=>{
            res(v)
          },r=>{
            rej(r)
        })}else{
          // 修改返回的promise对象状态为成功
          res(result)
        }
        }catch(e){
          rej(e)
        }
      }
    // 调用回调函数
    if(this.PromiseState === 'fulfilled'){
      setTimeout(()=>{callback(onResolved)})
      }
    if(this.PromiseState === 'rejected'){
      setTimeout(()=>{callback(onRejected)})
    }
    // 允许promise内异步调用改变状态
    if(this.PromiseState === 'pendding'){
      // 保存回调函数 如果只是
      this.callbacks.push({
        onResolved:function(){
          callback(onResolved)
        },
        onRejected:function(){
          callback(onRejected)
        }
      })
    }
  }) 
}

// add catch method to myPromise
MyPromise.prototype.catch = function(onRejected){
  return this.then(undefined,onRejected)
}

// add resolve method to myPromise
MyPromise.resolve = function(value){
  return new MyPromise((res,rej)=>{
    if(value instanceof MyPromise){
      value.then(v=>{
        res(v)
      },r=>{
        rej(r)
      })
    }else{
      res(value)
    }
  })
}

// add reject method to myPromise
MyPromise.reject = function(reason){
  return new MyPromise((res,rej)=>{
    rej(reason)
  })
}

// add all method to myPromise
MyPromise.all = function(promises){
  // 返回promise对象
  return new MyPromise((res,rej)=>{
    // 都成功才成功
    let count = 0
    let arr = []
    for(let i=0;i<promises.length;i++){
      promises[i].then(v=>{
        // 每个都成功才res
        count++
        arr[i] = v// 当前成功结果存储，push会导致顺序错乱,因为可能有异步操作
        if(count === promises.length){
          res(arr)
        }
      },r=>{
        rej(r)
      })
    }
  })
}

// add race method to myPromise
// 接受一个promise数组，返回promise对象，对象状态由数组中最先改变状态的promise对象决定，状态与结果值一致
MyPromise.race = function(promises){
  return new Promise((res,rej)=>{
    for(let i=0;i<promises;i++){
      promises[i].then(v=>{
        res(v)
      },r=>{
        rej(r)
      })
    }
  })
}

// then指定的回调函数是异步执行的，需要主线程同步代码执行完毕后才会执行。这是一个细节