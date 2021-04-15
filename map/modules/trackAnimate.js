/**
 * 轨迹回放或者播放功能
 * 轨迹动画类
 * props ==>{
 *   map -- 当前地图的实例
 *   AMap --高德地图的构造函数
 *   strokeObj --线的样式一坨
 *   data -- 动画的数组
 *   currentCarMarker -- 小车实例Marker
 *   isDrawLine -- 是否边跑车边画线
 *   movingEnd -- callback 小车本次移动结束了
 * }
 * __proto__ ==>{
 *    reStartAnimation --重新播放轨迹回放
 *    addPoint -- 轨迹的点新增
 *    moveAlong --继续跑 迎着
 * }
 */
export default class TrackAnimate {
    constructor(props) {
        this.props = { ...props };
        this.passedPolyline = null;
        this.isCarDrivingEnd = false;
        this.addPoints = [];
        this._init();//使用监听的方法实现轨迹回放和实时轨迹
    }
    _init () {
        let initRuningArr = this._parseLine(this.props.data);
        this._renderLineAndAnimate(initRuningArr);
    }
    _initPolyLine () {
        let strokeObj = this.props.strokeObj || {
            strokeColor: "#28F", //线颜色
            strokeOpacity: 0.8,       //线透明度
            strokeWeight: 5,        //线宽
            strokeStyle: "solid",   //线样式
            lineJoin: "round",
            zIndex: 70,
            strokeDasharray: [10, 5] //补充线样式
        }
        this.passedPolyline = new this.props.AMap.Polyline({
            map: this.props.map,
            ...strokeObj
        });
    }
    //每次推送或者初始化有轨迹之后的渲染
    _renderLineAndAnimate (runingArr) {
        //先取到纠偏完的数据 每次先从父类里取数据 并且记录当前的滑动的数据 
        this.props.isDrawLine && this._initPolyLine();
        this.props.currentCarMarker.on('moving', (e) => {
            // this.props.map.setFitView();
            if (this.isCarDrivingEnd) this.isCarDrivingEnd = false;
            this.props.isDrawLine && this.passedPolyline.setPath(e.passedPath);
        });
        //这个才是真真正正的结束完事儿后的事件儿啊
        this.props.currentCarMarker.on('movealong', (e) => {
            this.isCarDrivingEnd = true;
            this.props.movingEnd(runingArr[runingArr.length - 1]);
        });
        this.props.currentCarMarker.moveAlong(runingArr, this.props.speed);
    }
    //重新播放轨迹回放
    reStartAnimation (speed = 300) {
        // this.passedPolyline.setOptions({strokeColor:"#28F"})
        // this.passedPolyline.setPath(new Array());
        this.props.currentCarMarker.moveAlong(this._parseLine(this.props.data), speed);
    }
    /* 
      特殊处理一下纠偏后的轨迹这块儿 因为moveAlone要的数据格式是 [[116.478935,39.997761]] 
    */
    _parseLine (data = []) {
        return data.map(item => [item.x, item.y]);
    }
    //抽象再次触发小车移动方法
    commonMoveAlong () {
        //转异步微任务
        Promise.resolve().then(() => {
            this._initPolyLine();
            this.props.currentCarMarker.moveAlong(this._parseLine(this.addPoints), this.props.speed);
            this.addPoints = [];
        })
    }
    //新增点标记
    addPoint (data) {
        this.addPoints.push(...data);
        if (this.isCarDrivingEnd) {
            this.commonMoveAlong();
        }
    }
    //继续跑 触发moveAlong
    moveAlong () {
        this.commonMoveAlong();
    }
}