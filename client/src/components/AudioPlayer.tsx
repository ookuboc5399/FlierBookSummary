import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PlayCircle, PauseCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  url: string;
  onClose: () => void;
}

export function AudioPlayer({ url, onClose }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const onEnd = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", onEnd);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-2">
      <audio ref={audioRef} src={url} />
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={togglePlay}>
          {isPlaying ? (
            <PauseCircle className="h-4 w-4" />
          ) : (
            <PlayCircle className="h-4 w-4" />
          )}
        </Button>
        <Slider
          value={[currentTime]}
          max={duration}
          step={0.1}
          onValueChange={handleSeek}
          className="flex-1"
        />
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="text-xs text-muted-foreground flex justify-between">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
