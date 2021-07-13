//背景知识：
//将真实的DOM移入到内存中 fragment
//同样定义一个类
class Compile{
    constructor(el,vm){
        //el可能是 #app or dom，所以要进行判断
        this.el = this.isElementNode(el)?el:document.querySelector(el); 
        this.vm = vm;
        if(this.el){
            //如果这个元素能获取到，我们才开始编译
            //1.先把这些真实的DOM移入到内存中 fragment
            //2、编译 =》 提前想要的元素元素节点 v-model 和文本节点 {{}}
            //3、把编译好的 fragment 在塞回到页面里去

            //1.先把这些真实的DOM移入到内存中 fragment
            let fragment  = this.node2fragment(this.el);
            //2、编译 =》 提前想要的元素元素节点 v-model 和文本节点 {{}}
            this.compile(fragment);
            //3、把编译的fragment在赛回到页面中去
            this.el.appendChild(fragment);
        }
    }
    /*专门写一些辅助方法*/
    //判断是否是元素节点
    isElementNode(node){
        return node.nodeType === 1;
    }
    isDirective(name){
        return name.includes('v-');
    }
    /*核心的方法*/

    //1、需要将el中的内容全部放到内存中
    node2fragment(el){
        //文档碎片 内存中的dom节点
        let fragment = document.createDocumentFragment();
        let firstChild;
        while(firstChild = el.firstChild){
            // appendChild => move dom
            fragment.appendChild(firstChild);
        }
        return fragment; //内存中的节点
    }
    //2、编译 =》 提前想要的元素元素节点 v-model 和文本节点 {{}}
    compile(fragment){
        //需要递归
        let childNodes = fragment.childNodes;
        //
        Array.from(childNodes).forEach(node => {
            if(this.isElementNode(node)){
                //是元素节点，还需要深入的检查
                //这里需要编译元素
                this.compileElement(node);//编译 带 v-model 的元素
                this.compile(node);
            }else{
                //文本节点
                //这里需要编译文本
                this.compileText(node);
            }
        });
    }
    compileElement(node){
        //带v-model
        let attrs = node.attributes;//取出当前节点的属性
        Array.from(attrs).forEach(attr => {
            //判断属性名字是不是包含v-
            console.log(attr.name);
            let attrName = attr.name;
            if(this.isDirective(attrName)){
                //取到对应的值放到节点中
                let expr = attr.value;
                //console.log(expr);
                //解构负值，将v-model中的model截取处理
                let [,type] = attrName.split('-');
                console.log(type); 
                //node this.vm.$data expr v-model v-text v-html
                //todo ...
                CompileUtil[type](node,this.vm,expr);
            }
        })
    }
    compileText(node){
        //带{{}}
        let expr = node.textContent;//取文本中的内容
        let reg = /\{\{([^}]+)\}\}/g; //{{a}}、{{b}}、{{c}}
        if(reg.test(expr)){
            // node this.vm.$data text
            //todo ...
            CompileUtil['text'](node,this.vm,expr);
        }
    }
}

CompileUtil = {
    //获取示例上对应的示例
    getVal(vm,expr){ 
        expr = expr.split('.');
        return expr.reduce((prev,next) => {
            return prev[next];
        },vm.$data);
    },
    getTextVal(vm,expr){
        return expr.replace(/\{\{([^}]+)\}\}/g,(...arguments)=>{
            return this.getVal(vm,arguments[1]);
        });
    },
    text(node,vm,expr){ //文本处理
        let updateFn = this.updater['textUpdater'];
        //{{message.a}} => 'hello,zfpx'; 获取编译文本后的结果
        let value = this.getTextVal(vm,expr);
        expr.replace(/\{\{([^}]+)\}\}/g,(...arguments)=>{
            new Watcher(vm,arguments[1],(newValue)=>{
                //如果数据变化了，文本节点需要重新依赖的属性更新文本中的内容
                updateFn && updateFn(node,this.getTextVal(vm,expr));
            })
            return arguments[1];
        });
        updateFn && updateFn(node,value);
    },
    setVal(vm,expr,value){ //[message,a]
        expr = expr.split('.');
        //收敛
        return expr.reduce((prev,next,currentIndex)=>{
            if(currentIndex === expr.length-1){
                return prev[next] = value;
            }
            return prev[next];
        },vm.$data)
    },
    model(node,vm,expr){ //输入框处理
        let updateFn = this.updater['modelUpdater'];
        //这里应该加一个监控，数据变化了 应该调用这个watch的callback
        new Watcher(vm,expr,(newValue)=>{
            //当值变化后会调用 cb，将新的值传递过去 （）
            updateFn && updateFn(node,this.getVal(vm,expr));
        });
        
        node.addEventListener('input',(e)=>{
            let newValue = e.target.value;
            this.setVal(vm,expr,newValue)
        })

        updateFn && updateFn(node,this.getVal(vm,expr));

    },
    updater:{
        //文本更新
        textUpdater(node,value){
            node.textContent = value;
        },
        //输入框更新
        modelUpdater(node,value){
            node.value = value;
        }
    }
};