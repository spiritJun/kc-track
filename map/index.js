import TrackFactory from './modules/TrackFactory' //默认导出轨迹插件
export { default as Enclosure } from './modules/Enclosure' //导出围栏模块
export default TrackFactory
/**
 * --之所以这么实现是为了兼容5.4其他系统~
 * 实现类似react中导出形式~
 */