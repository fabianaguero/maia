export interface CodeProjectSonarQubeConfig {
  apiUrl: string;
  projectKey: string;
  authToken: string;
  pollingInterval: string;
}

export interface CodeProject {
  id: string;
  label: string;
  repositoryUrl: string;
  sonarqubeConfig?: CodeProjectSonarQubeConfig;
  enabled: boolean;
  status: 'not-configured' | 'testing' | 'ready' | 'error';
  errorMessage?: string;
  lastCheckedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CodeProjectFormDraft {
  id?: string;
  label: string;
  repositoryUrl: string;
  sonarqubeApiUrl: string;
  sonarqubeProjectKey: string;
  sonarqubeAuthToken: string;
  sonarqubePollingInterval: string;
}

export interface UpsertCodeProjectInput {
  id?: string;
  label: string;
  repositoryUrl: string;
  sonarqubeConfig?: CodeProjectSonarQubeConfig;
}
