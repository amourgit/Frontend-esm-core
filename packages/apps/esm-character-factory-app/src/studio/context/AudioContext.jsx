import React, {useState, useEffect, createContext} from 'react';
export const AudioContext = createContext();
import bgm from "../../public/sound/background/cc_bgm_balanced.wav"

export const AudioProvider = ({ children }) => {
    const [isMute, setMute] = useState(false);
    const audioRef = React.useRef(null);
    const fadeRef = React.useRef(null);

    // EGEN: un <audio> retiré du DOM continue de jouer ; on l'arrête (et son fondu) au démontage de l'app
    // (l'élément est capturé au montage : au démontage React a déjà remis audioRef.current à null)
    useEffect(() => {
        const audio = audioRef.current
        return () => {
            clearInterval(fadeRef.current)
            if (audio) {
                audio.pause()
                audio.removeAttribute('src')
                audio.load?.()
            }
        }
    }, [])

    const enableAudio = () => {
        setMute(false)
        // append the background music to the body and play, using html
        // audio element
        const audio = audioRef.current;
        audio.src = bgm
        audio.loop = true
        audio.volume = 0.0
        audio.play()
        // fade audio in over 5 seconds in 1/60th of a second intervals
        let volume = 0.0
        const seconds = 5.0
        const interval = fadeRef.current = setInterval(() => {
            volume = Math.max(volume + 1.0 / (10 * seconds * 60.0), 1.0)
            if (volume >= 1.0) {
                clearInterval(interval)
            }
            audio.volume = volume

        }, 1000 / 60)
    }

    const disableAudio = () => {
        setMute(true)
        const audio = audioRef.current;
        // pause audio
        audio.pause()
    }


    return (
        <AudioContext.Provider value={{
            isMute, setMute,
            enableAudio, disableAudio
        }}>
            <audio ref={audioRef} />
            {children}
        </AudioContext.Provider>
    )
}