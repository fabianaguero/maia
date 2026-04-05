export interface BaseAssetCategoryOption {
  id: string;
  label: string;
  description: string;
}

export interface BaseAssetCategoryCatalog {
  defaultBaseAssetCategoryId: string;
  baseAssetCategories: BaseAssetCategoryOption[];
}
