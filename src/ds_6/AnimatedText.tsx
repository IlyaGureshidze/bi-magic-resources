import React, {useEffect, useState} from "react";
import * as echarts from 'echarts';
import {GeometryObserver} from 'bi-internal/face';
import {useServiceItself} from "bi-internal/services";
import {MyCustomService} from "../services/MyCustomService";

const AnimatedText = (props) => {
  let chart = null;
  const {cfg} = props;
  const columns = cfg.dataSource.dimensions && cfg.dataSource.measures
    ? [`${cfg.dataSource.dimensions[0]}:name`,`${cfg.dataSource.measures[0].split(":")[0]}:value`]
    : [];
  const myCustomSrvc = useServiceItself<MyCustomService>(MyCustomService, cfg.dataSource.koob, columns, {});

  const onChartCreated = (container) => {
    const config = {
      graphic: {
        elements: [
          {
            type: 'text',
            left: 'center',
            top: 'center',
            style: {
              text: myCustomSrvc.getModel()?.min?.name,
              fontSize: 80,
              fontWeight: 'bold',
              lineDash: [0, 200],
              lineDashOffset: 0,
              fill: 'black',
              stroke: '#000',
              lineWidth: 1
            },
          }
        ]
      }
    }
    if (container) {
      if (!chart) {
        chart = echarts.init(container, null, {renderer: "svg"});
        GeometryObserver.getInstance().addSubscription(container, () => {
          chart.resize();
        });
      }
      chart.setOption(config);
      chart.resize();
    }
  }
  if (myCustomSrvc.getModel().loading || myCustomSrvc.getModel().error) return null;
  return (
    <div ref={onChartCreated} className="AnimatedText" style={{width: '100%', height: '100%'}}></div>
  );
}

export default AnimatedText;
