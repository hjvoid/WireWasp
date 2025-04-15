export interface ScanResult {
  url: string
  formScanResult?: FormScanResult
  paramBasedSQLI?: ParamSQLInjectionResult[]
}     

export interface ParamSQLInjectionResult {
  vulnerableUrl: string
  parameter: string
  payload: string
  indicator: string
  injectionFound?: boolean
}

export interface FormScanResult {
  action: string
  method: string
  inputs: string[]
}