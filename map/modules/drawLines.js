/**
 * 画线实例 
 * props ==> {
 *  AMap -- 高德地图构造函数 Fn
 *  map --地图的实例
 * 
 * }
 * __proto__ ==>{
 *  drawLines --画线方法   
 * 
 * }
 */
export default class DrawLine {
    constructor(props) {
        this.props = { ...props };
    }
    _init () {

    }
    drawLines ({ data, strokeObj }) {
        let path = [];
        data.forEach(item => {
            path.push([item.x, item.y])
        });
        let _strokeObj = strokeObj || {
            strokeColor: "#28F", //线颜色
            strokeOpacity: 0.8,       //线透明度
            strokeWeight: 5,        //线宽
            strokeStyle: "solid",   //线样式
            lineJoin: "round",
            zIndex: 60,
            strokeDasharray: [10, 5] //补充线样式
        }
        return new Promise((res, rej) => {
            let polyline = new this.props.AMap.Polyline({
                path,          //设置线覆盖物路径
                ..._strokeObj,
            });
            polyline.setMap(this.props.map);
            res(path);
        })
    }
}