// import {
//     InitMap,
//     Correct_500,
//     TrackAnimate,
// } from './install';
import InitMap from './initMap' //初始化地图类
import Correct_500 from './correct/correct_500' //500个点的纠偏方法
import Correct_2 from './correct/correct_2' //两点间纠偏方法
import Correct_40 from './correct/correct_40' //40个点的转换方法
import Correct from './correct/correct' //不纠偏直接先写上
import TrackAnimate from './trackAnimate' //小车的动画
import DrawLines from './drawLines' //画线
/**
 * 工厂类
 *   初始化地图类 --InitMap
 *   绘制历史轨迹类 --Correct_500
 *   轨迹回放类 --TrackAnimate
 * props ==> {
 *    el -- 绑定的元素 必填选项
 *    key --url的唯一秘钥
 *    initCreated --callBack 实例加载成功的回调
 *    initError --callBack 实例加载失败的回调
 *    correctOnce (新增 callBack) -- 纠偏一次就抛出一次的方法
 *    correctAllEnd(新增 callBack) -- 纠偏完成的回调
 *    movingEnd(新增 callback) --小车本次移动结束了的回调
 *    initPoint(新增) -- 设置地图初始化时的中心点
 *    initZoom(新增) -- 设置地图初始化时zoom级别
 *    initParams(新增) -- 设置地图初始化其他参数
 * }
 * __proto__ ==>{
 *    pushDataEnd -- callback 推送结束了
 *    mapDestroy --callback 地图实例销毁
 *    drawHisTory --callback 高德地图画线
 *    trackPlay --callback 高德地图轨迹动画
 *    resetMap --callback 重置地图 恢复初始化状态 定位到皇宫
 *    currentTrack --callback实时轨迹开始
 *    locationToAddress --callback将经纬度反编译成地址
 *    addressTolocation --callback将地址反编译为经纬度
 *    showMarker --展示图标
 *    renderAMapLngLat  -- 将经纬度编译成高德地图经纬度
 *    correctLine -- 公共纠偏的方法 500个点的纠偏
 *    convertFromAmap -- 将其他坐标转高德坐标
 *    drawLine(新增) -- 画线封装
 *    trackPlayRealTime(新增) --动态轨迹动画 一直跑
 *    realTimeMoving(新增) --当小车暂停后继续跑
 *    setZoomCenter(新增) --将设置中心点和zoom级别抛出
 *    renderInfoWindow(新增) --渲染信息窗口(很重要 不要设置marker因为有复制的问题)
 * }
 */
const correctTypeObj = {
    500: Correct_500, //500个点递归纠偏
    2: Correct_2, //两点之间推荐路线
    0: Correct, //不纠偏 但需要把数据进行处理
    40: Correct_40 //40个点的转换方法
}
export default class TrackFactory {
    constructor(props) {
        this.props = { ...props }
        this.map = null //地图实例
        this.drawLineInstance = null //画线实例
        this.trackPlayInstance = null //轨迹播放实例对象
        this.RealTimeTrack = null //实时轨迹播放实例对象
        this.realTimeDrawLine = null //实时轨迹画线实例对象
        this.suspendDriving = false //暂停小车移动
        this.isCorrectEnd = false //最后一次纠偏完成了
        //2021-3-9解耦新增
        this.drawLinesInstance = null //画线的实例对象
        if (!this.props.el) {
            this.props.initError && this.props.initError('参数不正确，缺少必要的挂载元素')
            return false
        } else {
            this._init()
        }
    }
    //初始化函数
    async _init() {
        try {
            const { el, key, initPoint, initZoom, initParams } = this.props
            const map = new InitMap({ el, key })
            this.map = await map._initMap(initPoint, initZoom, initParams).catch((err) => {
                this.props.initError && this.props.initError(err)
            })
            this.props.initCreated && this.props.initCreated(this.map)
        } catch (err) {
            this.props.initError && this.props.initError(err)
            throw new Error(err || '地图加载失败')
        }
    }
    mapDestroy() {
        //地图实例销毁
        this.map && this.map.destroy()
    }
    //画线吧 小伙儿
    drawLine({ data = [], strokeObj = null }) {
        return new Promise(async (resolve, reject) => {
            if (!this.drawLinesInstance) {
                this.drawLinesInstance = new DrawLines({
                    AMap: window.AMap,
                    map: this.map
                })
            }
            await this.drawLinesInstance.drawLines({ data, strokeObj })
            resolve()
        })
    }
    //纠偏吧 小伙儿 //默认是轨迹回放
    //correctType -- (新增 纠偏类型)(2 --两点间 500 --500个点 0--不纠偏)
    drawHisTory({ data = null, writeError = () => {}, correctType = 0, isShowEnd = false }) {
        if (!this.drawLineInstance) {
            return new Promise((resolve, reject) => {
                this.drawLineInstance = new correctTypeObj[correctType]({
                    map: this.map,
                    isShowEnd,
                    data,
                    correctOnce: (data, orgData) => {
                        this.props.correctOnce(data, orgData)
                    },
                    correctAllEnd: (lastPoint) => {
                        this.props.correctAllEnd(lastPoint)
                    },
                    AMap: window.AMap,
                    writeError: (err) => {
                        writeError(err)
                        reject()
                    }
                })
                resolve()
            })
        } else {
            return new Promise((resolve, reject) => {
                this.drawLineInstance.addPoint(data, this.drawLineInstance.deepNum).then((res) => {
                    resolve(res)
                })
            })
        }
    }
    //实时轨迹动画 就跑就完事儿了
    trackPlayRealTime({ playerr = () => {}, speed = 50, data = [], currentCarMarker = null, isDrawLine = false }) {
        return new Promise((resolve, reject) => {
            if (!currentCarMarker) {
                playerr('当前没有轨迹需要播放！')
                reject('当前没有轨迹需要播放！')
            } else {
                if (!this.RealTimeTrack) {
                    this.RealTimeTrack = new TrackAnimate({
                        speed,
                        AMap: window.AMap,
                        map: this.map,
                        data,
                        currentCarMarker,
                        isDrawLine,
                        movingEnd: (lastPoint) => {
                            this.props.movingEnd(lastPoint)
                        }
                    })
                } else {
                    this.RealTimeTrack.addPoint(data)
                }

                resolve()
            }
        })
    }
    //动态轨迹跑完一段再跑 监听movingEnd事件了属于
    realTimeMoving() {
        this.RealTimeTrack.moveAlong()
    }
    //轨迹回放动画开始
    trackPlay({ playerr = () => {}, speed = 300, data = [], currentCarMarker = null, isDrawLine = false }) {
        return new Promise((resolve, reject) => {
            if (!currentCarMarker || !data.length) {
                playerr('当前没有轨迹需要播放！')
                reject('当前没有轨迹需要播放！')
            } else {
                if (!this.trackPlayInstance) {
                    this.trackPlayInstance = new TrackAnimate({
                        speed,
                        AMap: window.AMap,
                        map: this.map,
                        data,
                        currentCarMarker,
                        isDrawLine,
                        movingEnd: (lastPoint) => {
                            this.props.movingEnd(lastPoint)
                        }
                    })
                } else {
                    if (this.suspendDriving) {
                        currentCarMarker.resumeMove()
                    }
                }
                resolve()
            }
        })
    }
    //轨迹回放暂停
    trackTimeOut({ playerr = () => {}, currentCarMarker = null }) {
        return new Promise((resolve, reject) => {
            if (currentCarMarker) {
                this.suspendDriving = true
                currentCarMarker.pauseMove()
                resolve()
            } else {
                playerr('当前没有轨迹需要播放！')
                reject('当前没有轨迹需要播放！')
            }
        })
    }
    //轨迹重新播放
    trackReStart({ playerr = () => {}, speed = 300, data = [], currentCarMarker = null, isDrawLine = false }) {
        return new Promise((resolve, reject) => {
            if (!currentCarMarker || !data.length) {
                playerr('当前没有轨迹需要播放！')
                reject('当前没有轨迹需要播放！')
            } else {
                if (!this.trackPlayInstance) {
                    this.trackPlayInstance = new TrackAnimate({
                        speed,
                        AMap: window.AMap,
                        map: this.map,
                        data,
                        currentCarMarker,
                        isDrawLine,
                        movingEnd: (lastPoint) => {
                            this.props.movingEnd(lastPoint)
                        }
                    })
                }
                this.trackPlayInstance.reStartAnimation(speed)
                resolve()
            }
        })
    }
    //地图清除轨迹和小车等等一切的一切 恢复初始化状态 地图不要给干掉哦~
    resetMap(isResetMap) {
        this.drawLineInstance = null //画线实例
        this.trackPlayInstance = null //轨迹播放实例对象
        this.RealTimeTrack = null //实时轨迹播放实例对象
        this.realTimeDrawLine = null //实时轨迹画线实例对象
        this.drawLinesInstance = null //画线实例清楚
        this.suspendDriving = false //暂停小车移动
        this.isCorrectEnd = false //最后一次纠偏完成了
        window.setTimeout && clearTimeout(window.setTimeout) //清空所有定时器
        this.map && this.map.clearMap()
        // this.map.setZoomAndCenter(14, [116.397428, 39.90923]);//默认定位到皇宫
        !isResetMap && this.setZoomCenter() //默认定位到皇宫
    }
    //实时轨迹开始方法
    //correctType -- (新增 纠偏类型)(2 --两点间 500 --500个点 0--不纠偏)
    currentTrack({ data = [], errorFn = () => {}, correctType = 0, isShowEnd = false }) {
        return new Promise((resolve, reject) => {
            if (!data.length) {
                errorFn('实时轨迹数据不能为空！')
                reject('实时轨迹数据不能为空！')
            } else {
                if (!this.realTimeDrawLine) {
                    this.realTimeDrawLine = new correctTypeObj[correctType]({
                        map: this.map,
                        isShowEnd,
                        data,
                        AMap: window.AMap,
                        correctOnce: (data, orgData) => {
                            this.props.correctOnceRealTime(data, orgData)
                        },
                        // correctAllEnd: (lastPoint) => {
                        //     // this.props.correctAllEnd(lastPoint);
                        //     //动态轨迹不需要此方法
                        // },
                        writeError: (err) => {
                            writeError(err)
                            reject(err)
                        }
                    })
                } else {
                    return new Promise((resolve, reject) => {
                        this.realTimeDrawLine.addPoint(data, this.realTimeDrawLine.deepNum).then((res) => {
                            resolve(res)
                        })
                    })
                }
            }
        })
    }
    //将经纬度反编译成地址
    locationToAddress(lnglatArr, isGetOrg = false) {
        return new Promise((res, rej) => {
            window.AMap.plugin('AMap.Geocoder', () => {
                let geocoder = new window.AMap.Geocoder()
                //    console.log(lnglatArr)
                geocoder.getAddress(lnglatArr, (status, result) => {
                    if (status === 'complete' && result.regeocode && result.info === 'OK') {
                        let address = result.regeocode.formattedAddress
                        if (isGetOrg) {
                            res(result)
                        } else {
                            res(address)
                        }
                    } else {
                        rej('根据经纬度查询地址失败')
                    }
                })
            })
        })
    }
    //将地址反编译为经纬度
    addressTolocation(address) {
        return new Promise((res, rej) => {
            AMap.plugin('AMap.Geocoder', () => {
                let geocoder = new window.AMap.Geocoder()
                geocoder.getLocation(address, (status, result) => {
                    if (status === 'complete' && result.geocodes.length) {
                        res(result.geocodes[0].location)
                    } else {
                        rej('根据地址查询经纬度失败')
                    }
                })
            })
        })
    }
    //在地图中展示Marker
    showMarker({
        image = '',
        size = [19, 31],
        content = '',
        location = { x: 0, y: 0 },
        zIndex = 1,
        isFitView = false,
        params = {}
    }) {
        return new Promise((resolve, reject) => {
            let icon = new window.AMap.Icon({
                image,
                size: new window.AMap.Size(...size),
                imageSize: new window.AMap.Size(...size)
            })
            let position = new AMap.LngLat(Number(location['x']), Number(location['y']))
            // console.log(position)
            let marker = new window.AMap.Marker({
                map: this.map,
                icon,
                content,
                position,
                zIndex,
                ...params
            })
            marker.setMap(this.map)
            isFitView && this.map.setFitView()
            // if (isFitView) {
            //     this.map.setZoomAndCenter(20, [location.x, location.y]);
            // }
            resolve(marker)
        })
    }
    //将经纬度编译成高德地图经纬度
    renderAMapLngLat(location) {
        return new window.AMap.LngLat(Number(location['x']), Number(location['y']))
    }
    //纠偏公共方法
    correctLine(data) {
        return new Promise(async (resolve, reject) => {
            let correctData
            //数据的预处理
            if (Object.prototype.toString.call(data[0]) == '[object Object]') {
                if (Object.keys(data[0]).includes('x')) {
                    correctData = data
                } else {
                    correctData = this.renderCorrectData(data)
                }
            }
            let graspRoadArr = await this.drawLineInstance._reDressGraspRoad(correctData).catch((errItem) => {
                console.error(errItem)
            })
            resolve(graspRoadArr)
        })
    }
    //处理纠偏的数据 x y
    /**
     * x: Number(item.lon),
       y: Number(item.lat),
       ag: Number(item.agl),
       sp: Number(item.spd),
       tm
     */
    renderCorrectData(data) {
        let newData = []
        let preTime, curTime, tm
        for (let i = 0; i < data.length; i++) {
            const item = data[i]
            curTime = new Date(item.utc)
            if (i == 0) {
                tm = 1478031031
            } else {
                preTime = !preTime ? new Date(data[i - 1].utc) : preTime
                tm = Math.round(curTime.getTime() / 1000) - Math.round(preTime.getTime() / 1000)
            }
            newData.push({
                x: Number(item.lon),
                y: Number(item.lat),
                ag: Number(item.agl),
                sp: Number(item.spd),
                tm
            })
            preTime = curTime
        }
        return newData
    }
    //其他坐标转高德坐标
    convertFromAmap(gps) {
        return new Promise((resolve, reject) => {
            window.AMap.convertFrom(gps, 'gps', (status, result) => {
                if (result.info === 'ok') {
                    const obj = {}
                    obj['x'] = result.locations[0]['lng']
                    obj['y'] = result.locations[0]['lat']
                    resolve(obj)
                } else {
                    resolve([])
                    //转换失败
                }
            })
        })
    }
    //将任务放入宏任务中
    awaitMission(fn, params, time) {
        return new Promise((resolve, reject) => {
            if (this.drawLineInstance) {
                setTimeout(() => resolve(fn(params)), time)
            }
        })
    }
    //将纠偏后的轨迹抛出去
    pushDataEnd() {
        //通知实例将要画完
        this.isCorrectEnd = true
        this.drawLineInstance.correctEndCall()
    }
    //设置中心点以及zoom级别
    setZoomCenter(zoom = 14, center = [116.397428, 39.90923]) {
        this.map && this.map.setZoomAndCenter(zoom, center)
    }
    //渲染信息窗口(默认全是自定义)
    renderInfoWindow({ isCustom = true, offset = [50, 30], anchor = 'middle-left', content = '' }) {
        return new Promise((resolve, reject) => {
            let interView = new window.AMap.InfoWindow({
                isCustom,
                offset: new window.AMap.Pixel(...offset),
                anchor
            })
            interView.setContent(content)
            // interView.open(this.map);
            if (interView) {
                resolve(interView)
            } else {
                reject('interWindow加载失败！')
            }
        })
    }
}
