import echarts from 'echarts';
import React from 'react';
import { BaseVizelEcharts, VizelYVC } from 'bi-internal/ui';
import isNumber from 'lodash/isNumber';
import {formatNumberWithString, getTextWidth, coloring, FIND_M, makeValue} from 'bi-internal/utils';
import { IVizelProps } from 'bi-internal/types';
import { IVizelYVM, IEntity, IMetric, ISubspace, IUnit, IValue, tables, IVAxis } from 'bi-internal/defs/bi';


class Epie extends BaseVizelEcharts<IVizelYVM> {
  protected _econfig: any;
  protected otherColor: string = "grey";
  protected otherTitle: string = "Прочее";
  protected COLORS = [
    "#893448",
    "#d95850",
    "#eb8146",
    "#ffb248",
    "#f2d643",
    "#ebdba4"
  ];

  public constructor(props: IVizelProps) {
    super(new VizelYVC(props.dp, props.cfg), props);
    if (this._cfg.showLegend == null) {
      this._cfg.showLegend = this._cfg.getOption('DisplayLegend', true);
    }
  }


  protected _viewModelChanged(vm: IVizelYVM): void {
    super._viewModelChanged(vm);
  }

  protected _updateChart(vm: IVizelYVM, prevVM: IVizelYVM): void {
    const pairs = vm.evPairs;
    const config = this._getEchartsConfig(vm);
    const hasData: boolean = (pairs.filter(ev => ev.v != null).length !== 0);
    if (!hasData) {
      // this._noData();
    }
    this._chart.clear();
    this._chart.setOption(config);
    this._onChartCreated(this._chart);
    this._chart.resize();
  }

  // returns: 'left' | 'bottom'
  private _getLegendPosition(): string {
    const cfg = this._cfg;
    if (!this._$container) return 'bottom';

    const isDisplayAllBadges: boolean = cfg.getOption('DisplayAllBadges');
    let width: number = this._$container.width();
    let height: number = this._$container.height();
    let legendWidth: number = 0;

    if (isDisplayAllBadges) {                                                                       // when have badges - it is more good
      width = width * 0.6;                                                                          // to display legend at bottom
    }

    const ys: IEntity[] = this.props.subspace.ys;

    if (ys?.length) {
      legendWidth = Math.max.apply(Math, ys.map((y: IEntity) => getTextWidth(y.title)));
    }

    if (width - legendWidth > height - 15 * ys?.length) {
      return 'right';
    }

    return 'bottom';
  }

  private _redrawLegend(): void {
    if (!this._chart) {
      return;
    }
    const legendConfig = this.__createLegendConfig();
    const legend: any = (this._chart as any).options.legend;
    legend.align = legendConfig.align;
    legend.verticalAlign = legendConfig.verticalAlign;
    legend.layout = legendConfig.layout;
    (this._chart as any).legend.render();
  }

  private __createLegendConfig(): any {
    const subspace = this.props.subspace;
    const self = this;
    const pos: string = this._getLegendPosition();   // right | bottom

    const config: any = {
      // enabled: _cfg['showLegend'],
      labelFormatter: function () {
        if (!self._cfg.hasOption('LegendShowValues')) {
          return this.name;
        }
        const y: IEntity = subspace.getY(this.index) as IMetric;
        const m: IMetric = FIND_M(subspace.getZ(0), y, subspace.getX(0));
        const u: IUnit = m ? m.unit : null;
        const value: string = makeValue(('Y' in this) ? this.Y : this.y, u);
        let label: string = this.name + ' ' + value;
        if (u && u['unit'] != 'PERCENT') {
          label += ' (' + Math.round(this.percentage) + '%)';
        }
        return label;
      },
    };

    if (pos === 'right') {
      config.align = 'right';
      config.verticalAlign = 'middle';
      config.layout = 'vertical';
    } else if (pos === 'bottom') {
      config.align = 'center';
      config.verticalAlign = 'bottom';
      config.layout = 'horizontal';
    }

    return config;
  }
  protected __getSegmentsWithOthers(vm): any {
    const maxSegmentCount = (this._cfg.getRaw() as any).maxSegmentCount || 0;
    let evPairs = vm?.evPairs ?? [];
    if (maxSegmentCount) {
      let sum = evPairs.reduce((sum, current) => +sum + +current.v, 0);
      const basicSegments = evPairs.slice(0, maxSegmentCount);
      const otherSegments = maxSegmentCount ? evPairs.slice(maxSegmentCount - 1) : [];
      const otherSum = otherSegments.reduce((sum, current) => +sum + +current.v, 0);
      const other = [{
        e: {
          axisIds: otherSegments[0]?.e?.axisIds,
          config:{
            [otherSegments[0]?.e?.axisIds[0]]:{title: otherSegments[0]?.e?.axisIds[0]}
          },
          formula: otherSegments[0]?.e?.axisIds,
          id: this.otherTitle,
          ids:[this.otherTitle],
          title:this.otherTitle,
          titles:[this.otherTitle],
          unit: null
        },
        v: otherSum,
        percent: sum ? otherSum * 100 / sum : 0
      }];
      evPairs = basicSegments.concat(other);
    }
    return evPairs;
  }

  protected _getEchartsConfig(vm: IVizelYVM) {
    const additional: any = (this._cfg.getRaw() as any).echart || {};
    const isShowLegend = this._cfg['showLegend'];


    const isShowAllLabel = this._cfg.getOption('DisplayAllBadges', false);       // показать все
    const isShowPercent = this._cfg.getOption('DisplayBadgesPercent', false); // показать процент
    const isShowValue = this._cfg.getOption('DisplayBadgesValue', false);     // показать цифру
    const isShowDisplayBadges = this._cfg.getOption('DisplayBadgesLabel', false);     // показать лейбл

    let evPairs = this.__getSegmentsWithOthers(vm);
    const chartType: string = 'pie';
    const legendSymbol: string = 'circle';
    const theme = this.theme;
    const color = theme.color1;
    const backgroundColor = theme.color2;

    const self = this;
    const chartConfig: any = {
      title: {
        show: false,
        text: this._cfg.title
      },
      color: [
        "#893448",
        "#d95850",
        "#eb8146",
        "#ffb248",
        "#f2d643",
        "#ebdba4"
      ],
      backgroundColor: "rgba(242,234,191,0.15)",
      tooltip: {
        appendToBody: true,
        show: true,
        trigger: 'item',
        backgroundColor,
        formatter: function (params) {
          const {seriesIndex, value, dataIndex} = params;
          const percent = evPairs[dataIndex].percent; // т.к. formatter-params возвращает *.** (округление)
          const ysEntity = evPairs[dataIndex]?.e;
          const xsEntity = vm.subspace?.xs[seriesIndex];
          const liYs = self._cfg.getLegendItem(ysEntity);
          const liXs = self._cfg.getLegendItem(xsEntity);

          const unit = ysEntity.unit || xsEntity.unit;
          const format = liYs?.format || liXs?.format || null;
          const formatPercent = liYs?.formatPercent || liXs?.formatPercent || '#.0%';

          const fValue = format ? formatNumberWithString(value, format) : makeValue(value, unit);
          const fPercent = formatNumberWithString(percent, formatPercent);
          const title = self._cfg.getTitle(ysEntity);

          const labelText = `${fValue} (${fPercent})`;
          return `<div class="tooltipContainer" style="max-width:300px; color: ${color}">
                    <span style="white-space: normal">${title}</span>
                    <br/> ${params.marker}
                    <!--<span style="color: #666;font-size: 14px;line-height: 1">-->
                    <span style="font-size: 14px;line-height: 1">
                        <span style="font-weight: 900;">${labelText}</span>
                    </span>
                    <div>`;
        },
        ...(additional.tooltip || {}),
      },
      grid: {
        containLabel: true,
        show: true,
        left: '3%',
        right: '4%',
        top: '0%',
        y: 0,
        height: '85%',
        bottom: '15%',
        borderWidth: 0,
        ...(additional.grid || {}),
      },
      legend: {
        show: isShowLegend,
        orient: 'horizontal',
        x: 'center',
        y: 'bottom',
        formatter: '{name}',
        borderColor: 'rgba(178,34,34,0.8)',
        borderWidth: 0,
        padding: 15,
        pageIconInactiveColor: theme.color11,
        pageIconColor: theme.color1,
        pageTextStyle: {
          color: theme.color1,
        },
        textStyle: {
          lineHeight: 11
        },
        data: evPairs.map((y, idx) => ({name: this._cfg.getTitle(y.e), icon: legendSymbol})),
        ...(additional.legend || {}),
      },
      xAxis: {
        show: false,
        type: 'category',
        boundaryGap: ['5%', '5%'],
        axisLabel: {fontSize: 9},
        axisTick: {alignWithLabel: true, interval: 0},
        ...(additional.xAxis || {}),
      },
      yAxis: [{
        show: false,
        axisLine: {show: true},
        axisTick: {show: true},
        type: 'value',
        splitLine: {
          show: false,
        },
        position: 'left',
      }],
      series: [{
        type: chartType,
        roseType: additional?.series?.[0]?.roseType ?? false,
        radius: additional?.series?.[0]?.radius ?? (isShowAllLabel || (isShowPercent && isShowValue && isShowDisplayBadges) ? '50%' : '70%'),
        top: '0%',

        labelLayout: {
          hideOverlap: false,
          fontSize: 12,
          draggable: true
        },
        // labelLine: {
        //   length: 20,
        //   length2: 10
        // },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          },
        },
        data: evPairs.map((ev, idx) => {
          const e: IEntity = ev.e;

          const li: tables.ILegendItem = this._cfg.getLegendItem(e) || {};
          return {
            unit: ev.e.unit,
            entityId: ev.e.id,
            name: this._cfg.getTitle(ev.e),
            value: isNumber(ev.v) ? Math.abs(ev.v) : ev.v,      // issue 2157: negative pie display abs
            Y: ev.v,                                      // hack
            percent: ev.percent,
            itemStyle: {
              color: ev.e.id != this.otherTitle ? this.COLORS[idx > this.COLORS.length - 1 ? idx % this.COLORS.length : idx] : this.otherColor
            },
            label: {
              show: isShowAllLabel || isShowPercent || isShowValue || isShowDisplayBadges || false,
              edgeDistance: '10%',
              lineHeight: 14,
              overflow: isShowAllLabel || (isShowPercent && isShowValue && isShowDisplayBadges) ? 'break' : undefined,
              ...(li.label ? li.label : {}),
              ...additional?.series?.label || {},
              formatter: (li.label?.formatter ? (params) => this.parseIt(JSON.stringify(li.label.formatter), params) : (params): string => {
                const {seriesIndex, value, dataIndex} = params;
                const percent = evPairs[dataIndex].percent; // т.к. formatter-params возвращает *.** (округление)
                const ysEntity = evPairs[dataIndex]?.e;
                const xsEntity = vm.subspace?.xs?.[seriesIndex];
                const liYs = this._cfg.getLegendItem(ysEntity) || {};
                const liXs = this._cfg.getLegendItem(xsEntity) || {};

                const unit = ysEntity?.unit || xsEntity?.unit;
                const format = liYs?.format || liXs?.format || null;
                const formatPercent = liYs?.formatPercent || liXs?.formatPercent || '#.0%';

                const fValue = format ? formatNumberWithString(value, format) : makeValue(value, unit);
                const fPercent = formatNumberWithString(percent, formatPercent);
                const title = this._cfg.getTitle(ysEntity);
                let text = '';
                if (isShowValue) text = `${fValue}`;
                if (isShowPercent) text = `${fPercent}`;
                if (isShowDisplayBadges) text = `${title}`;

                if (isShowPercent && isShowValue) text = `${fValue} (${fPercent})`;
                if (isShowDisplayBadges && isShowValue) text = `${title}: ${fValue}`;
                if (isShowDisplayBadges && isShowPercent) text = `${title}: ${fPercent}`;

                if (isShowAllLabel || (isShowValue && isShowPercent && isShowDisplayBadges)) text = `${title}: \n${fValue} (${fPercent})`;
                return text;
              }),
            },
          };
        }),
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: function (idx) {
          return Math.random() * 200;
        },
        ...additional.series || {}
      }],

    };
    this._econfig = chartConfig;
    return chartConfig;
  }

  protected _onChartClick = (params): void => {
    const vm = this._vm;
    const chart: any = this._chart;
    const {dataIndex, value} = params;
    if (!chart) return;

    const z: IEntity = vm.subspace.getZ(0);
    const x: IEntity = vm.subspace.getX(0);
    const y: IEntity = vm.subspace.ys[dataIndex];

    if (!z || !y || !x) return;

    const {m, l, p} = vm.subspace.getMLP(z, y, x);
    const v: IValue = value;
    this._onClickDataPoint(params, {x, y, z, m, l, p, v});
  }

  public calculateDimensionsForLegend = (graph, side = 'bottom') => {
    const chartWidth = graph.getWidth();
    const chartHeight = graph.getHeight();
    const options = graph.getOption();
    const legend = options.legend[0];
    const itemGap = legend?.itemGap;
    const itemWidth = legend?.itemWidth;
    const itemHeight = legend?.itemHeight;
    const padding = legend?.padding;
    let totalRowHeight = itemHeight;

    switch (side) {
      case 'bottom':
        if (legend?.data?.length) {
          let rowCount = 0;
          let currentWidth = 0;
          legend.data.map(el => {
            if (!el) return;
            let worthyWidths = [getTextWidth(el.name, {
              fontFamily: legend.itemStyle.fontFamily,
              fontSize: legend.itemStyle.fontSize
            }), itemGap, itemWidth];
            let totalWidthNeeded = worthyWidths.reduce((item, cur) => item + cur, 0);
            worthyWidths.map(width => {
              currentWidth += width;
            });
            if (currentWidth >= chartWidth || (chartWidth - currentWidth < totalWidthNeeded)) {
              currentWidth = 0;
              rowCount++;
            }
          });
          totalRowHeight = rowCount * itemHeight + (rowCount - 1) * itemGap + padding * 2;
        }
        break;
    }
    return totalRowHeight;
  }

  protected recalculateChart(chart: any): void {
    const config = chart.getOption();
    if (!config) return;
    let legendTotalHeight = this.calculateDimensionsForLegend(this._chart, 'bottom');
    const height = chart.getHeight();
    const isShowLegend = this._cfg['showLegend'];
    const isScroll = height / legendTotalHeight < 5;

    if (isScroll) legendTotalHeight = 15;

    if (isShowLegend) {
      config?.legend?.map(legend => {
        legend.show = isShowLegend;
        legend.type = isScroll ? 'scroll' : 'plain';
      });

      config?.grid?.map(grid => {
        grid.bottom = '15%';
      });

      config?.series?.map(serie => {
        serie.bottom = legendTotalHeight;
      });
      chart.setOption(config, {replaceMerge: ['grid', 'legend', 'series']});
    }
  }

  protected _onChartCreated(chart: any): void {
    this.recalculateChart(chart);
  }

  protected _getChartConfigForVAxis(vAxis: IVAxis): any {
    return {
      axisLine: {show: true},
      axisTick: {show: true},
      type: 'value',
      splitLine: {
        show: false,
      },
      position: vAxis.opposite ? 'right' : 'left',
    };
  }

  public resize(width?: number, height?: number): void {
    if (!this._chart || !this._$container) return;
    this._chart.resize();
    // this.recalculateChart(this._chart);
  }

  protected _dispose(): void {
    super._dispose();
  }

  public setAxes(subspace: ISubspace): Promise<any> {
    return super.setAxes(subspace.reduce(1, Infinity, 1));
  }

  public _setProperty(key: string, value: any): boolean {
    this._cfg[key] = value;

    if (!this._chart) return super._setProperty(key, value);

    if (key === 'showLegend') {
      const options = this._chart.getOption();
      options.legend.map(legend => {
        legend.show = value;
      });

      if (!value) {
        options.grid.map(grid => {
          grid.bottom = '4%';
        });
        options.series.map(serie => {
          serie.bottom = 0;
        });
      } else {
        // this.recalculateChart(this._chart);
      }
      this._chart.clear();
      this._chart.setOption(options, {replaceMerge: ['grid', 'legend', 'series']});
      this._chart.resize();
      this.recalculateChart(this._chart);
      super._setProperty(key, value);
      return true;
    }
    return super._setProperty(key, value);
  }

}

export default Epie;
