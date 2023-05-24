import {BaseService} from "bi-internal/core";
import {getKoobDataByCfg} from "../utils/utils";
import {UrlState} from "bi-internal/core";

export interface IMyCustomModel{
  loading: boolean;
  error: string;
  data?: any;
  min?: {name: string, value: number}
}


export class MyCustomService extends BaseService<IMyCustomModel> {
  private readonly id: string | number;

  private constructor(koobId: string, columns: string[], filters: any) {
    super({
      loading: true,
      error: null,
      data: [],
      min: {name: "", value: 0}
    });
    this.id = koobId;
    getKoobDataByCfg({
      with: koobId,
      columns,
      filters
    }).then(data => {
      let min = {value: 0, name: ""};
      data.map(el => {
        if (!min.value || el.value < min.value) {
          min = {...el};
        }
      })
      const urlState = UrlState.getInstance();
      if (!urlState?.getModel()?._myCustomFilters?.[String(this.id)]) {
        urlState.updateModel({
          _myCustomFilters: {
            ...urlState.getModel()._myCustomFilters,
            [String(this.id)]: {
              data,
              min
            }
          }
        });
      }
    });
    UrlState.getInstance().subscribeAndNotify('_myCustomFilters', this._onUrlUpdated);
  }

  private _onUrlUpdated = (model) => {
    if (model.loading || model.error) return;

    this._updateWithData({
      data: model._myCustomFilters[String(this.id)].data,
      min: model._myCustomFilters[String(this.id)].min
    });
  }
/*
  public setFilter(name) {
    const urlState = UrlState.getInstance();
    urlState.updateModel({
      _myCustomFilters: {
        ...urlState.getModel()._myCustomFilters,
        [String(this.id)]: {
          ...urlState.getModel()._myCustomFilters[String(this.id)],
          data: []
        }
      }
    });
  }
*/

  protected _dispose() {
    if (window.__myCustomService && window.__myCustomService[String(this.id)]) {
      delete window.__myCustomService[String(this.id)];
    }
    super._dispose();
  }
  public static createInstance (id: string | number, columns: string[], filters: any) : MyCustomService {
    if (!(window.__myCustomService)) {
      window.__myCustomService = {};
    }
    if (!window.__myCustomService.hasOwnProperty(String(id))) {
      window.__myCustomService[String(id)] = new MyCustomService(String(id), columns, filters);
    }
    return window.__myCustomService[String(id)];
  };

}
