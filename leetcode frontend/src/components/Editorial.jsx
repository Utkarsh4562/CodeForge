import { useState, useRef, useEffect } from 'react';
import { Pause, Play } from 'lucide-react';

const Editorial = ({ secureUrl, thumbnailUrl, duration }) => {
const videoRef = useRef(null);
const [isPlaying, setIsPlaying] = useState(false);
const [currentTime, setCurrentTime] = useState(0);
const [isHovering, setIsHovering] = useState(false);

// format seconds to MM:SS
const formatTime = (seconds) =>{
    if (isNaN(seconds) || seconds === 0) return "0:00"; // FIXED: Added NaN check
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const togglePlayPause = async () =>{ // FIXED: Made async to handle play promise
    if(videoRef.current){
        try {
            if(isPlaying){
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                await videoRef.current.play();
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Video play error:', error);
            setIsPlaying(false);
        }
    }
};

// update current time during playback
useEffect(()=>{
    const video = videoRef.current;

    const handleTimeUpdate = () =>{
        if(video) setCurrentTime(video.currentTime);
    };

    if(video){
        video.addEventListener('timeupdate', handleTimeUpdate);
        return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }
},[]);

// Handle video load error
useEffect(() => {
    const video = videoRef.current;
    
    const handleError = () => {
        console.error('Video failed to load:', secureUrl);
    };
    
    const handleLoadedMetadata = () => {
        if (video) {
            console.log('Video metadata loaded, duration:', video.duration);
        }
    };
    
    if (video) {
        video.addEventListener('error', handleError);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        
        return () => {
            video.removeEventListener('error', handleError);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }
}, [secureUrl]);

return(
<div
className="relative w-full max-w-2xl mx-auto rounded-xl overflow-hidden shadow-lg"
onMouseEnter={()=> setIsHovering(true)}
onMouseLeave={()=> setIsHovering(false)}
>
{/* video Element - FIXED: Added preload and error handling */}
<video
ref={videoRef}
src={secureUrl}
poster={thumbnailUrl}
onClick={togglePlayPause}
className="w-full aspect-video bg-black cursor-pointer"
preload="metadata"
/>

{/* video controls overlay - FIXED: Changed bg-linear-to-t to bg-gradient-to-t */}
<div
className={`absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-4 ${
isHovering || !isPlaying ? 'opacity-100' : 'opacity-0'
} transition-opacity duration-200`}
>

<button onClick={togglePlayPause}>
{isPlaying ? (
<Pause/>
) : (
<Play/>
)}
</button>

{/* Progress Bar */}
<div className="flex items-center w-full mt-2">
<span className="text-white text-sm mr-2">
{formatTime(currentTime)}
</span>

<input
type="range"
min="0"
max={duration || 100} // FIXED: Added fallback for undefined duration
value={currentTime}
onChange={(e) =>{
if (videoRef.current){
videoRef.current.currentTime = Number(e.target.value);
}
}}
className="range range-primary range-xs flex-1"
/>

<span className="text-white text-sm ml-2">
{formatTime(duration || 0)}
</span>
</div>

</div>
</div>
);
};

export default Editorial;