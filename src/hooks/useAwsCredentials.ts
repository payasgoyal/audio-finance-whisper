import { useState, useEffect } from 'react';

interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

const STORAGE_KEY = 'aws_credentials';

export const useAwsCredentials = () => {
  const [credentials, setCredentials] = useState<AwsCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load credentials from local storage on component mount
  useEffect(() => {
    const loadCredentials = () => {
      try {
        const storedCredentials = localStorage.getItem(STORAGE_KEY);
        console.log('Stored credentials:', storedCredentials);
        if (storedCredentials) {
          setCredentials(JSON.parse(storedCredentials));
        }
      } catch (error) {
        console.error('Error loading AWS credentials from local storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCredentials();
  }, []);

  // Save credentials to local storage
  const saveCredentials = (newCredentials: AwsCredentials) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCredentials));
      setCredentials(newCredentials);
      return true;
    } catch (error) {
      console.error('Error saving AWS credentials to local storage:', error);
      return false;
    }
  };

  // Clear credentials from local storage
  const clearCredentials = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setCredentials(null);
      return true;
    } catch (error) {
      console.error('Error clearing AWS credentials from local storage:', error);
      return false;
    }
  };

  return {
    credentials,
    isLoading,
    saveCredentials,
    clearCredentials,
    hasCredentials: !!credentials
  };
};

export default useAwsCredentials; 