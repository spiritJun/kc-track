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
export default class Correct_2 {
    constructor(props) {
        this.props = { ...props }
        this.deepNum = 0;
        this.isCorrectEnd = false;//纠偏是否完成
        this.currentCorrectEnd = false;//是否纠偏完成当前一批
        this.addPointArr = [];//新增的数据
        this._init();
    }
    _init () {
        if (!this.props.AMap || !this.props.data) {
            this.props.writeError && this.props.writeError();
        } else {
            this._reduceHistoryData(this.props.data);
        }
    }
    //纠偏
    async _reduceHistoryData (data, isClear = false) {
        let deepNum = this.deepNum;
        isClear && (this.addPointArr = []);
        for (let i = 0; i < data.length; i++) {
            if (i > 0) {
                let paths = [];
                //优化性能 减少实例化操作 
                paths.push([data[i - 1].lon * 1, data[i - 1].lat * 1]);
                paths.push([data[i].lon * 1, data[i].lat * 1]);
                // paths.push(new this.props.AMap.LngLat(data[i - 1].lon * 1, data[i - 1].lat * 1));
                // paths.push(new this.props.AMap.LngLat(data[i].lon * 1, data[i].lat * 1));
                const result = await this._betweenTwoPoints(paths);
                if (i == data.length - 1) {
                    if (this.isCorrectEnd && this.props.isShowEnd && this.deepNum == deepNum) {
                        this.props.correctAllEnd && this.props.correctAllEnd(result[result.length - 1]);
                    } else {
                        this.addPointArr.length && this._reduceHistoryData(this.addPointArr, true);
                    }
                    this.currentCorrectEnd = true;
                }
            }
        }
    }
    //两点之间的推荐路线
    _betweenTwoPoints (path) {
        console.log(path);
        console.log('纠偏的原始点！');
        return new Promise((resolve, reject) => {
            const searchOption = {
                policy: this.props.AMap.DrivingPolicy.LEAST_TIME,
                ferry: 1 // 是否可以使用轮渡
            };
            const drivingWay = new this.props.AMap.Driving(searchOption);
            drivingWay.search(path[0], path[1], (status, result) => {
                if (status === 'complete') {
                    if (result.routes && result.routes.length) {
                        let arr = this._parseRouteToPath(result.routes[0]);
                        this.props.correctOnce && this.props.correctOnce(arr);
                        resolve(arr)
                    }
                }
            });
        })
    }
    //将两点之间推荐轨迹 抓换为能用的数据
    _parseRouteToPath (route) {
        let path = [];
        for (let i = 0, l = route.steps.length; i < l; i++) {
            let step = route.steps[i];
            for (let j = 0, n = step.path.length; j < n; j++) {
                let item = step.path[j];
                path.push({
                    x: item.lng,
                    y: item.lat
                });
            }
        }
        return path;
    }
    //外面新增点标记
    addPoint (data) {
        return new Promise((resolve, reject) => {
            this.deepNum += 1;
            this.addPointArr.push(...data);
            if (this.currentCorrectEnd) {
                this.currentCorrectEnd = false;
                this._reduceHistoryData(this.addPointArr, true);
            }
            resolve();
        })
    }
    //纠偏完成的订阅事件
    correctEndCall () {
        this.isCorrectEnd = true;
    }
}