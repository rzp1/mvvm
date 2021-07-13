//因为 MVVM 可以 new，所以 MVVM 肯定是一个类
//用 es6写法定义
class MVVM{
    //在类里面接受参数,例如，el,和data
    constructor(options){
        //首先，先把可用的东西挂载在实例上
        this.$el = options.el;
        this.$data = options.data;
        //然后，判断如果有要编译的模版再进行编译
        if(this.$el){
            //数据劫持，就是把对想的所有属性 改成 get 和 set 方法
            new Observer(this.$data);
            this.proxyData(this.$data);
            // 初始化computed,将this指向实例
            initComputed(options, this);    
            //用 元素 和 数据 进行编译
            new Compile(this.$el,this);
            // 所有事情处理好后执行mounted钩子函数
            options.mounted.call(this); // 这就实现了mounted钩子函数
        }
    }
    proxyData(data){
        Object.keys(data).forEach(key=>{
            Object.defineProperty(this,key,{
                get(){
                    return data[key]
                },
                set(newValue){
                    data[key] = newValue;
                }
            })
        })
    }
}
function initComputed(options, v) {
    let vm = v;
    let computed = options.computed;  // 从options上拿到computed属性   {sum: ƒ, noop: ƒ}
    // 得到的都是对象的key可以通过Object.keys转化为数组
    Object.keys(computed).forEach(key => {  // key就是sum,noop
        Object.defineProperty(vm, key, {
            // 这里判断是computed里的key是对象还是函数
            // 如果是函数直接就会调get方法
            // 如果是对象的话，手动调一下get方法即可
            // 如： sum() {return this.a + this.b;},他们获取a和b的值就会调用get方法
            // 所以不需要new Watcher去监听变化了
            get: typeof computed[key] === 'function' ? computed[key] : computed[key].get,
            set() {}
        });
    });
}