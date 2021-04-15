## 开发(以vue2.x项目举例)
```bash
  //初始化地图
    initMap () {
        return new Promise((resolve, reject) => {
            this.trackMap = new TrackFactory({
                el: 'container',
                key: '',//高德插件需要的秘钥
                correctOnce: (data) => { //纠偏一次就会调此钩子函数
                   
                },
                movingEnd: (lastPoint) => {//Marker移动结束会调此钩子函数
                   
                },
                correctAllEnd: async (lastPoint) => {//(轨迹的最后一次纠偏完成会调此钩子函数)
                    
                },
                correctOnceRealTime: (data) => {//第二条轨迹纠偏(如无需求可不对此钩子函数进行监听)
                   
                },
                initCreated: (map) => {//地图初始化后会调此钩子函数
                   //map为地图实例对象
                },
                initError: (errReson) => {//地图初始化报错会调此钩子函数
                   //errReson报错原因
                },
            });
        })
    },
   
```

## 描述
基于高德地图工厂模式开发先纠偏再画线最后执行marker移动动画纠偏包括两点、500个点、40个点、不纠偏等方式



