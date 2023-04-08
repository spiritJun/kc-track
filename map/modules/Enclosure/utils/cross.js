/*
 * @Description:
 * @Author: Qinaj
 * @Date: 2023-03-08 13:55:18
 * @LastEditTime: 2023-03-08 13:55:23
 * @LastEditors: Qinaj
 */
/**
 * 判断围栏的线段是否相交
 */
import * as turf from '@turf/helpers'
import lineIntersect from '@turf/line-intersect'
/**
 * 坐标转线段
 * @param {*} path -- 坐标
 * @returns {lines} -- 线段
 */
function latLngToLines(path) {
    const lines = []

    path.forEach((item, index) => {
        let line = []
        if (index == path.length - 1) {
            line = turf.lineString([path[index], path[0]])
            lines.push(line)
            return
        }
        line = turf.lineString([path[index], path[index + 1]])
        lines.push(line)
    })
    return lines
}
/**
 * 判断坐标组成的单个多边形是否合法
 * @param {*} path
 * @description [[116.000, 39.111],[116.000, 39.111],[116.000, 39.111]] 坐标数组
 * @returns {boolean}
 */
export function isVaildPolygon(path) {
    //  判断数组且数组的长度小于3不构成满足一个面的必要条件终止
    if (!Array.isArray(path) || path.length < 3) return false
    //  具体坐标也需是一个一维数组，并且数组的长度等于2
    if (!path.every((item) => Array.isArray(item) && item.length == 2)) return false

    // 将坐标转成线段
    const lines = latLngToLines(path)
    // 是否合法标志
    let isCross = false
    // 验证函数
    function checkFn() {
        for (let i = lines.length - 1; i >= 0; i--) {
            // 基准线段
            const line = lines[i]
            const lineNextIndex = i == 0 ? lines.length - 1 : i - 1
            const lineLastIndex = i == lines.length - 1 ? 0 : i + 1
            const lineNext = lines[lineNextIndex]
            const lineLast = lines[lineLastIndex]
            // 相邻二根线段必须要有交点
            if (!isCrossPoint(line, lineNext) || !isCrossPoint(line, lineLast)) {
                isCross = true
                return
            }
            // 非相邻的线段必须无交点
            const noNearLines = lines.filter((item, i) => i !== lineNextIndex && i !== lineLastIndex)
            noNearLines.forEach((le) => {
                if (isCrossPoint(line, le)) {
                    isCross = true
                    return
                }
            })
        }
    }
    checkFn()
    //最终结果
    return isCross
}
//判断交点数值
function isCrossPoint(line1, line2) {
    return lineIntersect(line1, line2).features.length > 0
}
