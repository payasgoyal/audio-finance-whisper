
import { useEffect, useRef } from "react";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

interface AudioRecorderProps {
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  onRecordingComplete: (audioBlob: Blob) => void;
  maxRecordingTime: number;
}

const AudioRecorder = ({
  isRecording,
  setIsRecording,
  onRecordingComplete,
  maxRecordingTime = 10000, // Default 10 seconds
}: AudioRecorderProps) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Setup and cleanup recording
  useEffect(() => {
    const startRecording = async () => {
      audioChunksRef.current = [];
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        mediaRecorderRef.current = new MediaRecorder(stream);
        
        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          onRecordingComplete(audioBlob);
          
          // Stop all tracks to release microphone
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorderRef.current.onerror = (e) => {
          console.error("MediaRecorder error:", e);
          toast.error("Error while recording");
          setIsRecording(false);
        };
        
        // Start recording
        mediaRecorderRef.current.start();
        
        // Set timer for maximum recording duration
        if (progressBarRef.current) {
          progressBarRef.current.style.transition = `width ${maxRecordingTime}ms linear`;
          progressBarRef.current.style.width = '100%';
        }
        
        timerRef.current = setTimeout(() => {
          if (isRecording && mediaRecorderRef.current?.state === 'recording') {
            stopRecording();
          }
        }, maxRecordingTime);
        
      } catch (error) {
        console.error("Error accessing microphone:", error);
        toast.error("Could not access microphone. Please check permissions.");
        setIsRecording(false);
      }
    };
    
    const stopRecording = () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      
      if (progressBarRef.current) {
        progressBarRef.current.style.transition = 'none';
        progressBarRef.current.style.width = '0%';
      }
    };
    
    if (isRecording) {
      startRecording();
    } else if (mediaRecorderRef.current?.state === 'recording') {
      stopRecording();
    }
    
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isRecording, maxRecordingTime, onRecordingComplete, setIsRecording]);
  
  return (
    <div className="w-full">
      {isRecording && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <div 
            ref={progressBarRef}
            className={cn(
              "h-2.5 rounded-full w-0 bg-gradient-to-r from-[#6152f9] to-[#3e30b7]"
            )}
          ></div>
          <p className="text-sm text-gray-500 mt-1 text-center">
            Recording... (Max 10 seconds)
          </p>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
