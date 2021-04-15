/**
 * props ==>{
 *   data -- 轨迹的数据源 Array
 *   AMap -- 高德地图构造函数 Fn
 *   writeError --实例化画线方法失败 callBack
 *   map ---当前地图的实例对象
 *   correctOnce (新增)-- 转换一次抛出一次
 *   correctAllEnd(新增) -- 最后一次的转换完成了
 * }
 * __proto__ ==>{
 *    addPoint -- 添加轨迹点 并且进行转换 转换完成后没必要返回
 *    correctEndCall -- 将要画完线了
 *    
 * }
 */
export default class Correct_40 {
    constructor(props) {
        this.props = { ...props };
        this.deepNum = 1;
        this.correctNum = 40;
        this.isCorrectEnd = false;//转换是否完成
        this.currentCorrectEnd = false;//是否转换完成当前一批
        this.result = [];//以四十个点为基准的二维数组[[40],[40]]酱紫
        this._init();
    }
    _init () {
        if (!this.props.AMap || !this.props.data) {
            this.props.writeError && this.props.writeError();
        } else {
            let resData = this._reduceData(this.props.data, this.correctNum);
            this._exchangePonit(resData);
        }
    }
    //将点全部进行转换逻辑
    async _exchangePonit (data = [], isClear = false) {
        let deepNum = this.deepNum;
        isClear && (this.result = []);
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            let results = await this._transformGps(item);
            if (i == data.length - 1) {
                if (this.isCorrectEnd && this.props.isShowEnd && this.deepNum == deepNum) {
                    this.props.correctAllEnd && this.props.correctAllEnd(results[results.length - 1]);
                } else {
                    this.result.length && this._exchangePonit(this.result, true);
                }
                this.currentCorrectEnd = true;
            }
        }
    }
    //将40个点进行转换一下
    _reduceData (data = [], num = 40) {
        let resData = [];
        const callBack = (data_ = data, num = num) => {
            if (data_.length > num) {
                let data_ = data_.slice(0, num);
                resData.push(data_);
                let reduceDatas = data_.slice(num + 1);
                callBack(reduceDatas, num);
            } else {
                resData.push(data);
            }
        }
        callBack();
        return resData;
    }
    //40个点的原始点转换
    _transformGps (data) {
        return new Promise((resolve, reject) => {
            let results = this._filterOrgGps(data);
            this.props.AMap.convertFrom(results, 'gps', (status, result) => {
                if (result.info === 'ok') {
                    let arr = result.locations.map(item => ({
                        x: item.lng,
                        y: item.lat
                    }));
                    this.props.correctOnce && this.props.correctOnce(arr);
                    resolve(arr);
                }
            });
        })
    }
    //将原始点进行过滤 过滤成  [116.46706996,39.99188446]
    _filterOrgGps (data) {
        return data.map(item => [item.lon * 1, item.lat * 1]);
    }
    //外面新增点标记
    addPoint (data) {
        return new Promise((resolve, reject) => {
            this.deepNum += 1;
            let resData = this._reduceData(data, this.correctNum);
            this.result.push(...resData);
            if (this.currentCorrectEnd) {
                this.currentCorrectEnd = false;
                this._exchangePonit(resData, true);
            }
            resolve();
        })
    }
    //纠偏完成的订阅事件
    correctEndCall () {
        this.isCorrectEnd = true;
    }
}