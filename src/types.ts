export interface RuleOptions {
  allowedColors?: string[];
  allowedFiles?: string[];
  allowBareColors?: boolean;
  checkAllStrings?: boolean;
}

export interface InlineColorRuleOptions {
  allowedProperties?: string[];
  allowedValues?: string[];
  allowedFiles?: string[];
}
