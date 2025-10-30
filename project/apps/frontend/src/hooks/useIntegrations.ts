import { useState, useEffect, useCallback } from 'react';
import { integrationsApi } from '../lib/apiClient';
import {
  Integration,
  IntegrationTestResult,
  WebhookPayload,
  CreateIntegrationInput,
  UpdateIntegrationInput,
} from '../types/unified';

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      // Fetching integrations
      const response = await integrationsApi.getIntegrations();
      // Integrations response received
      setIntegrations(response.data.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch integrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const createIntegration = async (data: CreateIntegrationInput) => {
    try {
      const response = await integrationsApi.createIntegration(data);
      setIntegrations(prev => [response.data.data, ...prev]);
      return response.data.data;
    } catch (err) {
      setError('Failed to create integration');
      throw err;
    }
  };

  const updateIntegration = async (
    id: string,
    data: UpdateIntegrationInput
  ) => {
    try {
      const response = await integrationsApi.updateIntegration(id, data);
      setIntegrations(prev =>
        prev.map(integration =>
          integration.id === id ? response.data.data : integration
        )
      );
      return response.data.data;
    } catch (err) {
      setError('Failed to update integration');
      throw err;
    }
  };

  const deleteIntegration = async (id: string) => {
    try {
      await integrationsApi.deleteIntegration(id);
      setIntegrations(prev =>
        prev.filter(integration => integration.id !== id)
      );
    } catch (err) {
      setError('Failed to delete integration');
      throw err;
    }
  };

  const testIntegration = async (
    id: string
  ): Promise<IntegrationTestResult> => {
    try {
      const response = await integrationsApi.testIntegration(id);
      return response.data.data;
    } catch (err) {
      setError('Failed to test integration');
      throw err;
    }
  };

  const sendWebhook = async (id: string, payload: WebhookPayload) => {
    try {
      const response = await integrationsApi.sendWebhook(id, payload);
      return response.data.data;
    } catch (err) {
      setError('Failed to send webhook');
      throw err;
    }
  };

  return {
    integrations,
    loading,
    error,
    fetchIntegrations,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testIntegration,
    sendWebhook,
  };
}

export function useIntegration(id: string) {
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegration = useCallback(async () => {
    try {
      setLoading(true);
      const response = await integrationsApi.getIntegration(id);
      setIntegration(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch integration');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchIntegration();
    }
  }, [id, fetchIntegration]);

  return {
    integration,
    loading,
    error,
    fetchIntegration,
  };
}
