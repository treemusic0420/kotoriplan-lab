export type AnalysisDimension = { id:string; ownerUserId:string; key:string; name:string; sortOrder:number }
export type AnalysisDimensionValue = { id:string; ownerUserId:string; analysisDimensionId:string; code:string|null; name:string; sortOrder:number }
