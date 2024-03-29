import TrackFactory from '../TrackFactory'
import { isVaildPolygon } from './utils/cross'
/**
 * 围栏类
 * props ==> {
 *   el -- 绑定的元素 必填选项
 *   key --url的唯一秘钥
 *   getMouseTool --callback 返回鼠标实例
 *
 * }
 * __proto__ =>{
 *    initCreated --callBack 实例加载成功的回调
 *    initError --callBack 实例加载失败的回调
 *    initPoint(新增) -- 设置地图初始化时的中心点
 *    initZoom(新增) -- 设置地图初始化时zoom级别
 *    initParams(新增) -- 设置地图初始化其他参数
 *    setpolygon(新增) -- 设置多边形回显形状
 *    setRectangle(新增) -- 设置矩形回显形状
 *    setCircle(新增) --    设置圆形回显形状
 *    getDrawConfig(新增) -- 返回给开发者配置选项 全部写活
 *    setMouseToolsPlugins(新增) -- 配置当前的矩形/圆形/多边形
 *    getDrawData(新增) -- 返回后端需要的数据~可拓展
 *    isAreaIncludePoint(新增) --判断点是否在区域内
 * }
 *
 *
 */
// 鼠标绘制工具配置项
const mouseToolConfig = new Map([
    [
        'polygon',
        [
            (params, ctx) => ctx.mouseTool.polygon(params), //鼠标配置
            (data, ctx, searchLngLat) => ctx._getPolygonData.bind(ctx, data, searchLngLat) //获取数据
        ]
    ],
    [
        'rectangle',
        [
            (params, ctx) => ctx.mouseTool.rectangle(params), //鼠标配置
            (data, ctx, searchLngLat) => ctx._rectangleData.bind(ctx, data, searchLngLat) //获取数据
        ]
    ],
    [
        'circle',
        [
            (params, ctx) => ctx.mouseTool.circle(params), //鼠标配置
            (data, ctx, searchLngLat) => ctx._circleData.bind(ctx, data, searchLngLat) //获取数据
        ]
    ]
])
export default class Enclosure extends TrackFactory {
    constructor(props) {
        super(props)
        this._init(props)
    }
    async _init(props) {
        try {
            this.props = { ...props }
            if (!this.props.el) {
                this.props.initError && this.props.initError('参数不正确，缺少必要的挂载元素')
                return false
            } else {
                await super._init()
                if (this.props.getMouseTool) {
                    this.mouseTool = new window.AMap.MouseTool(this.map) //此处map为父类属性
                    this.props.getMouseTool && this.props.getMouseTool(this.mouseTool)
                }
            }
        } catch (e) {
            console.log(e)
        }
    }
    //初始化配置鼠标画图项
    setMouseToolsPlugins(type = '', mouseTool, params = {}) {
        if (!mouseTool) throw new Error('鼠标工具类未定义！')
        mouseToolConfig.get(type) && mouseToolConfig.get(type)[0](params, this)
    }
    //设置多边形
    setpolygon(params = {}) {
        console.log(params)
        const polygonConfig = new window.AMap.Polygon(params)
        this.map.add(polygonConfig)
        this.map.setFitView()
        return polygonConfig
    }
    //设置矩形
    setRectangle(params = {}) {
        const rectangleConfig = new window.AMap.Rectangle(params)
        this.map.add(rectangleConfig)
        this.map.setFitView()
        return rectangleConfig
    }
    //设置圆形
    setCircle(params = {}) {
        const circleConfig = new window.AMap.Circle(params)
        this.map.add(circleConfig)
        this.map.setFitView()
        return circleConfig
    }
    //返回MouseTool配置的key防止用户蒙蔽
    getDrawConfig() {
        return Array.from(mouseToolConfig.keys())
    }
    //根据类型返回后端需要的数据
    getDrawData(type, data, searchLngLat) {
        if (mouseToolConfig.get(type)) {
            return mouseToolConfig.get(type)[1](data, this, searchLngLat)()
        }
    }
    //获取半径 算法：(边长的合 / 边长数量) / 2 向下取整
    _getRadius(e = {}) {
        const pointLength = e.obj.getPath().length
        const permimeter = Math.floor(window.AMap.GeometryUtil.distanceOfLine(e.obj.getPath()))
        return Math.floor(permimeter / pointLength / 2)
    }
    //判断多边形是否交叉********
    _getIsCross(e = {}) {
        const paths = e.obj.getPath()
        console.log(paths)
        const pathPoints = paths.map((item) => [item.lng, item.lat])
        console.log('绘制的是否交叉了？' + isVaildPolygon(pathPoints))
        return isVaildPolygon(pathPoints) || false
    }
    //判断区域是否包含点 方法跟contains一样 很好 但是没啥用
    isAreaIncludePoint(areaPoints, point) {
        return window.AMap.GeometryUtil.isPointInRing(point, areaPoints)
    }
    //判断点是否在区域内，以及是否在区域的多远的范围 适用于矩形 多边形
    /**
     * @params {*areaPoints} 必传 区域的点集合
     * @params {*searchLngLat} 必传 点标记
     * @params {distance} 当前点在区域内的距离范围
     */
    getIsIncludes(areaPoints = [], searchLngLat = null, distance = 0) {
        if (areaPoints.length && searchLngLat) {
            for (let item of areaPoints) {
                console.log(window.AMap.GeometryUtil.distance(item, searchLngLat), distance)
                if (window.AMap.GeometryUtil.distance(item, searchLngLat) < distance) {
                    return false
                }
            }
            return true
        } else {
            throw new Error('areaPoints，searchLngLat参数必传')
        }
    }
    //判断点是否在区域内，以及是否在区域的多远的范围 适用于圆形
    /**
     * @params {*radius} 必传 半径
     * @params {*circlePoint} 必传 圆心
     * @params {*searchLngLat} 必传 点标记
     * @params {distance} 当前点在区域内的距离范围
     */
    getIsIncludesByCircle(radius = null, circlePoint = null, searchLngLat = null, distance = 0) {
        if (radius && searchLngLat && circlePoint) {
            console.log(radius - window.AMap.GeometryUtil.distance(circlePoint, searchLngLat))
            if (radius - window.AMap.GeometryUtil.distance(circlePoint, searchLngLat) < distance) {
                return false
            }
            return true
        } else {
            throw new Error('radius，searchLngLat参数必传')
        }
    }
    //获取多边形
    _getPolygonData(e = {}, searchLngLat = null) {
        //测试
        // const isIncludes = this.getIsIncludes(e.obj.getPath(),searchLngLat,2)
        const isIncludes = searchLngLat ? window.AMap.GeometryUtil.isPointInRing(searchLngLat, e.obj.getPath()) : false
        const path = e.obj.getPath()
        //单位平方米
        const radius = this._getRadius(e)
        const area = Math.floor(window.AMap.GeometryUtil.ringArea(e.obj.getPath()))
        const isCross = this._getIsCross(e)
        const center = e.obj.getBounds().getCenter()
        return {
            isIncludes,
            path,
            area,
            radius,
            isCross,
            center
        }
    }
    //获取矩形
    _rectangleData(e = {}, searchLngLat = null) {
        // this.getIsIncludes(e.obj.getPath(),searchLngLat)
        const bounds = e.obj.getBounds() //获取矩形实例
        const center = bounds.getCenter()
        const isIncludes = searchLngLat ? window.AMap.GeometryUtil.isPointInRing(searchLngLat, e.obj.getPath()) : false
        // 西北 东北 西南 东南四角
        const northWest = bounds.getNorthWest()
        const northEast = bounds.getNorthEast()
        const southWest = bounds.getSouthWest()
        const southEast = bounds.getSouthEast()
        // const radius = Math.floor(e.obj.getRadius())
        const radius = this._getRadius(e)
        //单位平方米
        const area = Math.floor(window.AMap.GeometryUtil.ringArea(e.obj.getPath()))
        return {
            isIncludes,
            center,
            northWest,
            northEast,
            southWest,
            southEast,
            area,
            radius
        }
    }
    //获取圆形
    _circleData(e = {}, searchLngLat = null) {
        const radius = Math.floor(e.obj.getRadius())
        const center = e.obj.getCenter()
        console.log(window.AMap.GeometryUtil.ringArea)
        //单位平方米
        const area = Math.floor(window.AMap.GeometryUtil.ringArea(e.obj.getPath()))
        let isIncludes = searchLngLat ? window.AMap.GeometryUtil.isPointInRing(searchLngLat, e.obj.getPath()) : false
        //测试
        // const isIncludesDistance = this.getIsIncludes(e.obj.getPath(),searchLngLat,2)
        // isIncludes = isIncludes && isIncludesDistance
        return {
            isIncludes,
            radius,
            center,
            area
        }
    }
}
