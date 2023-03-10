/**
 * 初始化地图类
 */
export default class InitMap {
    constructor(props) {
        const key = props.key || 'your key';
        this.el = props.el;
        const plugins = [
            'AMap.TruckDriving',
            'AMap.Scale',
            'AMap.GraspRoad',
            'AMap.LngLat',
            'AMap.Driving',
            'AMap.Geocoder',
            'AMap.Autocomplete',
            'AMap.PlaceSearch',
            'AMap.MouseTool'
        ]
        this.MapUrlArray = [
            `https://webapi.amap.com/maps?v=1.4.15&callback=initAMap&key=${key}&plugin=${plugins.join(',')}`,
            'https://webapi.amap.com/ui/1.1/main.js'
        ];
    }
    createScriptAmp (url) {
        return new Promise((res, rej) => {
            window.initAMap = () => {
                res(window.AMap);
            }
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = url;
            script.async = true;
            script.onerror = rej;
            document.head.appendChild(script);
        })
    }
    createScriptAMapUI (url) {
        return new Promise((res, rej) => {
            let script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = url;
            script.async = true;
            script.onerror = rej;
            document.head.appendChild(script);
            script.onload = () => {
                res();
            }
        })
    }
    //load MapUI + Map
    async MapUILoader () {
        try {
            let AMap_ = await this.createScriptAmp(this.MapUrlArray[0]);
            await this.createScriptAMapUI(this.MapUrlArray[1]);
            return new Promise((res, rej) => {
                res(AMap_);
            })
        } catch (err) {
            console.log(err);
        }
    }
    _initMap (center, zoom, initParams = {}) {
        center = center || [116.397428, 39.90923];
        zoom = zoom || 14;
        // console.log(center,zoom);
        return new Promise((resolve, reject) => {
            this.MapUILoader().then(AMap => {
                let map = new AMap.Map(this.el, {
                    autoRotation: true,
                    resizeEnable: true,
                    center,//设置地图中心点坐标 默认定位到皇宫
                    zoom,
                    ...initParams
                });
                //地图绘制成功
                map.on('complete', () => {
                    resolve(map);
                })
            }, e => {
                reject(e);
            }).catch(e => {
                reject(e);
            })
        })
    }
}