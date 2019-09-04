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
            //用 元素 和 数据 进行编译
            new Compile(this.$el,this);
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