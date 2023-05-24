import React, {Component, useState, useEffect} from 'react';
import {L, IDataProvider} from 'bi-internal/utils'; //  библиотека leaflet из утилс
import ReactDOM from 'react-dom';
import {IVizelConfig, ISubspace} from 'bi-internal/defs/bi';

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

}

interface IDemoLayerState{
  subspace: ISubspace | null;
  layer?: L.layerGroup;
  map?: L.Map;
  active?: boolean;
  rawCfg?: any;
}

interface IDataItem {
  title: string;
  lng: number;
  lat: number;
  fillColor: string;
  borderColor: string;
  value: string;
  measures: IMeasureObj,
  numberValue: number;
  dimensions: IDimension;
}

interface IMeasureObj{
  id: string;
  title: string;
  value: number;
  unit?: string;
  format?: string;
}

export const getLatLng = (subspace: ISubspace, matrix: any, xIndex: number, keys?: {lat: string, lng: string}) => {
  const x = subspace.xs[xIndex];
  // TODO Пока установлено так , потому что конфиги важнее (убрать после проверки)

  const dLatIndex = (x.axisIds.indexOf(keys?.['lat']) !== -1) ? x.axisIds.indexOf(keys?.['lat']) : (x.axisIds.indexOf('lat') !== -1) ? x.axisIds.indexOf('lat') : -1;
  const dLngIndex = (x.axisIds.indexOf(keys?.['lng']) !== -1) ? x.axisIds.indexOf(keys?.['lng']) : (x.axisIds.indexOf('lng') !== -1) ? x.axisIds.indexOf('lng') : -1;
  if (dLatIndex !== -1 && dLngIndex !== -1) {
    return {
      lat: x.ids[dLatIndex],
      lng: x.ids[dLngIndex],
    };
  }
  const mLatIndex = (keys?.['lat']) ? subspace.ys.findIndex((y: any) => y.id === keys?.['lat']) : (subspace.ys.findIndex((y: any) => y.id === 'lat') !== -1) ? subspace.ys.findIndex((y: any) => y.id === 'lat') : -1;
  const mLngIndex = (keys?.['lng']) ? subspace.ys.findIndex((y: any) => y.id === keys?.['lng']) : (subspace.ys.findIndex((y: any) => y.id === 'lng') !== -1) ? subspace.ys.findIndex((y: any) => y.id === 'lng') : -1;
  if (mLatIndex !== -1 && mLngIndex !== -1) {
    return {
      lat: matrix[mLatIndex][xIndex],
      lng: matrix[mLngIndex][xIndex],
    };
  }

  console.log('No lng lat');
  return null;
};

export const LoadingIcon = (props: {color?: string;
} ) => {
  const fillColor = props.color || 'grey';
  return(
    <div className={'rotating'}><svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="16px" height="16px" viewBox="0 0 613.705 613.705" >
      <g>
        <path
          fill={fillColor}
          d="M594.389,274.302c-12.418-12.462-27.193-18.836-44.311-18.836s-31.555,6.087-43.981,18.478
			c-12.418,12.39-18.463,27.215-18.463,44.332c0,17.117,5.959,31.656,18.127,43.975c12.332,12.462,27.193,18.478,44.317,18.478
			s31.893-6.088,44.311-18.478c12.419-12.462,18.464-26.857,18.464-43.975C612.853,301.159,606.808,286.692,594.389,274.302z"/>
        <path
          fill={fillColor}
          d="M474.542,438.453c-16.114,0-29.543,5.371-40.623,16.472c-11.079,11.029-16.45,24.136-16.45,39.893
			c0,15.827,5.285,29.292,16.45,40.68c10.994,11.101,24.509,16.4,40.623,16.4c15.777,0,28.869-5.371,39.949-16.4
			c11.416-11.459,17.124-24.853,17.124-40.68c0-15.757-5.787-28.791-17.124-39.893C503.325,443.896,490.319,438.453,474.542,438.453
			z"/>
        <path
          fill={fillColor}
          d="M482.936,213.855c18.463,0,34.577-6.732,48.006-20.125c13.429-13.464,20.14-29.579,20.14-48.343
			c0-19.123-6.718-35.237-20.14-48.701c-13.092-13.106-29.206-19.767-48.006-19.767c-19.137,0-35.251,6.661-48.343,19.767
			c-13.429,13.464-20.14,29.579-20.14,48.701c0,18.764,6.718,34.878,20.14,48.343C448.021,207.123,464.136,213.855,482.936,213.855z
			"/>
        <path
          fill={fillColor}
          d="M297.284,511.289c-14.102,0-26.27,4.942-36.253,15.112c-9.819,9.955-14.768,22.13-14.768,36.597
			c0,14.109,4.956,26.284,14.768,35.882c9.991,9.883,22.159,14.825,36.253,14.825c14.438,0,26.435-5.157,36.254-14.825
			c9.99-9.812,15.104-21.772,15.104-35.882c0-14.467-5.035-26.856-15.104-36.955C323.805,516.303,311.723,511.289,297.284,511.289z"
        />
        <path
          fill={fillColor}
          d="M297.284,0c-20.476,0-37.937,7.09-52.368,21.486c-14.438,14.467-21.486,31.584-21.486,52.067
			c0,20.483,7.047,38.245,21.486,52.711c14.438,14.396,31.892,21.486,52.368,21.486c20.476,0,37.937-7.09,52.368-21.486
			c14.438-14.467,21.822-32.229,21.822-52.711s-7.384-37.6-21.822-52.067C335.221,7.09,317.76,0,297.284,0z"/>
        <path
          fill={fillColor}
          d="M120.363,179.263c9.067,0,17.447-3.008,24.171-9.74c13.436-13.393,13.436-35.237,0-48.629
			c-6.725-6.732-15.104-9.74-24.171-9.74c-8.73,0-17.002,3.08-23.835,9.74c-13.987,13.536-13.987,35.093,0,48.629
			C103.361,176.184,111.64,179.263,120.363,179.263z"/>
        <path
          fill={fillColor}
          d="M120.363,445.472c-12.418,0-22.997,4.87-32.229,13.822c-8.895,8.522-13.429,19.122-13.429,31.513
			c0,12.461,4.362,23.204,13.429,32.229c9.067,9.096,19.81,13.751,32.229,13.751c12.419,0,23.162-4.655,32.229-13.751
			c9.067-9.024,13.429-19.768,13.429-32.229c0-12.391-4.533-22.99-13.429-31.513C143.36,450.342,132.79,445.472,120.363,445.472z"/>
        <path
          fill={fillColor}
          d="M68.669,290.058c-7.721-7.735-16.788-11.745-27.867-11.745s-20.812,4.01-28.533,11.745S0.853,307.175,0.853,318.275
			c0,11.029,3.695,20.77,11.416,28.505c7.721,7.734,17.454,11.459,28.533,11.459s20.139-3.725,27.867-11.459
			c7.72-7.735,11.752-17.476,11.752-28.505C80.414,307.175,76.389,297.792,68.669,290.058z"/>
      </g>
    </svg></div>);
};

const CircleMapLayer: React.FC = (props: IDemoLayerProps): boolean => {
  const [state, setState] = useState<IDemoLayerState>({
    map: props.map,
    layer: props.leafletLayer,
    rawCfg: props.rawCfg,
    subspace: props.subspace,
    active: props.active,
  });
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // иконка для слоя
  const _icon = <svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke={'grey'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke={'grey'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;


  // создание круговых маркеров по данным
  const _createLayerObjs = () => {
    setLoading(true);

    const layersArr = L.layerGroup([]);

    let itemIdsArr: string[] = [];

    if (data && data.length) {
      data.forEach((d: any) => {
        if (!itemIdsArr.includes(d.title)) itemIdsArr.push(d.title);
        const radius = d.numberValue * 10;

        const circle = L.circle([d.lat, d.lng], {
          color: 'red',
          fillColor: 'blue',
          fillOpacity: 0.3,
          radius: radius
        })
        .bindPopup(d.title);

        if (itemIdsArr.includes(d.title)) {
          layersArr.addLayer(circle);
        }
      });
    }

    return layersArr;
  }

  // трансформируем данные из куба в удобный для нас объект
  const _getData = async () => {
    const {rawCfg, subspace} = state;
    const {dp} = props;

    if (subspace) {
      setLoading(true);

      const display = rawCfg?.display || {};

      // ключи для полей лат и лнг
      const latKey = (display?.lat) ? display.lat : 'lat';
      const lngKey = (display?.lng) ? display.lng : 'lng';

      const matrix = await dp.getMatrixYX(subspace);

      let s = null;

      const ys = subspace.ys || [];
      const measures = subspace.measures || [];
      const cfgValue = rawCfg?.display?.value || null;

      const format = display.format || '# ##,0';

      const mItem = measures.find((m) => String(m?.name) === String(cfgValue));
      const yItem = (mItem) ? ys.find((y) => String(y?.id) === String(mItem.id)) : null;
      const valueMeasureIndex = (yItem) ? ys.indexOf(yItem) : -1;

      let fullData: ReactText | number | string[] = (matrix[valueMeasureIndex]) ? matrix[valueMeasureIndex] : [];

      let sortedData: number[] = [...fullData] || [];
      sortedData.sort((a: number, b: number) => a - b);

      const cfgTitles = rawCfg?.dataSource?.style?.measures || {};
      const dataItems: IDataItem[] = [];
      const xs = subspace?.xs || [];

      xs.forEach((x: any, index) => {
        const indexes = getLatLng(subspace, matrix, index, {
          lat: latKey,
          lng: lngKey,
        });

        const measures = subspace.ys.map((y, ind) => {
          const title = (cfgTitles[y.id] && cfgTitles[y.id]?.title) ? cfgTitles[y.id].title : y.title;
          const unit = y?.unit || '';
          const xFormat = (y && y?.format) ? y?.format : '';

          return {
            id: y.id,
            title: title,
            value: matrix[ind][index],
            unit: unit,
            format: xFormat,
          };
        });

        const lat = indexes?.['lat'] ? indexes?.['lat'] : null;
        const lng = indexes?.['lng'] ? indexes?.['lng'] : null;

        if ((lat && isFinite(lat)) && (lng && isFinite(lng))) {

          const indexesForTitle = [];
          if (x?.axisIds.indexOf('title') !== -1) {
            indexesForTitle.push(x.axisIds.indexOf('title'));
          } else {
            x?.axisIds.map((it, num) => {
              if (it !== latKey && it !== lngKey) indexesForTitle.push(num);
            });
          }

          let title = (x?.titles || [].filter).map((t: string, ind: number) => {
            if (indexesForTitle.includes(ind)) return t;
            return '';
          }).join(` `).trim();

          const dimensions = xs.find((x: any) => x.ids.includes(title || '')) || {};
          const value = matrix[0][index];

          const color = (s) ? s.getColor(null, matrix[0][index]) : 'grey';
          const borderColor = display.borderColor || 'darkgray'

          dataItems.push({
            title: title,
            lng: lng,
            lat: lat,
            fillColor: color,
            borderColor: borderColor,
            value: value,
            measures: measures,
            numberValue: matrix[0][index],
            dimensions: dimensions,
          });
        }
      });

      setData(dataItems);
    }
  }

  // Сохраняем субсейс и объект карты
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

  // при изменении берем новые данные
  useEffect(() => {
    if (state.subspace, state.map) _getData();
  }, [state.subspace, state.map]);

  // создаем объекты для карты и добавляем в слой
  useEffect(() => {
    setLoading(true);

    if (state.map?.hasLayer(state.layer)) {
      state.map?.removeLayer(state.layer);
    }

    // создаем круги
    const thisLayer = _createLayerObjs();

    const newState = {
      ...state,
      layer: thisLayer,
    }

    setState(newState);

  }, [data]);

  useEffect(() => {
    if (state.map && state.layer) {
      if (props.active && !(state.map.hasLayer(state.layer))) {
        state.layer.addTo(state.map);

        setTimeout(() => {
          setLoading(false);
        }, 700);

      } else if (!props.active) {
        props.map.removeLayer(state.layer);
      }
    }
  }, [state.layer, props.active]);

  // функция установка иконки для кнопки (иконка слоя или загрузка)
  const _setButtonIcon = () => {
    if (props.button?.current) {
      const iconDiv = props.button?.current.querySelector('.layerButtonIcon');
      if (iconDiv) {
        if (loading === true) {
          const fillColor = 'red';
          ReactDOM.render(<LoadingIcon color={fillColor} />, iconDiv);
        } else {
          ReactDOM.render(_icon, iconDiv);
        }
      }
    }
  }

  useEffect(() => {
    _setButtonIcon();
  }, [loading]);

  return (true);
}

// компонент контейнер для того что бы запустить функциональный компонент в ресурсах
class DemoMapLayer extends Component<any, any>{
  public render() {
    return <CircleMapLayer {...this.props}/>;
  }
}

export default DemoMapLayer;
