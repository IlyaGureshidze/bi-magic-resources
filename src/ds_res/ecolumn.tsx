import React from 'react';
import {EPlot, BaseVizelEcharts, BaseVizelVC, VizelXYVC, OptionsProvider} from 'bi-internal/ui';
import { coloring, skin, getTextWidth, getAxisGap} from 'bi-internal/utils';
import { IEntity, IOptionsProvider, ISubspace} from 'bi-internal/defs/bi';
import { tables} from 'bi-internal/defs/tables';
const fontFamily = skin.hasOwnProperty('main-font-family') ? skin['main-font-family'] : 'HeliosCondC';

class Ecolumn extends EPlot {
  protected _subspace: ISubspace;
  protected _econfig: any;
  protected COLORS = [
    "#893448",
    "#d95850",
    "#eb8146",
    "#ffb248",
    "#f2d643",
    "#ebdba4"
  ];

  protected _getEchartsConfig(vm) {
    const additional: any = (this._cfg.getRaw() as any).echart || {};
    const type = super._getEchartsChartType(null);
    const isShowLegend = this._cfg['showLegend'];
    const isDataLabelsCentered: boolean = !!this._cfg.getOption('DataLabelsCentered');
    const isShowBackground: boolean = !!!this._cfg.getOption('!ShowBackground');
    const isDisplayDataZoom = this._cfg.getOption('DisplayDataZoom', false);
    const isDisplayAxisXMarks = this._cfg.getOption('DisplayAxisXMarks', true);
    const isDisplayAxis: boolean = this._cfg.getOption('DisplayAxis', true);
    const isDisplayGrid: boolean = this._cfg.getOption('DisplayGrid', true);
    const isDisplayVisualMapLabels: boolean = this._cfg.getOption('DisplayVisualMapLabels', true);
    const rotateXLabel: number = this._cfg.getDisplay()?.rotateXLabel ?? null;
    const isShowPercent = this._cfg.getOption('DisplayBadgesPercent', false); // показать процент
    const isDisplaySplitLines = this._cfg.getOption('DisplaySplitLines', true); // показать/скрыть разделительные линии осей (оставив лейблы и тики осей)
    const isDisplayTicks: boolean = this._cfg.getOption('DisplayTicks', true);
    const labelLimit = this._cfg.getDisplay()?.xAxisLabelLimit ?? null;
    //
    let gapInfo = {left: 0, right: 0};
    let longestLeftValue = '';
    let longestRightValue = '';
    let series = vm.series.map(serie => {
      serie.strValues.forEach((str) => {
        const value = str.split('.')[0];
        if (vm.vAxes[serie.vAxisIndex].opposite) {
          if (value.length > longestRightValue.length) longestRightValue = value;
        } else {
          if (value.length > longestLeftValue.length) longestLeftValue = value;
        }
      });
      return super._getChartConfigForSerie(serie, vm.categories, vm.dateTimeXAxisPeriodType);
    });

    series = series.map((serie, idx) => {
      const e: IEntity = vm.series[serie.index].e;

      const li: tables.ILegendItem = this._cfg.getLegendItem(e) || {};
      const liOptions: IOptionsProvider = new OptionsProvider(li.options);
      const isColoredByPoint = liOptions.hasOption('ColorX');

      let color: any = this._cfg.getColor(e, null, serie.index) || super._colorResolver.getColor(e);
      let bgColor: any = this._cfg.getBgColor(e, null, serie.index) || super._colorResolver.getBgColor(e);

      const gradientType: string = super._getGradientType(e);
      if (gradientType && String(gradientType).toLowerCase() != '3d') {
        [color, bgColor] = [coloring.makeEchartsGradient(gradientType, color, 'column'), coloring.makeEchartsGradient(gradientType, bgColor, 'column')];
      }
      let label = {
        ...serie.label,
        position: isDataLabelsCentered ? 'inside' : 'insideTop',
        distance: isDataLabelsCentered ? 0 : -10,
        verticalAlign: 'middle',
        align: 'center',
        ...li?.label
      };
      if (serie.stack) {
        label = {
          ...label,
          show: label.show || isShowPercent,
          formatter: isShowPercent ? (params) => super.formatterLabelStacked(params, this, series) : label.formatter,
          position: ['50%', '50%'],
          align: 'center',
          ...li?.label
        };
      }
      return {
        ...serie,
        color,
        showBackground: isShowBackground,
        lineStyle: {
          ...serie.lineStyle,
          color: bgColor,
        },
        itemStyle: {
          color: this.COLORS[idx > this.COLORS.length - 1 ? idx % this.COLORS.length : idx]
        },
        label: {
          ...serie.label,
          ...label,
          ...(li.label ? li.label : {}),
          formatter: (li.label?.formatter ? (params) => super.parseIt(JSON.stringify(li.label.formatter), params) : label.formatter),
        },
      };
    });

    let chartConfig: any = super._getEchartsConfig(vm);
    let leftDash = 0;
    let rightDash = 0;
    let leftAxes = vm.vAxes.filter(el => !el.opposite).map(el => el.id);
    let rightAxes = vm.vAxes.filter(el => el.opposite).map(el => el.id);
    let maxNameGap = 0;
    let xAxisLabel = {
      fontSize: 9,
      fontFamily: fontFamily,
      interval: 0,
      rotate: (rotateXLabel) ? rotateXLabel : 0,
      width: labelLimit ? Number(labelLimit) * 9 : null,
      overflow: labelLimit ? 'truncate' : 'none',
      hideOverlap: false,
      show: isDisplayAxisXMarks,
    };
    let totalWidthOfLabels = 0;
    let maxLabelWidth: number = 0;


    vm.categories.map((cat, i) => {
      totalWidthOfLabels = Number(totalWidthOfLabels) + Number(getTextWidth(cat.title, {
        fontSize: 9,
        fontFamily: 'sans-serif'
      }));
      if (String(cat.title).length > maxLabelWidth) maxLabelWidth = String(cat.title).length;
    });
    if (this._$container && this._$container[0]?.clientWidth < totalWidthOfLabels) {
      const containerWidth = this._$container[0]?.clientWidth;
      const maxWidth = vm.categories.length ? Math.round(containerWidth / vm.categories.length) * 0.8 : 0;
      // 1 symbol = 9
      xAxisLabel = {
        ...xAxisLabel,
        // rotate: Number(maxWidth) < 50 ? 45 : 0,
        rotate: (rotateXLabel) ? rotateXLabel : (labelLimit > 0 || Number(maxWidth)) < 50 ? 45 : 0,
        // width: Number(maxWidth) < 50 ? 200 : Number(maxWidth),
        width: (labelLimit) ? Number(labelLimit) * 9 : Number(maxWidth) < 50 ? 200 : Number(maxWidth),
        overflow: labelLimit ? 'truncate' : 'break',
      };
    }
    let yAxisConfig = vm.vAxes.map((vAxis, index) => {
      const {
        gridGap,
        nameGap
      } = getAxisGap(vAxis?.unit?.axis_title, vAxis.opposite ? longestRightValue : longestLeftValue);
      let offset = 0;
      maxNameGap = nameGap > maxNameGap ? nameGap : maxNameGap;
      if (vAxis.opposite) {
        gapInfo.right = gridGap > gapInfo.right ? gridGap : gapInfo.right;
        rightDash = rightAxes.indexOf(vAxis.id) == 0 ? 0 : gridGap + nameGap;
        offset = rightAxes.indexOf(vAxis.id) == 0 ? 0 : rightDash + 20;
        gapInfo.right += rightDash;
      } else {
        gapInfo.left = gridGap > gapInfo.left ? gridGap : gapInfo.left;
        leftDash = leftAxes.indexOf(vAxis.id) == 0 ? 0 : gridGap + nameGap;
        offset = leftAxes.indexOf(vAxis.id) == 0 ? 0 : leftDash + 20;
        gapInfo.left += leftDash;
      }
      if (gapInfo.right < 40) gapInfo.right = 40;
      if (gapInfo.left < 40) gapInfo.left = 40;
      return super._getChartConfigForVAxis(vAxis, vAxis.opposite ? nameGap + 10 : (leftAxes.indexOf(vAxis.id) == 0 ? nameGap + 10 : nameGap), offset);
    });

    if (maxNameGap > gapInfo.left) gapInfo.left = maxNameGap;
    if (vm.vAxes.length == 1) gapInfo.right = '4%';

    const visualMap = this._cfg.getRaw()?.echart?.visualMap ?? null;

    let bottom = isShowLegend ? '15%' : '5%';

    const dataZoom = [
      {
        type: 'slider',
        xAxisIndex: 0,
        bottom: isShowLegend ? '25%' : '5%',
      },
      {
        xAxisIndex: 0,
        type: 'inside',
      },
    ];

    if (isDisplayDataZoom) bottom = isShowLegend ? '40%' : '20%';

    chartConfig = {
      ...chartConfig,
      color: this.COLORS,
      grid: {
        ...chartConfig.grid,
        left: gapInfo.left,
        right: !!visualMap ? '12%' : gapInfo.right,
        containLabel: true,
        id: 's-grid',
        bottom,
      },
      xAxis: {
        show: isDisplayAxis,
        axisLine: {
          show: isDisplayGrid,
          onZero: null,
          lineStyle: {}
        },
        splitLine: {
          show: isDisplayGrid && isDisplaySplitLines
        },
        type: 'category',
        boundaryGap: ['5%', '5%'],
        data: vm.categories.map(x => this._cfg.getTitle(x)),
        axisLabel: xAxisLabel,
        axisTick: {show: isDisplayTicks, alignWithLabel: true, interval: 0},
        ...(additional.xAxis || {}),
      },
      yAxis: yAxisConfig,
      dataZoom: isDisplayDataZoom ? dataZoom : null,
      series
    };
    if (isDisplayVisualMapLabels && chartConfig.visualMap != null) {
      chartConfig = {
        ...chartConfig,
        visualMap: {
          ...chartConfig.visualMap,
          show: false
        }
      };
    }
    this._econfig = chartConfig;
    return chartConfig;
  }
}
export default Ecolumn;
