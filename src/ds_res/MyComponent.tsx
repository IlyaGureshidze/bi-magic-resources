// react и echarts на самом деле тянутся из обвязки "на лету"
import React, { useEffect, useState } from "react";
import  * as echarts from 'echarts';
// KoobFiltersService - Observable сервис, управляющий фильтрами для кубов (по умолчанию его использует упр.дешлет)
// useService, useServiceItself - специальные хуки для получения только модели или всего инстанса какого-либо
// Observable сервиса. Принимает по умолчанию класс нужного сервиса и если это не singleton то еще и идентификатор (через запятую)
import {KoobFiltersService, useService, useServiceItself} from 'bi-internal/services';

import './MyComponent.scss';

const MyComponent = (props) => {
  const { cfg, subspace, dp } = props;
  const [data, setData] = useState<any>([]);
  const [clickedPointName, setClickedPointName] = useState<string>(""); // для наглядности покажем на какую точку (Y,X) кликнули
  const koobFiltersService = useServiceItself<KoobFiltersService>(KoobFiltersService); // Получили инстанс сервиса фильтров
  // через метод koobFiltersService.getModel() можем получить его модель,
  // а через метод koobFiltersService.setFilter(koobId, dimensionId, valueArray) // ("", "category", ["=", "Beer"])
  // можем фильтровать данные дешлетов, которые подписаны в своих блоках filters на изменение этого дименшна (содержат "category": true)

  // Храним реф-ссылку на контейнер для графика, сам инстанс Echarts и опции, которые ему передаем
  let containerRef = null;
  let chart = null;
  let options = {};

  // Обрабатываем клик по точке графика. Проверяем, есть ли в конфиге дешлета свойство onClickDataPoint, отвечающая
  // в коробке за логику клика на точку по умолчанию
  // если нет - просто реализована произвольная логика выставления текущего значения дименшна в фильтр + для наглядности
  // показываем в интерфейсе строчку с "координатами" кликнутой точки

  const onChartClick = (params): void => {
    if (cfg.getRaw().hasOwnProperty('onClickDataPoint')) {
      const vcpv = {m: undefined, l: undefined, p: undefined, z: undefined, y: params.data.y, x: params.data.x, v: undefined};
      cfg.controller.handleVCPClick(params.event, vcpv)
    } else {
      const koobFiltersModel = koobFiltersService.getModel();
      if (koobFiltersModel.loading || koobFiltersModel.error) return;
      koobFiltersService.setFilter('', params.data.x.axisIds[0], ["=",params.name]);
    }
    setClickedPointName(`${params.data.y.title} ${params.data.x.title}`);
  }
  // На инит рефа создаем с нуля или обновляем существующий инстанс Echarts и подаем ему опции на вход
  // конфигурацию графиков Echarts смотрите тут https://echarts.apache.org/en/option.html#title
  const onChartCreated = (container) => {
    if (container && data.length) {
      if (!containerRef) {
        containerRef = container;
        chart = echarts.init(containerRef, null, {renderer: 'svg'});
      }
      options = {
        title: {
          show: false
        },
        tooltip: {
          trigger: 'item',
          appendToBody: true,
          show: true
        },
        xAxis: {
          type: 'category',
          data: subspace.xs.map(x => x.title)
        },
        yAxis: {
          type: 'value'
        },
        series: subspace.ys.map((y, yIndex) => ({
          data: subspace.xs.map((x, xIndex) => ({
            name: x.title,
            itemStyle: {
              color: cfg.getColor(y, null, yIndex),
            },
            x,
            y,
            value:  data[yIndex][xIndex] // мы получали матрицу YX
          })),
          name: y.title,
          type: cfg.getRaw().chartType ?? 'bar', // я задал этот тип явно, но это можно прочитать из конфига дешлета как переменную cfg.getRaw().chartType например
          showBackground: true,
        })),
        legend: {
          show: true,
          data: subspace.ys.map((y, yIndex) => ({
            name: y.title,
            icon: 'circle',
            itemStyle: {
              color: cfg.getColor(y, null, yIndex),
            },
          }))
        },
      };
      chart.setOption(options);
      chart.resize(); // принудительно заставляем расшириться на весь контейнер
      chart.on('click', 'series', onChartClick); // Обрабатываем клик по серии, если нужно
    }
  }

  useEffect(() => {
    // Получаем полное декартово произведение для указанного конфига в дешлете
    // ожидаем матрицу [subspace.ys.length][subspace.xs.length]

    dp.getMatrixYX(subspace).then(dataArr => {
      setData(dataArr || []);
    });
  },[]);

  return (
    <div className="MyComponent">
      {clickedPointName != "" && <div className="MyComponent__onClickText">Вы кликнули на {clickedPointName}</div>}
      <div ref={onChartCreated} className="MyComponent__graphic"></div>
    </div>
  );
}
export default MyComponent;
