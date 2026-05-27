export type PlDataSource='scenario_forecast'|'sample_pl_facts'
export type SamplePlFilter={version:string;year:number;organizationKey:string;analysisDimensionId?:string;analysisDimensionValueId?:string}
export type PlByDimensionFilter={version:string;year:number;month:number;organizationKey:string;analysisDimensionId:string}

export type PLCell={yearMonth:string; amount:number|null}
export type PLRow={accountId:string;accountCode:string;accountName:string;accountType:string;cells:PLCell[]}
