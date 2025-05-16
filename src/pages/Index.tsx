import React, { useState, useRef } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Upload, Play, Square, Pause, CheckCircle, XCircle, RefreshCw, Copy, ExternalLink } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/components/ui/sonner";
import AudioRecorder from "@/components/AudioRecorder";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const Index = () => {
  const isMobile = useIsMobile();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleAudioRecorded = (blob: Blob) => {
    setAudioBlob(blob);
    setIsRecording(false);
    setIsPaused(false);
    toast.success("Recording completed!", {
      description: "You can now play or upload your recording"
    });
  };

  const playRecording = () => {
    if (!audioBlob || !audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(error => {
        console.error("Error playing audio:", error);
        toast.error("Could not play the recording");
      });
      audioRef.current.onended = () => setIsPlaying(false);
      setIsPlaying(true);
    }
  };

  const uploadRecording = async () => {
    if (!audioBlob) {
      toast.error("No recording to upload");
      return;
    }

    setIsUploading(true);
    try {
      // Import AWS S3 upload functions
      const { uploadToS3WithProgress, generateUniqueFilename, testAwsConnection } = await import('@/integrations/aws/s3upload');
      
      // Test AWS connection first
      console.log("Testing AWS connection before upload...");
      setUploadProgress(10); // Show some initial progress
      
      const testResult = await testAwsConnection({
        accessKeyId: 'AKIAWH2QMV5DRJRFD255',
        secretAccessKey: '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',
        region: 'us-west-2'
      });
      
      if (!testResult.success) {
        console.error("AWS connection test failed:", testResult.message, testResult.details);
        throw new Error(`AWS connection test failed: ${testResult.message}`);
      }
      
      console.log("AWS connection test successful, proceeding with upload");
      setUploadProgress(20); // Update progress after connection test
      
      // Generate a unique filename
      const fileName = generateUniqueFilename('wav');
      
      // Reset and track upload progress
      const handleProgress = (progress: number) => {
        // Scale progress to start from 20% (after connection test)
        const scaledProgress = 20 + Math.round(progress * 0.8);
        console.log(`Upload progress: ${progress}% (scaled: ${scaledProgress}%)`);
        setUploadProgress(scaledProgress);
      };
      
      console.log("Uploading to AWS S3...");
      const publicUrl = await uploadToS3WithProgress(
        audioBlob,
        fileName,
        'audio/wav',
        null, // No need to pass credentials as they're hardcoded in s3client.ts
        handleProgress
      );
      
      if (!publicUrl) {
        throw new Error('Failed to upload file to AWS S3');
      }
      
      // Save the uploaded file URL to state
      setUploadedFileUrl(publicUrl);
      
      toast.success("Recording uploaded successfully to AWS S3", {
        description: "Audio file is now accessible via URL"
      });
      
      console.log("File uploaded to AWS S3. Public URL:", publicUrl);
      
      // Send to webhook
      const formData = new FormData();
      // Only sending the URL to the webhook, not the file itself
      formData.append("audioUrl", publicUrl);

      const response = await fetch("https://hawkmajestic.app.n8n.cloud/webhook/41fd0dc7-c936-4945-bf25-5a5ce6206361", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setAudioBlob(null);
      } else {
        console.warn(`Webhook call failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload recording to AWS S3");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePauseRecording = () => {
    setIsPaused(true);
  };

  const handleResumeRecording = () => {
    setIsPaused(false);
  };

  const handleCancelRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    toast.info("Recording cancelled");
  };

  const handleCompleteRecording = () => {
    // This will trigger the onRecordingComplete in AudioRecorder component
    setIsRecording(false);
  };

  const handleNewRecording = () => {
    // Clean up previous recording if it exists
    if (audioRef.current) {
      if (!audioRef.current.paused) {
        audioRef.current.pause();
      }
      audioRef.current.src = '';
    }
    
    // Reset all recording states
    setAudioBlob(null);
    setIsPlaying(false);
    setIsRecording(false);
    setIsPaused(false);
    setUploadedFileUrl(null);
    setUploadProgress(0);
    
    // Prepare for a new recording
    toast.info("Ready for a new recording");
  };
  
  const copyUrlToClipboard = () => {
    if (uploadedFileUrl) {
      navigator.clipboard.writeText(uploadedFileUrl)
        .then(() => toast.success("URL copied to clipboard"))
        .catch(() => toast.error("Failed to copy URL"));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#6152f9] to-[#3e30b7] flex flex-col">
      {/* Navigation */}
      <header className="w-full p-4">
        <div className="container flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-white">
              <img 
                src="/lovable-uploads/207220f5-9220-44f7-b31f-111015928121.png" 
                alt="Personal Finance Logo" 
                className="h-full w-full object-cover"
              />
            </div>
            <h1 className="text-white font-bold text-xl">PERSONAL FINANCE</h1>
          </div>
          <div className="flex items-center gap-4">
            {!isMobile && (
              <nav>
                <ul className="flex space-x-6">
                  {["HOME", "CONTACT US"].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-white hover:text-white/80">{item}</a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Content */}
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">YOUR OWN PERSONAL FINANCE CHATBOT</h2>
            <p className="text-white/90 mb-8">
              Record your personal financial transactions by recording an audio and let our AI analyze your financial habits.
              Just speak for up to 10 seconds and our system will process your audio.
            </p>
          </div>

          {/* Right Content - Audio Recorder Card */}
          <div>
            <Card className={cn(
              "backdrop-blur-xl bg-white/90 shadow-xl transition-all",
              isRecording && !isPaused && "ring-4 ring-red-500",
              isPaused && "ring-4 ring-yellow-500"
            )}>
              <CardHeader>
                <CardTitle className="text-center text-[#6152f9]">Voice Your Financial Needs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center gap-6">
                  <div className="h-32 w-32 rounded-full flex items-center justify-center bg-gradient-to-r from-[#6152f9] to-[#3e30b7] text-white">
                    {isRecording ? (
                      isPaused ? <Mic size={48} /> : <MicOff size={48} className="animate-pulse" />
                    ) : (
                      <Mic size={48} />
                    )}
                  </div>
                  
                  {audioBlob && (
                    <div className="w-full flex justify-center">
                      <audio ref={audioRef} className="hidden" />
                      <Button 
                        onClick={playRecording} 
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        {isPlaying ? <Square /> : <Play />}
                        {isPlaying ? "Stop" : "Play Recording"}
                      </Button>
                    </div>
                  )}
                  
                  {/* Show uploaded file URL */}
                  {uploadedFileUrl && (
                    <div className="w-full flex flex-col gap-2">
                      <p className="text-sm text-gray-500 font-medium">File uploaded successfully:</p>
                      <div className="flex gap-2">
                        <Input 
                          value={uploadedFileUrl} 
                          readOnly 
                          className="flex-1 text-sm bg-gray-50 font-mono"
                        />
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={copyUrlToClipboard}
                          title="Copy S3 URI to clipboard"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        S3 URI format: <code>s3://bucket-name/file-path</code>
                      </p>
                    </div>
                  )}
                  
                  <AudioRecorder
                    isRecording={isRecording}
                    setIsRecording={setIsRecording}
                    onRecordingComplete={handleAudioRecorded}
                    maxRecordingTime={10000}
                    isPaused={isPaused}
                  />

                  {/* Recording Controls */}
                  {isRecording && (
                    <div className="w-full flex justify-center gap-2">
                      {isPaused ? (
                        <Button 
                          onClick={handleResumeRecording}
                          variant="outline" 
                          className="flex items-center gap-1"
                        >
                          <Mic className="h-4 w-4" />
                          Resume
                        </Button>
                      ) : (
                        <Button 
                          onClick={handlePauseRecording}
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Pause className="h-4 w-4" />
                          Pause
                        </Button>
                      )}
                      <Button 
                        onClick={handleCompleteRecording}
                        variant="outline"
                        className="flex items-center gap-1 bg-green-100 hover:bg-green-200"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Complete
                      </Button>
                      <Button 
                        onClick={handleCancelRecording}
                        variant="outline" 
                        className="flex items-center gap-1 bg-red-100 hover:bg-red-200"
                      >
                        <XCircle className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <div className="w-full flex justify-center gap-2">
                  {!isRecording && (
                    <>
                      {!audioBlob ? (
                        <Button 
                          onClick={() => setIsRecording(true)}
                          className="bg-[#6152f9] hover:bg-[#3e30b7]"
                        >
                          <Mic className="mr-2" />
                          Start Recording
                        </Button>
                      ) : (
                        <>
                          {isUploading && (
                            <div className="w-full mb-2">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-[#6152f9] h-2.5 rounded-full transition-all duration-300" 
                                  style={{ width: `${uploadProgress}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-center mt-1 text-gray-500">
                                Uploading via S3: {uploadProgress}%
                              </p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button 
                              onClick={uploadRecording}
                              disabled={isUploading}
                              className="bg-[#6152f9] hover:bg-[#3e30b7]"
                            >
                              <Upload className="mr-2" />
                              {isUploading ? "Uploading..." : "Upload Recording"}
                            </Button>
                            <Button 
                              onClick={handleNewRecording}
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              <RefreshCw className="h-4 w-4" />
                              New Recording
                            </Button>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      
      <footer className="p-4 text-center text-white/70">
        <p>&copy; {new Date().getFullYear()} Personal Finance at Your Lips. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
