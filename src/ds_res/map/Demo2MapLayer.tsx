import React, {Component, useState, useEffect, createRef, RefObject} from 'react';
import {L} from 'bi-internal/utils';
import './layerStyle.scss';
import ReactDOM from "react-dom";
import {getWeatherIcon, getWeatherIconString, getOtherIconString, getOtherIcon, getSectorPath, menuItems, randomInteger} from "./utils";
import {gyjson} from './demoData';
import {IVizelConfig, ISubspace} from 'bi-internal/defs/bi';
import {IDataProvider} from 'bi-internal/utils';

interface IDemoLayerProps{
  dp: IDataProvider;
  cfg: IVizelConfig;
  subspace: ISubspace;
  onVizelPropertiesChanged?: any;
  properties?: any;
  renderError?: any;
  renderLoading?: any;
  schema_name: string;
  setLoading: (e) => any;
  setSaveAbilities: (e) => any;
  view_class: string;
  _toggleLayer: any;

  _toggleMenu: any;

  map: L.Map;  // объект карты контейнера для слоя
  leafletLayer?: L.layerGroup;  // объект слоя Leaflet
  active?: boolean; // aктивен ли слой
  rawCfg?: any; // raw object родительский конфиг
  button: any; // объект кнопки для слоя меню
  activeMenu: boolean;
}

interface IDemoLayerState{
  subspace: ISubspace | null;
  layer?: L.layerGroup;
  map?: L.Map;
  active?: boolean;
  rawCfg?: any;
}

const StationData = (props: {
  data: (number | boolean | string)[];
}) => {
  const data: any[] = props.data || [];
  return (<div>
    <table className={'legendTable'}>
      <thead>
        <td className={'legendTableTitle'}>Название</td>
        <td>Тип</td>
        <td>Статус</td>
        <td>Вагоны</td>
        <td>Грузы</td>
        <td>Погода</td>
        <td>Погрузка</td>
        <td>В пути</td>
        <td>Доставлено</td>
      </thead>
      <tbody>
        {data.map((d: (number | boolean | string)[]) => {
          const value = [...d];
          value.splice(0, 2);
          return(<tr>
            {value.map((v: number | boolean | string, index) => {
              if (index === 5) {
                const icon = getWeatherIcon(Number(v));
                return <td>{icon}</td>;
              } else if (index === 2) {
                if (v === true) {
                  const icon = getOtherIcon(1);
                  return <td>{icon}</td>;
                }
              }
              return <td>{v}</td>;
            })}
          </tr>);
        })}
      </tbody>
    </table>
  </div>)
}

const AnimMapLayer: React.FC = (props: IDemoLayerProps): boolean => {
  const [state, setState] = useState<IDemoLayerState>({
    map: props.map,
    layer: props.leafletLayer,
    rawCfg: props.rawCfg,
    subspace: props.subspace,
    active: props.active,
  });

  const [routeData, setRouteData] = useState<any[]>([]);
  const [routeLayer, setRouteLayer] = useState<any>(null);

  const [stationData, setStationData] = useState<any[]>([]);
  const [stationLayer, setStationLayer] = useState<any>(null);

  const [marker, setMarker] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [fullCoords, setFullCoords] = useState<(string | number)[][]>([]);
  const [shortCoords, setShortCoords] = useState<(string | number)[][]>([]);

  const [mode, setMode] = useState<number>(0);

  const [legendContainer, setLegendContainer] = useState<any>(null);
  const legend: any = createRef<RefObject<HTMLElement>>();

  // ДОБАВЛЯЕМ ТЕСТОВЫЕ ДАННЫЕ
  useEffect(() => {
    const gArr = [];

    ([gyjson]).map((f, x) => {
    const coordinates = gyjson.features[0].geometry.coordinates || [];
    const coords = coordinates.map((c, i) => [c[0], c[1]]);

    const coords2 = [];

    let lineCount = 0;
    let lineItems = [];
    coordinates.forEach((c, i) => {
      const coord = [c[0], c[1]];

      // stations
      if (i % 700 === 0) coords2.push(coord);

      // line parts
      if (lineCount < 1000 && i < (coordinates.length - 1)) {
        lineItems.push(coord);
        ++lineCount;
      }
      else if (lineCount === 1000 || i === (coordinates.length - 1))
      {
        lineItems.push(coord);

        const linePart = {
        "type": "Feature",
        "properties": {"cost": c[2]},
        "geometry": {
            "type": "LineString",
            "coordinates": lineItems
          }
        };

        let colorLine = 'green';
        if (c[2] < 400) {
          colorLine = 'red';
        }

        const weight = colorLine === 'green' ? 4 : 7;

        const t = L.geoJSON(linePart, {style: {
            fillColor: colorLine,
            weight: weight,
            opacity: 1,
            color: colorLine,
            dashArray: '0',
            fillOpacity: 0.9
          }});

        gArr.push(t);

        lineItems = [];
        lineCount = 0;
      }
    });

    let stations = [];
    coords2.forEach((cd: [number, number], index: number) => {
      if (cd) {

        const accident = (index % 3 === 0);
        const wagon = index * 3;
        const cargo = wagon * 10;

        const weatherType = randomInteger(0, 3);
        const stationType = randomInteger(0, 2);
        const preparingData = randomInteger(1000, 5000);
        const inProccessData = randomInteger(1000, 5000);
        const completedData = randomInteger(1000, 5000);

        const station: (boolean | number | string)[] = [cd[0], cd[1], `Станция ${index}`, stationType, accident, wagon, cargo, weatherType, preparingData, inProccessData, completedData];

        stations.push(station);
      }
    });

    // train
    const marker = L.marker([coords2[0][1], coords2[0][0]], {
      icon: L.divIcon({
        iconSize: "auto",
        html: "<div class='wagonIcon' style={{width: '30px', height: '30px', background: 'violet'}}>test</div>"
      })
    });

    setMarker(marker);

    setFullCoords(coords);
    setShortCoords(coords2);

    setRouteData(gArr);
    setStationData(stations);
    });
  }, []);

  // Сохраняем субспейс и объект карты
  useEffect(() => {
    if (props.map && props.subspace) {
      const newState = {
        ...state,
        subspace: props.subspace,
        map: props.map,
      }

      setState(newState);
    }
  }, [props.subspace, props.map]);

  const createStationIcon = (data: any, index): L.marker | null => {
    if (mode === 0) {
      return L.marker([data[1],data[0]], {
        icon: L.divIcon({
          html: "<div class='stationIcon'>" +
            "<div class='stationIconSvg'>" +
            "<div class='stationInner stationPart1'>" + data[5] + "</div>" +
            "<div class='stationInner stationPart2'>" + data[6] + "</div>" +
            "</div>" +
            "<div class='stationIconText'>" + data[2] + "</div>" +
            "</div>",
          iconSize: L.point(60, 60),
          iconAnchor: L.point(30, 30, true),
        })
      }).bindPopup(`<b>${data[2]}</b>`);
    } else if (mode === 2) {
      if (data[4]) {
        return L.marker([data[1],data[0]], {
          icon: L.divIcon({
            html: `<div class='troubleIcon'><svg xmlns="http://www.w3.org/2000/svg" id="Outline" viewBox="0 0 24 24" width="24" height="24"><path d="M12,0A12,12,0,1,0,24,12,12.013,12.013,0,0,0,12,0Zm0,22A10,10,0,1,1,22,12,10.011,10.011,0,0,1,12,22Z"/><path d="M12,5a1,1,0,0,0-1,1v8a1,1,0,0,0,2,0V6A1,1,0,0,0,12,5Z"/><rect x="11" y="17" width="2" height="2" rx="1"/></svg></div>`,
            iconSize: L.point(40, 40),
            iconAnchor: L.point(30, 30, true),
          })
        }).bindPopup(`<b>${data[2]}</b>`);
      } else {
        const chartMarker = document.createElement('div');
        chartMarker.classList.add('ChartMarker');
        chartMarker.id = `item-${index}`;
        chartMarker.setAttribute('title', data.title);

        const divTitle = document.createElement('div');
        divTitle.classList.add('ChartMarker__Title');
        divTitle.innerHTML = data[2];

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttributeNS(null, 'viewBox', `0 0 ${12} ${12}`);
        svg.classList.add('MapRing');

        let halfSize = 6;

        // 8 9 10
        const colors = ['crimson', 'gold', 'green'];

        const values = [data[8], data[9], data[10]];
        const sum: number = values.map(value => ((!!value) ? value : 0)).reduce((a, b) => Math.abs(a) + Math.abs(b), 0);
        let a = 0;
        const sectors: {a1: number, a2: number, color: string, value: number}[] = [];
        const min = sum / 100 * 1;

        values.forEach((v, i) => {
          const a1 = a;
          const value = (!!v) ? Math.abs(v) : min;
          const a2 = a1 + 360 * (value) / (sum + 0.000001);
          a = a2;
          sectors.push({
            a1,
            a2,
            value,
            color: colors[i]
          });
        });

        const tt = sectors.map((sector: any, j) => {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttributeNS(null, 'd', getSectorPath(halfSize, halfSize, 5, halfSize, Math.abs(sector.a1), Math.abs(sector.a2)));
          path.setAttributeNS(null, 'fill', sector.color);
          path.classList.add('MapRingItem');

          return path;
        });

        tt.map((t) => {
          svg.append(t);
        });

        const tv = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        tv.setAttributeNS(null, 'fill', 'white');
        tv.classList.add('MapRingText');
        tv.innerHTML = data[5];
        tv.setAttributeNS(null, 'y', '55%');
        tv.setAttributeNS(null, 'x', '50%');
        tv.setAttributeNS(null, 'textLength', 'yes');
        tv.setAttributeNS(null, 'fontSize', '3');
        tv.setAttributeNS(null, 'textAnchor', 'middle');

        svg.append(tv);

        chartMarker.append(svg);
        chartMarker.appendChild(divTitle);

        return L.marker([data[1],data[0]], {
          icon: L.divIcon({
            html: chartMarker,
            iconSize: L.point(60, 60),
            iconAnchor: L.point(30, 30, true),
          })
        }).bindPopup(`<b>${data[2]}</b>`);
      }
    }
    else if (mode === 1)
    {
      const image = getWeatherIconString(data[7], true);

      return L.marker([data[1],data[0]], {
          icon: L.divIcon({
            html: `<div class='stationIcon'><div class='stationIconSvg'><div class='stationInner stationPart3'>${image}</div></div><div class='stationIconText'>${data[2]}</div></div>`,
            iconSize: L.point(60, 60),
            iconAnchor: L.point(30, 30, true),
          })
        }).bindPopup(`<b>${data[2]}</b>`);
    }

    return null;
  }

  // создаем объекты для карты и добавляем в слой
  useEffect(() => {
    const layersArr = L.layerGroup([]);

    routeData.forEach((item) => {
      if (item) layersArr.addLayer(item);
    });

    setRouteLayer(layersArr);
  }, [routeData]);

  useEffect(() => {
    if (stationLayer) props.map.removeLayer(stationLayer);

    const stData = [];
    stationData.forEach((cd, index) => {
      if (cd) {
        const stIcon: L.marker = createStationIcon(cd, index);
        if (stIcon) stData.push(stIcon);
      }
    });

    const layersArr = L.layerGroup([]);
    stData.forEach((item) => { if (item) layersArr.addLayer(item);});
    setStationLayer(layersArr);
  }, [stationData, mode]);

  useEffect(() => {
    if (props.map && routeLayer) {
      if (props.active && !(props.map.hasLayer(routeLayer))) {
        if (routeLayer) routeLayer.addTo(props.map);
      } else if (!props.active) {
        props.map.removeLayer(routeLayer)
      }
    }
  }, [props.map, props.active, routeLayer]);

  useEffect(() => {
    if (state.map && stationLayer) {
      if (props.active && !(props.map.hasLayer(stationLayer))) {
        if (stationLayer) stationLayer.addTo(props.map);
      }
      else if (!props.active) {
        props.map.removeLayer(stationLayer)
      }
    }
  }, [state.map, props.active, stationLayer]);

  useEffect(() => {
    _setLegendContainer();
  }, [props.button, stationData, props.activeMenu, mode]);

  useEffect(() => {
    if (legendContainer) {
      const dataBlock = legendContainer?.querySelector('#LegendData');
      ReactDOM.render(<StationData data={stationData} />, dataBlock);
    }
  }, [legendContainer, stationData]);

  const _setupContainerRef = async (ref) => {
    legend.current = ref;
    setLegendContainer(legend.current);
  }

  // create legend container
  const _setLegendContainer = async () => {
    if (props.active && props.button?.current) {
      const button = props.button?.current || null;
      if (button) {
        let container = button.querySelector('.LayerConfig__Dropdown');
        const closeIcon = getOtherIcon(0);
        if (container) {
          ReactDOM.render(<div id={'MenuLegendWr'}>
            <div id={'SpecMapLegend'} ref={_setupContainerRef}>
              <div className={'LegendCloseButton'} >
                <div onClick={props._toggleMenu}>{closeIcon}</div>
              </div>
              <div className={'LegendInfo legendBlock'}>
                <div className={'LegendMenu'}>
                  <ul>
                    {menuItems.map((mi, index) => {
                      return <li key={mi.slug}
                                 className={`menuItem ${mode === index ? 'activeItem' : ''}`}
                                 onClick={() => setMode(mi.id)}>{mi.title}</li>
                    })}
                  </ul>
                </div>
                <div id={'LegendData'} className={'LegendData'}></div>
              </div>
            </div>
          </div>, container);
        }
      }
    }
  }

  return (true);
}

class Demo2MapLayer extends Component<any, any>{
  public render() {
    return <AnimMapLayer {...this.props}/>;
  }
}

export default Demo2MapLayer;
