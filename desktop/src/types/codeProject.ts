export type CodeProjectAnalysisMode = "local" | "connected";
export type CodeProjectStatus = "not-configured" | "testing" | "ready" | "error";

export interface CodeProjectSonarQubeConfig {
  analysisMode: CodeProjectAnalysisMode;
  apiUrl: string;
  projectKey: string;
  authToken: string;
  pollingInterval: string;
  syncRules: boolean;
  localRulesProfile: string;
}

export interface CodeProject {
  id: string;
  label: string;
  repositoryUrl: string;
  analysisMode: CodeProjectAnalysisMode;
  sonarqubeConfig?: CodeProjectSonarQubeConfig;
  enabled: boolean;
  status: CodeProjectStatus;
  errorMessage?: string;
  lastCheckedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CodeProjectFormDraft {
  id?: string;
  label: string;
  repositoryUrl: string;
  analysisMode: CodeProjectAnalysisMode;
  sonarqubeApiUrl: string;
  sonarqubeProjectKey: string;
  sonarqubeAuthToken: string;
  sonarqubePollingInterval: string;
  sonarqubeSyncRules: boolean;
  localRulesProfile: string;
}

export interface UpsertCodeProjectInput {
  label: string;
  repositoryUrl: string;
  sonarqubeConfig?: CodeProjectSonarQubeConfig;
}
