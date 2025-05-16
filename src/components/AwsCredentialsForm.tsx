import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { testAwsConnection } from "@/integrations/aws/s3upload";
import { Loader2 } from "lucide-react";

interface AwsCredentialsFormProps {
  onSave: (credentials: { accessKeyId: string; secretAccessKey: string; region: string }) => void;
  onCancel: () => void;
}

const AwsCredentialsForm = ({ onSave, onCancel }: AwsCredentialsFormProps) => {
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [region, setRegion] = useState("us-west-2");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string | unknown;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessKeyId || !secretAccessKey) {
      toast.error("Please provide both Access Key ID and Secret Access Key");
      return;
    }
    
    onSave({
      accessKeyId,
      secretAccessKey,
      region
    });
    
    toast.success("AWS credentials saved");
  };
  
  const handleTestConnection = async () => {
    if (!accessKeyId || !secretAccessKey) {
      toast.error("Please provide both Access Key ID and Secret Access Key");
      return;
    }
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await testAwsConnection({
        accessKeyId,
        secretAccessKey,
        region
      });
      
      setTestResult(result);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      setTestResult({
        success: false,
        message: "Error testing connection",
        details: error instanceof Error ? error.message : "Unknown error"
      });
      toast.error("Failed to test connection");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>AWS S3 Credentials</CardTitle>
        <CardDescription>
          Enter your AWS credentials to upload files to S3.
          These will be stored in your browser's local storage.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accessKeyId">Access Key ID</Label>
            <Input
              id="accessKeyId"
              value={accessKeyId}
              onChange={(e) => setAccessKeyId(e.target.value)}
              placeholder="AKIAIOSFODNN7EXAMPLE"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secretAccessKey">Secret Access Key</Label>
            <Input
              id="secretAccessKey"
              type="password"
              value={secretAccessKey}
              onChange={(e) => setSecretAccessKey(e.target.value)}
              placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="us-west-2"
              required
            />
            <p className="text-xs text-gray-500">
              This should match the region where your S3 bucket is located
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {testResult && (
            <div className={`w-full p-3 rounded-md text-sm ${
              testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <p className="font-medium">{testResult.message}</p>
              {!testResult.success && testResult.details && (
                <p className="mt-1 text-xs opacity-80">{String(testResult.details)}</p>
              )}
            </div>
          )}
          
          <div className="flex justify-between w-full">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleTestConnection}
                disabled={isTesting}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
              <Button 
                type="submit"
                disabled={isTesting}
              >
                Save Credentials
              </Button>
            </div>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default AwsCredentialsForm; 