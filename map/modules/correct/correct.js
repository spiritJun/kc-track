/**
 * props ==>{
 *   data -- 轨迹的数据源 Array
 *   AMap -- 高德地图构造函数 Fn
 *   writeError --实例化画线方法失败 callBack
 *   map ---当前地图的实例对象
 *   correctOnce (新增)-- 纠偏一次抛出一次
 *   correctAllEnd(新增) -- 最后一次的纠偏完成了
 * }
 * __proto__ ==>{
 *    addPoint -- 添加轨迹点 并且进行纠偏 纠偏完成后没必要返回
 *    correctEndCall -- 将要画完线了
 *    
 * }
 */
export default class Correct {
    constructor(props) {
        this.props = { ...props };
        this.isCorrectEnd = false;//纠偏是否完成
        this._init();
    }
    _init () {
        if (!this.props.AMap || !this.props.data) {
            this.props.writeError && this.props.writeError();
        } else {
            this._reduceHistoryData(this.props.data);
        }
    }
    _reduceHistoryData (data) {
        let arr = data.map(item => ({
            x: item.lon * 1,
            y: item.lat * 1
        }));
        this.props.correctOnce && this.props.correctOnce(arr);
        this.isCorrectEnd && this.props.correctAllEnd && this.props.correctAllEnd(arr[arr.length - 1]);
    }
    //纠偏完成的订阅事件
    correctEndCall () {
        this.isCorrectEnd = true;
    }
    //外面新增点标记
    addPoint (data) {
        return new Promise((resolve, reject) => {
            Promise.resolve().then(result => {
                this._reduceHistoryData(data);
                resolve();
            })
        })
    }
}