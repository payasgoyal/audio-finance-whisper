
import { useState, useRef } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Upload, Play, Square } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/components/ui/sonner";
import AudioRecorder from "@/components/AudioRecorder";
import { cn } from "@/lib/utils";

const Index = () => {
  const isMobile = useIsMobile();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleAudioRecorded = (blob: Blob) => {
    setAudioBlob(blob);
    setIsRecording(false);
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
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");

      const response = await fetch("https://hawkmajestic.app.n8n.cloud/webhook-test/41fd0dc7-c936-4945-bf25-5a5ce6206361", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("Recording uploaded successfully");
        setAudioBlob(null);
      } else {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload recording");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#6152f9] to-[#3e30b7] flex flex-col">
      {/* Navigation */}
      <header className="w-full p-4">
        <div className="container flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-white rotate-45"></div>
            <h1 className="text-white font-bold text-xl">FINANCIAL VOICE</h1>
          </div>
          {!isMobile && (
            <nav>
              <ul className="flex space-x-6">
                {["HOME", "ABOUT", "SERVICES", "NEWS", "CONTACT US"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-white hover:text-white/80">{item}</a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Content */}
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">PERSONAL FINANCE AT YOUR LIPS</h2>
            <p className="text-white/90 mb-8">
              Record your voice and let our AI analyze your financial questions and needs.
              Just speak for up to 10 seconds and our system will process your audio.
            </p>
            <div className="hidden md:block">
              <Button 
                onClick={() => setIsRecording(true)}
                disabled={isRecording}
                className="bg-white text-[#6152f9] hover:bg-white/90"
              >
                EXPLORE
              </Button>
            </div>
          </div>

          {/* Right Content - Audio Recorder Card */}
          <div>
            <Card className={cn(
              "backdrop-blur-xl bg-white/90 shadow-xl transition-all",
              isRecording && "ring-4 ring-red-500"
            )}>
              <CardHeader>
                <CardTitle className="text-center text-[#6152f9]">Voice Your Financial Needs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center gap-6">
                  <div className="h-32 w-32 rounded-full flex items-center justify-center bg-gradient-to-r from-[#6152f9] to-[#3e30b7] text-white">
                    {isRecording ? (
                      <MicOff size={48} className="animate-pulse" />
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
                  
                  <AudioRecorder
                    isRecording={isRecording}
                    setIsRecording={setIsRecording}
                    onRecordingComplete={handleAudioRecorded}
                    maxRecordingTime={10000}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <div className="w-full flex justify-center">
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
                        <Button 
                          onClick={uploadRecording}
                          disabled={isUploading}
                          className="bg-[#6152f9] hover:bg-[#3e30b7]"
                        >
                          <Upload className="mr-2" />
                          {isUploading ? "Uploading..." : "Upload Recording"}
                        </Button>
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
